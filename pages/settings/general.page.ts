import { expect, type Page, type Locator } from '@playwright/test';
import { GENERAL_SETTINGS_CONFIG } from '../../data/settings/general.data';

const { urls, timeouts, selectors, messages } = GENERAL_SETTINGS_CONFIG;

export class GeneralSettingsPage {
    readonly organizationDetailsAccordion: Locator;
    readonly organizationDetailsHeader: Locator;
    readonly editProfileButton: Locator;
    readonly phoneNumberInput: Locator;
    readonly phoneValidationError: Locator;
    readonly saveButton: Locator;
    readonly successToastTitle: Locator;
    readonly successToastMessage: Locator;

    private readonly page: Page;

    constructor(page: Page) {
        this.page = page;
        this.organizationDetailsAccordion = page.locator('.MuiAccordion-root').filter({
            hasText: selectors.organizationDetailsText
        });
        this.organizationDetailsHeader = this.organizationDetailsAccordion.locator('.MuiAccordionSummary-root');
        this.editProfileButton = page.getByRole('button', { name: selectors.editProfileButton });
        this.phoneNumberInput = page.locator('input.PhoneInputInput');
        this.phoneValidationError = page.getByText(messages.phoneValidationError);
        this.saveButton = page.getByRole('button', { name: selectors.saveButton, exact: true });
        this.successToastTitle = page.locator('span').filter({ hasText: messages.successTitle }).first();
        this.successToastMessage = page.locator('span').filter({ hasText: messages.organizationUpdatedSuccess });
    }

    async navigateToGeneralSettings(): Promise<void> {
        await this.page.goto(urls.generalSettings);
        await expect(this.organizationDetailsAccordion).toBeVisible({ timeout: timeouts.standard });
    }

    async expandOrganizationDetails(): Promise<void> {
        const isExpanded = await this.organizationDetailsHeader.getAttribute('aria-expanded');
        if (isExpanded === 'false') {
            await this.organizationDetailsHeader.click();
            await expect(this.organizationDetailsHeader).toHaveAttribute('aria-expanded', 'true', {
                timeout: timeouts.short
            });
        }
    }

    async clickEditProfile(): Promise<void> {
        await this.editProfileButton.click();
        await expect(this.saveButton).toBeVisible({ timeout: timeouts.short });
    }

    async enterPhoneNumber(phoneNumber: string): Promise<void> {
        await this.phoneNumberInput.click({ clickCount: 3 });
        await this.phoneNumberInput.pressSequentially(phoneNumber, { delay: 50 });
    }

    async clickSave(): Promise<void> {
        await this.saveButton.click();
    }

    async verifyPhoneValidationErrorDisplayed(): Promise<void> {
        await expect(this.phoneValidationError).toBeVisible({ timeout: timeouts.short });
    }

    async verifyPhoneValidationErrorNotDisplayed(): Promise<void> {
        await expect(this.phoneValidationError).toBeHidden({ timeout: timeouts.short });
    }

    async verifySuccessToastDisplayed(): Promise<void> {
        await expect(this.successToastTitle).toBeVisible({ timeout: timeouts.short });
        await expect(this.successToastMessage).toBeVisible();
    }
}
