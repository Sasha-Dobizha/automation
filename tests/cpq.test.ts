import { test } from '../fixtures/base.fixture';
import { AUTH_PATHS } from '../config/auth.config';
import { ADDRESSES } from '../data/cpq/address.data';
import { PRODUCT_SELECTIONS, SUCCESS_TOAST, EXPECTED_CART_COUNT } from '../data/cpq/products.data';

test.describe('CPQ - Check Availability', () => {
    test.describe.configure({ mode: 'parallel' });
    test.use({ storageState: AUTH_PATHS.adminState });

    ADDRESSES.forEach((address, index) => {
        test(`[${index}] Select offers and products for address: ${address}`, async ({ cpqPage }) => {
            await cpqPage.runCheckAvailabilityFlow(address);
            await cpqPage.selectOffersAndProducts(PRODUCT_SELECTIONS, SUCCESS_TOAST);
            await cpqPage.verifyCartItemCount(EXPECTED_CART_COUNT);
        });
    });
});
