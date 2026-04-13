import { test } from '../fixtures/base.fixture';
import { AUTH_PATHS } from '../config/auth.config';
import { ProcessManagerPage } from '../pages/flow/processManager.page';
import {
    newServiceTicketType,
    ServiceTicketTypeData,
    newServiceTicket,
    ServiceTicketData,
} from '../factories/serviceTicket.factory';

test.describe('Serve - Service Tickets', () => {
    test.use({ storageState: AUTH_PATHS.adminState });

    test.describe.serial('Service Ticket Lifecycle', () => {
        let processName: string;
        const ticketTypeData: ServiceTicketTypeData = newServiceTicketType.build();
        const ticketData: ServiceTicketData = newServiceTicket.build();

        test.beforeAll(async ({ browser }) => {
            processName = await ProcessManagerPage.createAndDeployProcessForTests(browser);
        });

        test('Create Service Ticket Type', async ({ serviceTicketPage }) => {
            await serviceTicketPage.createServiceTicketType(
                ticketTypeData.typeName,
                ticketTypeData.actionName,
                processName,
                ticketTypeData.successMessage,
                ticketTypeData.errorMessage,
            );
        });

        test('Create Service Ticket', async ({ serviceTicketPage }) => {
            await serviceTicketPage.createServiceTicket(
                ticketData.ticketName,
                ticketTypeData.typeName,
                'Automation User',
            );
        });

        test('Execute Action on Service Ticket', async ({ serviceTicketPage }) => {
            await serviceTicketPage.searchAndExecuteAction(
                ticketData.ticketName,
                ticketTypeData.actionName,
            );
        });

        test('Delete Service Ticket', async ({ serviceTicketPage }) => {
            await serviceTicketPage.deleteServiceTicket(ticketData.ticketName);
        });

        test.afterAll(async ({ browser }) => {
            await ProcessManagerPage.deleteProcessForTests(browser, [processName]);
        });
    });
});
