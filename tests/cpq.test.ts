import { test } from '../fixtures/base.fixture';
import { AUTH_PATHS } from '../config/auth.config';
import { ADDRESS_CONFIG } from '../data/cpq/address.data';
import {
    runCheckAvailabilityFlow,
    selectOffersAndProductsForInternetTvAndPhone,
} from '../pages/cpq/cpq.page';

const { testData } = ADDRESS_CONFIG;

test.describe('CPQ - Check Availability', () => {
    test.describe.configure({ mode: 'parallel' });
    test.use({ storageState: AUTH_PATHS.adminState });

    test.use({ storageState: AUTH_PATHS.adminState });

    test('Select offers and products for Internet, TV, and Phone', async ({ cpqPage }) => {
        await runCheckAvailabilityFlow(cpqPage, testData.addresses[0]);
        await selectOffersAndProductsForInternetTvAndPhone(cpqPage);
    });

    testData.addresses.forEach((address, index) => {
        test(`Check Availability for valid address #${index + 1}`, async ({ cpqPage }) => {
            await runCheckAvailabilityFlow(cpqPage, address);
        });
    });
});
