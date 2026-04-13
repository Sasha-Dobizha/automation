import { expect, test, type Page, type Locator } from '@playwright/test';
import { type RegistrationData } from '../factories/registration.factory';
import { REGISTRATION_CONFIG } from '../data/registration.data';

const { urls, timeouts, pageText, loginPage } = REGISTRATION_CONFIG;

export const SELECTORS = {
    mySummary: 'a[name="My Summary"]',
} as const

export class RegistrationPage {
    readonly page: Page;

    // Form fields
    readonly firstNameInput: Locator;
    readonly lastNameInput: Locator;
    readonly emailInput: Locator;
    readonly companyNameInput: Locator;
    readonly phoneNumberInput: Locator;
    readonly jobTitleInput: Locator;
    readonly termsCheckbox: Locator;
    readonly createAccountBtn: Locator;

    // Labels
    readonly personalDetailsHeader: Locator;
    readonly mandatoryFieldsIndicator: Locator;

    // Validation messages
    readonly firstNameRequiredError: Locator;

    // Success page elements
    readonly congratulationsHeader: Locator;
    readonly successMessage: Locator;
    readonly resendEmailBtn: Locator;
    readonly returnToLoginBtn: Locator;
    readonly successToast: Locator;

    constructor(page: Page) {
        this.page = page;

        // Form fields
        this.firstNameInput = page.locator('input[name="firstName"]');
        this.lastNameInput = page.locator('input[name="lastName"]');
        this.emailInput = page.locator('input[name="workEmail"]');
        this.companyNameInput = page.locator('input[name="companyName"]');
        this.phoneNumberInput = page.locator('input[name="customerPhoneNumber"]');
        this.jobTitleInput = page.locator('input[name="title"]');
        this.termsCheckbox = page.locator('input[type="checkbox"]');
        this.createAccountBtn = page.getByRole('button', { name: pageText.createAccount });

        // Labels
        this.personalDetailsHeader = page.locator('span').filter({ hasText: pageText.personalDetails }).first();
        this.mandatoryFieldsIndicator = page.locator('span').filter({ hasText: pageText.mandatoryFields });

        // Validation - we'll look for aria-invalid or error text near the field
        this.firstNameRequiredError = page.locator('input[name="firstName"][aria-invalid="true"]');

        // Success page elements
        this.congratulationsHeader = page.locator('span').filter({ hasText: pageText.congratulations });
        this.successMessage = page.locator('span').filter({ hasText: pageText.successMessage });
        this.resendEmailBtn = page.getByRole('button', { name: pageText.resendEmail });
        this.returnToLoginBtn = page.getByRole('button', { name: pageText.returnToLogin });
        this.successToast = page.getByRole('alert').filter({ hasText: pageText.emailResent });
    }

    async navigateToRegistration(): Promise<void> {
        await test.step('Navigate to registration page', async () => {
            await this.page.goto(urls.registration);
            await expect(this.personalDetailsHeader).toBeVisible({ timeout: timeouts.standard });
        });
    }

    async verifyPageLoaded(): Promise<void> {
        await test.step('Verify registration page loaded successfully', async () => {
            await expect(this.personalDetailsHeader).toBeVisible();
            await expect(this.mandatoryFieldsIndicator).toBeVisible();
            await expect(this.firstNameInput).toBeVisible();
            await expect(this.lastNameInput).toBeVisible();
            await expect(this.emailInput).toBeVisible();
            await expect(this.companyNameInput).toBeVisible();
            await expect(this.termsCheckbox).toBeVisible();
            await expect(this.createAccountBtn).toBeVisible();
        });
    }

    async fillFirstName(firstName: string): Promise<void> {
        await test.step(`Fill first name: ${firstName}`, async () => {
            await this.firstNameInput.fill(firstName);
        });
    }

    async clearFirstName(): Promise<void> {
        await test.step('Clear first name', async () => {
            await this.firstNameInput.clear();
        });
    }

    async fillLastName(lastName: string): Promise<void> {
        await test.step(`Fill last name: ${lastName}`, async () => {
            await this.lastNameInput.fill(lastName);
        });
    }

    async clearLastName(): Promise<void> {
        await test.step('Clear last name', async () => {
            await this.lastNameInput.clear();
        });
    }

    async fillEmail(email: string): Promise<void> {
        await test.step(`Fill email: ${email}`, async () => {
            await this.emailInput.fill(email);
        });
    }

    async clearEmail(): Promise<void> {
        await test.step('Clear email', async () => {
            await this.emailInput.clear();
        });
    }

    async fillCompanyName(companyName: string): Promise<void> {
        await test.step(`Fill company name: ${companyName}`, async () => {
            await this.companyNameInput.fill(companyName);
        });
    }

    async clearCompanyName(): Promise<void> {
        await test.step('Clear company name', async () => {
            await this.companyNameInput.clear();
        });
    }

    async fillPhoneNumber(phoneNumber: string): Promise<void> {
        await test.step(`Fill phone number: ${phoneNumber}`, async () => {
            await this.phoneNumberInput.clear();
            await this.phoneNumberInput.fill(phoneNumber);
        });
    }

