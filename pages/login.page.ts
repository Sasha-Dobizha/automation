import { expect, test, type Page, type Locator } from '@playwright/test';
import { REGISTRATION_CONFIG } from '../data/registration.data';

const { loginPage, loginErrors, timeouts, forgotPassword } = REGISTRATION_CONFIG;

export class LoginPage {
    readonly loginErrorSection: Locator;
    readonly loginErrorHeader: Locator;
    readonly loginErrorMessage: Locator;

    // Forgot Password elements
    readonly forgotPasswordBtn: Locator;
    readonly resetEmailInput: Locator;
    readonly requestResetBtn: Locator;
    readonly returnToLoginBtn: Locator;
    readonly invalidEmailError: Locator;
    readonly successPopup: Locator;
    readonly successTitle: Locator;
    readonly successMessage: Locator;
    readonly mySummaryNav: Locator;

    // Create New Password elements
    readonly newPasswordInput: Locator;
    readonly changePasswordBtn: Locator;
    readonly passwordResetSuccessTitle: Locator;
    readonly goToLoginBtn: Locator;
    readonly passwordValidationError: Locator;

    constructor(
        private readonly page: Page,
        private readonly usernameInp = page.getByPlaceholder(loginPage.emailPlaceholder),
        private readonly passwordInp = page.getByPlaceholder(loginPage.passwordPlaceholder),
        private readonly loginBtn = page.getByRole('button', { name: loginPage.loginButton }),
        private readonly googleEmailField = page.getByLabel('Email or phone'),
    ) {
        this.loginErrorSection = page.locator('section').filter({
            has: page.locator('[data-testid="WarningAmberRoundedIcon"]')
        });
        this.loginErrorHeader = this.loginErrorSection.locator('h4', { hasText: loginErrors.loginFailedHeader });
        this.loginErrorMessage = this.loginErrorSection.locator('p', { hasText: loginErrors.invalidCredentialsMessage });

        // Forgot Password elements
        this.forgotPasswordBtn = page.getByRole('button', { name: forgotPassword.forgotPasswordButton });
        this.resetEmailInput = page.locator('input[type="email"], input[name="email"]');
        this.requestResetBtn = page.getByRole('button', { name: forgotPassword.requestResetButton });
        this.returnToLoginBtn = page.getByRole('button', { name: forgotPassword.returnToLoginButton });
        this.invalidEmailError = page.locator('span').filter({ hasText: forgotPassword.invalidEmailError });
        this.successPopup = page.locator('.MuiStack-root').filter({ hasText: forgotPassword.successTitle });
        this.successTitle = page.locator('span').filter({ hasText: forgotPassword.successTitle }).first();
        this.successMessage = page.locator('span').filter({ hasText: forgotPassword.successMessage });
        this.mySummaryNav = page.locator(loginPage.dashboardSelector);

        // Create New Password elements
        this.newPasswordInput = page.locator('input[name="password"]');
        this.changePasswordBtn = page.locator('button[type="submit"][form="ResetForm"]');
        this.passwordResetSuccessTitle = page.locator('h2').filter({ hasText: forgotPassword.createNewPassword.passwordResetSuccessTitle });
        this.goToLoginBtn = page.getByRole('button', { name: forgotPassword.createNewPassword.goToLoginButton });
        this.passwordValidationError = page.locator('span[color="#E03B24"], p.css-r6h8gp');
    }

    async navigateToLogin(): Promise<void> {
        await test.step('Navigate to login page', async () => {
            await this.page.goto('/');
        });
    }

    private async fillCredentials(username: string, password: string): Promise<void> {
        await test.step(`Enter email: ${username}`, async () => {
            await expect(this.usernameInp).toBeVisible({ timeout: timeouts.standard });
            await this.usernameInp.fill(username);
        });

        await test.step('Enter password', async () => {
            await expect(this.passwordInp).toBeVisible();
            await this.passwordInp.fill(password);
        });
    }

    private async fillCredentialsAndSubmit(username: string, password: string): Promise<void> {
        await this.fillCredentials(username, password);
        await test.step('Click Log In', async () => {
            await this.loginBtn.click();
        });
    }

    private validateCredentials(username: string | undefined, password: string | undefined): { username: string; password: string } {
        if (!username || !password) {
            throw new Error('Username and password must be provided.');
        }
        return { username, password };
    }

    async loginToApp(params: { username: string | undefined; password: string | undefined }): Promise<LoginPage> {
        const { username, password } = this.validateCredentials(params.username, params.password);
        await this.navigateToLogin();
        const isGoogleLogin = await this.googleEmailField.isVisible({ timeout: 3000 }).catch(() => false);
        if (isGoogleLogin) {
            throw new Error('Google login required. Please run: npx playwright codegen --save-storage=.auth/googleState.json');
        }
        await this.fillCredentialsAndSubmit(username, password);
        return this;
    }

