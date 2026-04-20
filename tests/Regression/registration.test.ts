import { test } from '../../fixtures/base.fixture';
import { expect } from '@playwright/test';
import { newRegistrationWithEmailVerification, type RegistrationData } from '../../factories/registration.factory';
import { GmailService } from '../../utils/gmail.service';
import { REGISTRATION_CONFIG } from '../../data/registration.data';
import { AUTH_PATHS } from '../../config/auth.config';

const { timeouts, loginPage, invalidCredentials, forgotPassword, urls, assertions } = REGISTRATION_CONFIG;
const { platformInvitationValidation, passwordResetValidation, createNewPassword, passwordChangeNotificationValidation } = forgotPassword;

test.describe('Organization Registration - Validation', () => {
    test.use({ storageState: AUTH_PATHS.googleState });

    let registrationData: RegistrationData;

    test.beforeEach(async ({ registrationPage }) => {
        registrationData = newRegistrationWithEmailVerification.build();
        await registrationPage.navigateToRegistration();
    });

    test('Registration page displays all required elements', async ({ registrationPage }) => {
        await registrationPage.verifyPageLoaded();
    });

    test('Create Account button is disabled when all fields are empty', async ({ registrationPage }) => {
        await registrationPage.verifyCreateAccountButtonDisabled();
    });

    test('Create Account button is disabled without first name', async ({ registrationPage }) => {
        await registrationPage.fillAllFieldsExcept(registrationData, 'firstName');
        await registrationPage.verifyCreateAccountButtonDisabled();
    });

    test('Create Account button is disabled without last name', async ({ registrationPage }) => {
        await registrationPage.fillAllFieldsExcept(registrationData, 'lastName');
        await registrationPage.verifyCreateAccountButtonDisabled();
    });

    test('Create Account button is disabled without email', async ({ registrationPage }) => {
        await registrationPage.fillAllFieldsExcept(registrationData, 'email');
        await registrationPage.verifyCreateAccountButtonDisabled();
    });

    test('Create Account button is disabled without company name', async ({ registrationPage }) => {
        await registrationPage.fillAllFieldsExcept(registrationData, 'companyName');
        await registrationPage.verifyCreateAccountButtonDisabled();
    });

    test('Create Account button is disabled without accepting terms', async ({ registrationPage }) => {
        await registrationPage.fillAllFieldsExcept(registrationData, 'terms');
        await registrationPage.verifyCreateAccountButtonDisabled();
    });

    test('Create Account button is enabled when all required fields are filled', async ({ registrationPage }) => {
        await registrationPage.fillRequiredFieldsOnly(registrationData);
        await registrationPage.verifyCreateAccountButtonEnabled();
    });
});

test.describe('Organization Registration - E2E', () => {
    test.use({ storageState: AUTH_PATHS.googleState });

    test('Register, extract password from email, and verify login', async ({
        registrationPage,
        page
    }) => {
        const registrationData = newRegistrationWithEmailVerification.build();
        const gmailService = new GmailService();
        let extractedPassword: string | null = null;

        await test.step('Navigate to registration page', async () => {
            await registrationPage.navigateToRegistration();
        });

        await test.step('Fill registration form', async () => {
            await registrationPage.fillAllFields(registrationData);
            await registrationPage.verifyCreateAccountButtonEnabled();
        });

        await test.step('Submit registration and verify confirmation screen', async () => {
            await registrationPage.clickCreateAccount();
            await registrationPage.verifySuccessPageDisplayed();
        });

        await test.step('Wait for and extract password from Symphona Platform Invitation email', async () => {
            await gmailService.initialize();
            const emailData = await gmailService.waitForRegistrationEmail(
                registrationData.email,
                timeouts.long,
                timeouts.short
            );

            expect(emailData.password, assertions.registration.passwordFoundInEmail).not.toBeNull();
            extractedPassword = emailData.password;
        });

        await test.step('Click Return to Login Page', async () => {
            await registrationPage.clickReturnToLogin();
            await registrationPage.verifyReturnedToLoginPage();
        });

        await test.step('Login with extracted credentials', async () => {
            await page.getByPlaceholder(loginPage.emailPlaceholder).fill(registrationData.email);
            await page.getByPlaceholder(loginPage.passwordPlaceholder).fill(extractedPassword!);
            await page.getByRole('button', { name: loginPage.loginButton }).click();
        });

        await test.step('Verify My Summary page appears', async () => {
            await expect(page.locator(loginPage.dashboardSelector)).toBeVisible({ timeout: timeouts.standard });
        });
    });
});


