
import { test as base } from '@playwright/test'
import { LoginPage } from "../pages/login.page";
import { Utils } from "../utils/utils";
import { RegistrationPage } from '../pages/registration.page';
import { GeneralSettingsPage } from '../pages/settings/general.page';
import { AccessManagementPage } from '../pages/settings/accessManagement.page';
import { ProcessManagerPage } from '../pages/flow/processManager.page';
import { FlowHistoryPage } from '../pages/flow/flowHistory.page';
import { ServiceTicketPage } from '../pages/serve/serviceTicket.page';
import { KnowledgeBasePage } from '../pages/settings/knowledgeBase.page';
import { AgentManagerPage } from '../pages/converse/agentManager.page';
import { AgentTesterPage } from '../pages/converse/agentTester.page';
import { CpqPage } from '../pages/cpq/cpq.page';
import { PerformanceTracker } from '../utils/performance-tracker';

type BaseFixture = {
    loginPage: LoginPage
    utils: Utils
    registrationPage: RegistrationPage
    generalSettingsPage: GeneralSettingsPage
    accessManagementPage: AccessManagementPage
    processManagerPage: ProcessManagerPage
    flowHistoryPage: FlowHistoryPage
    serviceTicketPage: ServiceTicketPage
    knowledgeBasePage: KnowledgeBasePage
    agentManagerPage: AgentManagerPage
    agentTesterPage: AgentTesterPage
    cpqPage: CpqPage
    performanceTracker: PerformanceTracker
}


export const test = base.extend<BaseFixture>({
    page: async ({ page }, use) => {
        await use(page);
    },

    loginPage: async ({ page }, use) => {
        const loginPage = new LoginPage(page);
        await use(loginPage);
    },

    utils: async ({ page }, use) => {
        const utils = new Utils(page);
        await use(utils);
    },

    registrationPage: async ({ page }, use) => {
        const registrationPage = new RegistrationPage(page);
        await use(registrationPage);
    },

    generalSettingsPage: async ({ page }, use) => {
        const generalSettingsPage = new GeneralSettingsPage(page);
        await use(generalSettingsPage);
    },

    accessManagementPage: async ({ page }, use) => {
        const accessManagementPage = new AccessManagementPage(page);
        await use(accessManagementPage);
    },

    processManagerPage: async ({ page }, use) => {
        const processManagerPage = new ProcessManagerPage(page);
        await use(processManagerPage);
    },

    flowHistoryPage: async ({ page }, use) => {
        const flowHistoryPage = new FlowHistoryPage(page);
        await use(flowHistoryPage);
    },

    serviceTicketPage: async ({ page }, use) => {
        const serviceTicketPage = new ServiceTicketPage(page);
        await use(serviceTicketPage);
    },

    knowledgeBasePage: async ({ page }, use) => {
        const knowledgeBasePage = new KnowledgeBasePage(page);
        await use(knowledgeBasePage);
    },

    agentManagerPage: async ({ page }, use) => {
        const agentManagerPage = new AgentManagerPage(page);
        await use(agentManagerPage);
    },

    agentTesterPage: async ({ page }, use) => {
        const agentTesterPage = new AgentTesterPage(page);
        await use(agentTesterPage);
    },

    performanceTracker: async ({}, use) => {
        await use(new PerformanceTracker());
    },

    cpqPage: async ({ page, performanceTracker }, use, testInfo) => {
        const cpqPage = new CpqPage(page, performanceTracker);
        await use(cpqPage);
        if (performanceTracker.entries.length > 0) {
            await testInfo.attach('perf-timings', {
                body: JSON.stringify(performanceTracker.toJSON()),
                contentType: 'application/json',
            });
        }
    },
})
