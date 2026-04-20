import { expect } from '@playwright/test';
import { test } from '../fixtures/base.fixture';
import { AUTH_PATHS } from '../config/auth.config';
import { ADDRESSES } from '../data/cpq/address.data';
import { PRODUCT_SELECTIONS, SUCCESS_TOAST, EXPECTED_CART_COUNT } from '../data/cpq/products.data';
import { createCheckoutForm } from '../data/cpq/checkout.data';

const confirmationNumbers: Record<number, { confirmationNumber: string; phoneNumber: string }> = {};
const serviceTicketRefs: Record<number, { serviceTicketId: string; fulfilmentProcessId: string }> = {};

test.describe('CPQ - Check Availability', () => {
    test.describe.configure({ mode: 'serial' });
    test.use({ storageState: AUTH_PATHS.adminState });

    ADDRESSES.forEach((address, index) => {
        test(`[${index}] Select offers and products for address: ${address}`, async ({ cpqPage }, testInfo) => {
            await cpqPage.runCheckAvailabilityFlow(address);
            await cpqPage.selectOffersAndProducts(PRODUCT_SELECTIONS, SUCCESS_TOAST);
            await cpqPage.verifyCartItemCount(EXPECTED_CART_COUNT);
            const checkoutForm = createCheckoutForm();
            await cpqPage.completeCheckoutFlow(checkoutForm);
            const confirmationNumber = await cpqPage.submitOrderFlow();

            confirmationNumbers[index] = {
                confirmationNumber,
                phoneNumber: checkoutForm.phoneNumber,
            };

            testInfo.annotations.push(
                { type: 'Phone Number', description: checkoutForm.phoneNumber },
                { type: 'Confirmation Number', description: confirmationNumber },
            );
        });

        test(`[${index}] Verify service ticket for address: ${address}`, async ({ cpqPage }, testInfo) => {
            const { confirmationNumber, phoneNumber } = confirmationNumbers[index];
            const { serviceTicketId, fulfilmentProcessId } =
                await cpqPage.verifyServiceTicket(confirmationNumber);

            serviceTicketRefs[index] = { serviceTicketId, fulfilmentProcessId };

            testInfo.annotations.push(
                { type: 'Phone Number', description: phoneNumber },
                { type: 'Confirmation Number', description: confirmationNumber },
                { type: 'Service Ticket ID', description: serviceTicketId },
                { type: 'Fulfilment Sequence Process ID', description: fulfilmentProcessId },
            );
        });

        test(`[${index}] Verify Fulfilment Sequence Process status for address: ${address}`, async ({ flowHistoryPage }, testInfo) => {
            test.setTimeout(0);
            const { serviceTicketId, fulfilmentProcessId } = serviceTicketRefs[index];

            await flowHistoryPage.navigateToHistory();
            await flowHistoryPage.searchForProcess(fulfilmentProcessId);

            await flowHistoryPage.waitForTerminalStatus({ timeoutMs: 0 });

            await flowHistoryPage.openFirstProcess();

            const workOrderId = await flowHistoryPage.getWorkOrderId();
            const amsPortId = await flowHistoryPage.getAmsPortId();
            const status = await flowHistoryPage.getStatus();

            const gldsOrderCancelled = await flowHistoryPage.cancelGldsWorkOrder(workOrderId);
            const amsPortCancelled = await flowHistoryPage.cancelAmsPortWorkOrder(amsPortId);
            const duration = await flowHistoryPage.getDuration(fulfilmentProcessId);

            testInfo.annotations.push(
                { type: 'Service Ticket ID', description: serviceTicketId },
                { type: 'Fulfilment Sequence Process ID', description: fulfilmentProcessId },
                { type: 'Work Order ID', description: workOrderId },
                { type: 'GLDS Order Cancelled', description: gldsOrderCancelled ? 'Yes' : 'No' },
                { type: 'AMS Port Cancelled', description: amsPortCancelled ? 'Yes' : 'No' },
                { type: 'Process Duration', description: duration },
                { type: 'Process Status', description: status },
            );

            if (status.toLowerCase() === 'failed') {
                await flowHistoryPage.expandExecutionLogs();
                const { step, error } = await flowHistoryPage.getFailedStepDetails();

                testInfo.annotations.push(
                    { type: 'Failed Step', description: step },
                    { type: 'Process Error', description: error },
                );

                throw new Error(
                    `Fulfilment Sequence Process "${fulfilmentProcessId}" failed at step "${step}": ${error}`,
                );
            }

            expect(status).not.toBe('Failed');
        });
    });
});
