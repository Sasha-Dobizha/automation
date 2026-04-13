import { test } from '../fixtures/base.fixture';
import { AUTH_PATHS } from '../config/auth.config';
import { GENERAL_SETTINGS_CONFIG, generateRandomPhoneNumber } from '../data/settings/general.data';

const { testData } = GENERAL_SETTINGS_CONFIG;

test.describe('Settings - General', () => {
    test.use({ storageState: AUTH_PATHS.adminState });

    test.beforeEach(async ({ generalSettingsPage }) => {
        await test.step('Navigate to Settings/General page', async () => {
            await generalSettingsPage.navigateToGeneralSettings();
        });

        await test.step('Open Organization Details dropdown', async () => {
            await generalSettingsPage.expandOrganizationDetails();
        });

        await test.step('Click the Edit Profile button', async () => {
            await generalSettingsPage.clickEditProfile();
        });
    });

    test('Edit Organization Profile - Invalid phone number shows validation error', async ({ generalSettingsPage }) => {
        await test.step('Enter invalid phone number and attempt to save', async () => {
            await generalSettingsPage.enterPhoneNumber(testData.invalidPhoneNumbers.tooShort);
            await generalSettingsPage.clickSave();
        });

        await test.step('Verify phone validation error is displayed', async () => {
            await generalSettingsPage.verifyPhoneValidationErrorDisplayed();
        });
    });

    test('Edit Organization Profile - Validation error disappears after entering valid phone', async ({ generalSettingsPage }) => {
        await test.step('Enter invalid phone number to trigger validation error', async () => {
            await generalSettingsPage.enterPhoneNumber(testData.invalidPhoneNumbers.tooShort);
            await generalSettingsPage.clickSave();
            await generalSettingsPage.verifyPhoneValidationErrorDisplayed();
        });

        await test.step('Enter valid phone number and verify error disappears', async () => {
            await generalSettingsPage.enterPhoneNumber(generateRandomPhoneNumber());
            await generalSettingsPage.verifyPhoneValidationErrorNotDisplayed();
        });
    });

    test('Edit Organization Profile - Successfully update phone number', async ({ generalSettingsPage }) => {
        await test.step('Enter valid phone number', async () => {
            await generalSettingsPage.enterPhoneNumber(generateRandomPhoneNumber());
        });

        await test.step('Save changes', async () => {
            await generalSettingsPage.clickSave();
        });

        await test.step('Verify success toast message is displayed', async () => {
            await generalSettingsPage.verifySuccessToastDisplayed();
        });
    });
});
