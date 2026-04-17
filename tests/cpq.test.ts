import { test } from '../fixtures/base.fixture';
import { AUTH_PATHS } from '../config/auth.config';
import { ADDRESSES } from '../data/cpq/address.data';
import { PRODUCT_SELECTIONS, SUCCESS_TOAST, EXPECTED_CART_COUNT } from '../data/cpq/products.data';
import { createCheckoutForm } from '../data/cpq/checkout.data';

const confirmationNumbers: Record<number, { confirmationNumber: string; phoneNumber: string }> = {};

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
            const serviceTicketId = await cpqPage.verifyServiceTicket(confirmationNumber);

            testInfo.annotations.push(
                { type: 'Phone Number', description: phoneNumber },
                { type: 'Confirmation Number', description: confirmationNumber },
                { type: 'Service Ticket ID', description: serviceTicketId },
            );
        });
    });
});