    async fillJobTitle(jobTitle: string): Promise<void> {
        await test.step(`Fill job title: ${jobTitle}`, async () => {
            await this.jobTitleInput.fill(jobTitle);
        });
    }

    async checkTermsAndConditions(): Promise<void> {
        await test.step('Check Terms of Service and Privacy Policy checkbox', async () => {
            await this.termsCheckbox.check();
            await expect(this.termsCheckbox).toBeChecked();
        });
    }

    async uncheckTermsAndConditions(): Promise<void> {
        await test.step('Uncheck Terms of Service and Privacy Policy checkbox', async () => {
            await this.termsCheckbox.uncheck();
            await expect(this.termsCheckbox).not.toBeChecked();
        });
    }

    async clickCreateAccount(): Promise<void> {
        await test.step('Click Create Account button', async () => {
            await this.createAccountBtn.click();
        });
    }

    async verifyCreateAccountButtonDisabled(): Promise<void> {
        await test.step('Verify Create Account button is disabled', async () => {
            await expect(this.createAccountBtn).toBeDisabled();
        });
    }

    async verifyCreateAccountButtonEnabled(): Promise<void> {
        await test.step('Verify Create Account button is enabled', async () => {
            await expect(this.createAccountBtn).toBeEnabled();
        });
    }

    /**
     * Fill all required fields except the specified one (DRY helper for validation tests)
     */
    async fillAllFieldsExcept(data: RegistrationData, skipField: 'firstName' | 'lastName' | 'email' | 'companyName' | 'terms'): Promise<void> {
        await test.step(`Fill all required fields except ${skipField}`, async () => {
            if (skipField !== 'firstName') await this.fillFirstName(data.firstName);
            if (skipField !== 'lastName') await this.fillLastName(data.lastName);
            if (skipField !== 'email') await this.fillEmail(data.email);
            if (skipField !== 'companyName') await this.fillCompanyName(data.companyName);
            if (skipField !== 'terms') await this.checkTermsAndConditions();
        });
    }

    async fillAllFields(data: RegistrationData): Promise<void> {
        await test.step('Fill all registration fields', async () => {
            await this.fillFirstName(data.firstName);
            await this.fillLastName(data.lastName);
            await this.fillEmail(data.email);
            await this.fillCompanyName(data.companyName);
            await this.fillPhoneNumber(data.phoneNumber);
            await this.fillJobTitle(data.jobTitle);
            await this.checkTermsAndConditions();
        });
    }

    async fillRequiredFieldsOnly(data: RegistrationData): Promise<void> {
        await test.step('Fill only required registration fields', async () => {
            await this.fillFirstName(data.firstName);
            await this.fillLastName(data.lastName);
            await this.fillEmail(data.email);
            await this.fillCompanyName(data.companyName);
            await this.checkTermsAndConditions();
        });
    }

    async verifySuccessPageDisplayed(): Promise<void> {
        await test.step('Verify success/congratulations page is displayed', async () => {
            await expect(this.congratulationsHeader).toBeVisible({ timeout: timeouts.standard });
            await expect(this.successMessage).toBeVisible();
            await expect(this.resendEmailBtn).toBeVisible();
            await expect(this.returnToLoginBtn).toBeVisible();
        });
    }

    async verifyEmailAddressOnSuccessPage(email: string): Promise<void> {
        await test.step(`Verify email ${email} is displayed on success page`, async () => {
            const emailText = this.page.locator('span').filter({ hasText: email });
            await expect(emailText).toBeVisible();
        });
    }

    async clickResendEmail(): Promise<void> {
        await test.step('Click resend email button', async () => {
            await this.resendEmailBtn.click();
        });
    }

    async verifyEmailResentSuccessfully(): Promise<void> {
        await test.step('Verify email resent success toast', async () => {
            await expect(this.successToast).toBeVisible({ timeout: timeouts.short });
        });
    }

    async clickReturnToLogin(): Promise<void> {
        await test.step('Click Return to Login Page button', async () => {
            await this.returnToLoginBtn.click();
        });
    }

    async verifyReturnedToLoginPage(): Promise<void> {
        await test.step('Verify returned to login page', async () => {
            await expect(this.page.getByPlaceholder(loginPage.emailPlaceholder)).toBeVisible({ timeout: timeouts.standard });
        });
    }

    async getFirstNameValidationState(): Promise<boolean> {
        return await this.firstNameInput.getAttribute('aria-invalid') === 'true';
    }

    async verifyFieldAcceptsInput(field: Locator, testValue: string): Promise<void> {
        await test.step('Verify field accepts valid input', async () => {
            await field.fill(testValue);
            const value = await field.inputValue();
            expect(value).toBe(testValue);
        });
    }

    /**
     * Complete registration flow (assumes already on registration page)
     */
    async completeRegistrationFlow(data: RegistrationData): Promise<void> {
        await test.step('Complete registration flow', async () => {
            await this.fillAllFields(data);
            await this.clickCreateAccount();
            await this.verifySuccessPageDisplayed();
        });
    }

    /**
     * Full registration flow including navigation
     */
    async completeRegistration(data: RegistrationData): Promise<void> {
        await this.navigateToRegistration();
        await this.completeRegistrationFlow(data);
    }
}