test.describe('Login - Negative Scenarios', () => {
    test.use({ storageState: AUTH_PATHS.googleState });

    test('Login with valid email and wrong password shows error message', async ({ loginPage: loginPageFixture }) => {
        await loginPageFixture.attemptLoginAndExpectError({
            username: invalidCredentials.validEmail,
            password: invalidCredentials.wrongPassword,
        });
    });
});

test.describe('Forgot Password Functionality', () => {
    test.use({ storageState: AUTH_PATHS.googleState });

    const { passwordValidation } = forgotPassword;

    test('Forgot password page shows error for invalid email format', async ({
        loginPage: loginPageFixture,
        page
    }) => {
        await page.goto('/');
        await loginPageFixture.clickForgotPassword();
        await loginPageFixture.verifyResetPasswordPageDisplayed();
        await loginPageFixture.enterResetEmail(forgotPassword.fakeEmail);
        await loginPageFixture.clickRequestReset();
        await loginPageFixture.verifyInvalidEmailError();
    });

    test('Forgot password - reset password via email link', async ({
        loginPage: loginPageFixture,
        page
    }) => {
        const gmailService = new GmailService();
        const { email: resetEmail, resetPassword } = REGISTRATION_CONFIG.forgotPasswordCredentials;

        await test.step('Navigate to Forgot Password and request reset', async () => {
            await page.goto('/');
            await loginPageFixture.clickForgotPassword();
            await loginPageFixture.verifyResetPasswordPageDisplayed();
            await loginPageFixture.enterResetEmail(resetEmail);
            await loginPageFixture.clickRequestReset();
            await loginPageFixture.verifySuccessPopupDisplayed();
        });

        let createPasswordUrl: string;
        await test.step('Extract password reset link from email', async () => {
            await gmailService.initialize();
            const emailData = await gmailService.waitForPasswordResetLinkEmail(
                resetEmail,
                timeouts.long,
                timeouts.short
            );

            expect(emailData.createPasswordUrl, assertions.passwordResetLink.createPasswordLinkPresent).not.toBeNull();
            createPasswordUrl = emailData.createPasswordUrl!;
        });

        await test.step('Navigate to Create New Password page and verify it loads', async () => {
            await page.goto(createPasswordUrl);
            await loginPageFixture.verifyCreateNewPasswordPageDisplayed();
        });

        await test.step('Verify password validation rejects invalid passwords', async () => {
            for (const [rule, invalidPassword] of Object.entries(passwordValidation.invalidPasswords)) {
                await loginPageFixture.clearNewPasswordField();
                await loginPageFixture.enterNewPassword(invalidPassword);
                await loginPageFixture.clickChangePassword();
                await loginPageFixture.verifyPasswordValidationErrorDisplayed();
            }
        });

        await test.step('Enter valid password and reset successfully', async () => {
            await loginPageFixture.clearNewPasswordField();
            await loginPageFixture.enterNewPassword(resetPassword);
            await loginPageFixture.clickChangePassword();
            await loginPageFixture.verifyPasswordResetSuccess();
        });

        await test.step('Verify Password Change Notification email received', async () => {
            const emailData = await gmailService.waitForPasswordChangeNotificationEmail(
                resetEmail,
                timeouts.long,
                timeouts.short
            );

            expect(emailData.rawContent.length, assertions.passwordChangeNotification.emailReceived).toBeGreaterThan(0);
            expect(emailData.rawContent, assertions.passwordChangeNotification.successMessagePresent).toContain(passwordChangeNotificationValidation.successMessage);
        });

        await test.step('Login with new password and verify dashboard', async () => {
            await loginPageFixture.clickGoToLogin();
            await loginPageFixture.verifyLoginPageDisplayed();
            await loginPageFixture.enterEmailOnLoginPage(resetEmail);
            await loginPageFixture.enterPassword(resetPassword);
            await loginPageFixture.clickLogin();
            await loginPageFixture.verifyMySummaryVisible();
        });
    });
});

// Cleanup: Delete all test-related emails after all tests complete
test.afterAll(async () => {
    const gmailService = new GmailService();
    await gmailService.initialize();
    const deletedCount = await gmailService.deleteAllTestEmails();
    console.log(`Teardown: Cleaned up ${deletedCount} test email(s) from mailbox`);
});
