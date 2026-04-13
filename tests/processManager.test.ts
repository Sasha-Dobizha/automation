import { faker } from "@faker-js/faker";
import { expect } from "@playwright/test";
import { test } from "../fixtures/base.fixture";
import { AUTH_PATHS } from "../config/auth.config";
import { PROCESS_MANAGER_CONFIG } from "../data/flow/processManager.data";
import { newProcess, ProcessData } from "../factories/processManager.factory";
import { ProcessManagerPage } from "../pages/flow/processManager.page";

const { selectors } = PROCESS_MANAGER_CONFIG;

test.describe("Flow - Process Manager", () => {
    test.use({ storageState: AUTH_PATHS.adminState });

    const processesToCleanup: string[] = [];

    test.describe.serial("Create Service Ticket", () => {
        const processData: ProcessData = newProcess.build();
        const triggerProcessData: ProcessData = newProcess.build();
        processesToCleanup.push(processData.name, triggerProcessData.name);

        test("Create Service Ticket Process", async ({
            processManagerPage,
        }) => {
            await processManagerPage.createProcess(processData);
            await processManagerPage.verifyOnProcessManagerPage();
        });

        test("Edit Process - Add and Configure Delegate Step", async ({
            processManagerPage,
        }) => {
            await processManagerPage.searchAndOpenEditor(processData.name);
            await processManagerPage.addDelegateStepAndOpenConfig(
                "Create Service Ticket",
            );
            await processManagerPage.fillTicketName(processData.ticketName);
            await processManagerPage.selectStepType("Service Ticket");
        });

        test("Deploy Service Ticket Process", async ({
            processManagerPage,
        }) => {
            await processManagerPage.openAndDeploy(processData.name);
        });

        test("Trigger Service Ticket Process", async ({
            processManagerPage,
        }) => {
            await processManagerPage.triggerAndVerifyProcess(processData.name);
        });

        test("Create Trigger Process", async ({
            processManagerPage,
        }) => {
            await processManagerPage.createProcess(triggerProcessData);
            await processManagerPage.verifyOnProcessManagerPage();
        });

        test("Edit Trigger Process - Add Initial Parameter, Trigger Step and Deploy", async ({
            processManagerPage,
        }) => {
            await processManagerPage.searchAndOpenEditor(
                triggerProcessData.name,
            );
            await processManagerPage.addInitialParameter(
                selectors.initialParameterName,
                "Anything",
            );
            await processManagerPage.addDelegateStepAndOpenConfig(
                "Trigger Process",
            );
            await processManagerPage.selectChildProcess(processData.name);
            await processManagerPage.deployProcess(triggerProcessData.name);
        });

        test("Trigger Process with Trigger Process Step", async ({
            processManagerPage,
        }) => {
            await processManagerPage.triggerAndVerifyProcess(
                triggerProcessData.name,
                {
                    requiresExecutionInput: true,
                    firstName: faker.person.firstName(),
                },
            );
        });

    });

    test.describe.serial("Export/Import", () => {
        let exportProcessName: string;
        let exportedFilePath: string;

        test.beforeAll(async ({ browser }) => {
            exportProcessName =
                await ProcessManagerPage.createProcessForTests(browser);
            processesToCleanup.push(exportProcessName);
        });

        test("Export process", async ({ processManagerPage }) => {
            exportedFilePath =
                await processManagerPage.exportProcess(exportProcessName);
            expect(exportedFilePath).toBeTruthy();
        });

        test.skip("Import process", async ({ processManagerPage }) => {
            await processManagerPage.importProcess(exportedFilePath);
            await processManagerPage.verifyOnProcessManagerPage();
        });
    });

    test.describe.serial("Rename and Schedule", () => {
        let originalProcessName: string;
        let renamedProcessName: string | undefined;

        test.beforeAll(async ({ browser }) => {
            originalProcessName =
                await ProcessManagerPage.createProcessForTests(browser, {
                    retryOnceOnCreateFailure: true,
                });
            processesToCleanup.push(originalProcessName);
        });

        test("Rename process", async ({ processManagerPage }) => {
            renamedProcessName = newProcess.build().name;
            await processManagerPage.renameProcess(
                originalProcessName,
                renamedProcessName,
            );
            const idx = processesToCleanup.indexOf(originalProcessName);
            if (idx !== -1) processesToCleanup[idx] = renamedProcessName;
            else processesToCleanup.push(renamedProcessName);
        });

        test("Deploy renamed process", async ({ processManagerPage }) => {
            await processManagerPage.openAndDeploy(renamedProcessName!);
        });

        test("Schedule process", async ({ processManagerPage }) => {
            await processManagerPage.scheduleAndVerifyProcess(
                renamedProcessName!,
            );
        });
    });


    test.afterAll(async ({ browser }) => {
        await ProcessManagerPage.deleteProcessForTests(browser, processesToCleanup);
    });
});