    async attemptLoginAndExpectError(params: { username: string; password: string }): Promise<void> {
        await this.loginToApp(params);
        await expect(this.loginErrorSection).toBeVisible({ timeout: timeouts.short });
        await expect(this.loginErrorHeader).toBeVisible();
        await expect(this.loginErrorMessage).toBeVisible();
    }

    // Forgot Password methods
    async enterEmailOnLoginPage(email: string): Promise<void> {
        await test.step(`Enter email on login page: ${email}`, async () => {
            await expect(this.usernameInp).toBeVisible({ timeout: timeouts.standard });
            await this.usernameInp.fill(email);
        });
    }

    async clickForgotPassword(): Promise<void> {
        await test.step('Click Forgot Password button', async () => {
            await expect(this.forgotPasswordBtn).toBeVisible();
            await this.forgotPasswordBtn.click();
        });
    }

    async verifyResetPasswordPageDisplayed(): Promise<void> {
        await test.step('Verify Reset Password page is displayed', async () => {
            await expect(this.resetEmailInput).toBeVisible({ timeout: timeouts.standard });
            await expect(this.requestResetBtn).toBeVisible();
        });
    }

    async enterResetEmail(email: string): Promise<void> {
        await test.step(`Enter email for password reset: ${email}`, async () => {
            await this.resetEmailInput.clear();
            await this.resetEmailInput.fill(email);
        });
    }

    async clickRequestReset(): Promise<void> {
        await test.step('Click Request Reset button', async () => {
            await this.requestResetBtn.click();
        });
    }

    async verifyInvalidEmailError(): Promise<void> {
        await test.step('Verify Invalid email address error is displayed', async () => {
            await expect(this.invalidEmailError).toBeVisible({ timeout: timeouts.short });
        });
    }

    async verifySuccessPopupDisplayed(): Promise<void> {
        await test.step('Verify success popup is displayed', async () => {
            await expect(this.successTitle).toBeVisible({ timeout: timeouts.short });
            await expect(this.successMessage).toBeVisible();
        });
    }

    async clickReturnToLogin(): Promise<void> {
        await test.step('Click Return to Log In button', async () => {
            await expect(this.returnToLoginBtn).toBeVisible({ timeout: timeouts.short });
            await this.returnToLoginBtn.click();
        });
    }

    async enterPassword(password: string): Promise<void> {
        await test.step('Enter password', async () => {
            await expect(this.passwordInp).toBeVisible({ timeout: timeouts.standard });
            await this.passwordInp.fill(password);
        });
    }

    async clickLogin(): Promise<void> {
        await test.step('Click Log In button', async () => {
            await this.loginBtn.click();
        });
    }

    async verifyMySummaryVisible(): Promise<void> {
        await test.step('Verify My Summary is visible in navbar', async () => {
            await expect(this.mySummaryNav).toBeVisible({ timeout: timeouts.standard });
        });
    }

    async verifyLoginPageDisplayed(): Promise<void> {
        await test.step('Verify login page is displayed', async () => {
            await expect(this.usernameInp).toBeVisible({ timeout: timeouts.standard });
            await expect(this.passwordInp).toBeVisible();
            await expect(this.loginBtn).toBeVisible();
        });
    }

    // Create New Password methods
    async navigateToCreateNewPassword(url: string): Promise<void> {
        await test.step('Navigate to Create New Password page', async () => {
            await this.page.goto(url);
            await expect(this.newPasswordInput).toBeVisible({ timeout: timeouts.standard });
        });
    }

    async enterNewPassword(password: string): Promise<void> {
        await test.step('Enter new password', async () => {
            await this.newPasswordInput.fill(password);
        });
    }

    async clickChangePassword(): Promise<void> {
        await test.step('Click Change Password button', async () => {
            await this.changePasswordBtn.click();
        });
    }

    async verifyPasswordResetSuccess(): Promise<void> {
        await test.step('Verify password reset success message', async () => {
            await expect(this.passwordResetSuccessTitle).toBeVisible({ timeout: timeouts.short });
        });
    }

    async clickGoToLogin(): Promise<void> {
        await test.step('Click Go to Log In button', async () => {
            await this.goToLoginBtn.click();
        });
    }

    async verifyPasswordValidationErrorDisplayed(): Promise<void> {
        await test.step('Verify password validation error is displayed', async () => {
            await expect(this.passwordValidationError.first()).toBeVisible({ timeout: timeouts.short });
        });
    }

    async clearNewPasswordField(): Promise<void> {
        await test.step('Clear new password field', async () => {
            await this.newPasswordInput.clear();
        });
    }

    async verifyCreateNewPasswordPageDisplayed(): Promise<void> {
        await test.step('Verify Create New Password page is displayed', async () => {
            await expect(this.newPasswordInput).toBeVisible({ timeout: timeouts.standard });
            await expect(this.changePasswordBtn).toBeVisible({ timeout: timeouts.short });
        });
    }
}
