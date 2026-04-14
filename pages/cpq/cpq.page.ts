import { expect, type Page, type Locator } from '@playwright/test';
import { ADDRESS_CONFIG } from '../../data/cpq/address.data';

export class CpqPage {
    readonly addressInput: Locator;
    readonly checkAvailabilityButton: Locator;
    readonly availabilityConfirmation: Locator;
    private readonly cpqBaseUrl: string;
    private readonly standardTimeout: number;
    private readonly shortTimeout: number;

    private readonly page: Page;

    constructor(page: Page) {
        const { urls, timeouts } = ADDRESS_CONFIG;
        const selectors = {
            addressInputPlaceholder: 'Enter address..',
            checkAvailabilityButton: 'Check Availability',
            availabilityConfirmationText: 'Novus Is Available in Your Building',
        } as const;

        this.page = page;
        this.cpqBaseUrl = urls.cpqBaseUrl;
        this.standardTimeout = timeouts.standard;
        this.shortTimeout = timeouts.short;
        this.addressInput = page.getByPlaceholder(selectors.addressInputPlaceholder);
        this.checkAvailabilityButton = page.getByRole('button', { name: selectors.checkAvailabilityButton });
        this.availabilityConfirmation = page.getByText(selectors.availabilityConfirmationText);
    }

    async navigateToCpq(): Promise<void> {
        await this.page.goto(this.cpqBaseUrl);
        await expect(this.addressInput).toBeVisible({ timeout: this.standardTimeout });
    }

    async enterAddress(address: string): Promise<void> {
        await this.addressInput.click();
        await this.addressInput.fill(address);
    }

    async selectAddressOption(address: string): Promise<void> {
        const option = this.page.getByRole('option', { name: address });
        await option.waitFor({ timeout: this.shortTimeout });
        await option.click();
    }

    async clickCheckAvailability(): Promise<void> {
        await this.checkAvailabilityButton.click();
    }

    async verifyProductOfferingPageLoaded(): Promise<void> {
        await expect(this.availabilityConfirmation).toBeVisible({ timeout: this.standardTimeout });
    }

    async dismissCheckAvailabilityDialog(): Promise<void> {
        const closeIcon = this.page.locator('[data-testid="CloseIcon"]');
        const dialogCloseButton = closeIcon.first();
        if (await dialogCloseButton.isVisible({ timeout: 3000 }).catch(() => false)) {
            await dialogCloseButton.click();
            await dialogCloseButton.waitFor({ state: 'hidden', timeout: this.shortTimeout }).catch(() => {});
        }
    }

    async waitForInternetPlansSection(): Promise<void> {
        const sectionHeading = this.page.getByText('Select Your Perfect Internet Plan');
        await expect(sectionHeading).toBeVisible({ timeout: this.standardTimeout });
    }

    // --- Product Offerings (Select Offers And Products) ---

    async selectInternetPlan(planName: string): Promise<void> {
        const selectButton = this.page.locator(
            `xpath=//span[normalize-space()="${planName}"]/ancestor::div[.//button[.//span[normalize-space()="SELECT PLAN"]]][1]//button[.//span[normalize-space()="SELECT PLAN"]]`
        );
        await selectButton.waitFor({ timeout: this.standardTimeout });
        await selectButton.click();
    }

    async selectEquipmentOption(equipmentName: string): Promise<void> {
        const equipmentOption = this.page.locator('[role="radio"]')
            .filter({ hasText: equipmentName });
        await equipmentOption.waitFor({ timeout: this.standardTimeout });
        await equipmentOption.click();
    }

    async clickConfirmEquipment(): Promise<void> {
        const confirmButton = this.page.getByRole('button', { name: 'Confirm Equipment' });
        await confirmButton.waitFor({ timeout: this.standardTimeout });
        await confirmButton.click();
    }

    async selectAddonCheckbox(addonName: string): Promise<void> {
        const addonOption = this.page.locator('[role="checkbox"]')
            .filter({ hasText: addonName });
        await addonOption.waitFor({ timeout: this.standardTimeout });
        const isChecked = await addonOption.getAttribute('aria-checked');
        if (isChecked !== 'true') {
            await addonOption.click();
        }
    }

    async clickAddToPlan(): Promise<void> {
        const addButton = this.page.getByRole('button', { name: 'Add to Plan' });
        await addButton.waitFor({ timeout: this.standardTimeout });
        await addButton.click();
    }

    async verifyToastMessage(message: string): Promise<void> {
        const toast = this.page.locator('.Toastify__toast--success').filter({ hasText: message });
        await expect(toast).toBeVisible({ timeout: this.standardTimeout });
    }

    async selectTvPlan(planName: string): Promise<void> {
        const selectButton = this.page.locator(
            `xpath=//span[normalize-space()="Choose Your TV Plan"]/ancestor::div[1]//span[normalize-space()="${planName}"]/ancestor::div[.//button[.//span[normalize-space()="SELECT PLAN"]]][1]//button[.//span[normalize-space()="SELECT PLAN"]]`
        );
        await selectButton.waitFor({ timeout: this.standardTimeout });
        await selectButton.click();
    }

    async clickIndividualChannelsTab(): Promise<void> {
        const tab = this.page.getByRole('tab', { name: 'Individual Channels' });
        await tab.waitFor({ timeout: this.standardTimeout });
        await tab.click();
    }

    async selectPhonePlan(): Promise<void> {
        const selectButton = this.page.locator(
            `xpath=//span[normalize-space()="Want Phone Too?"]/ancestor::div[1]//button[.//span[normalize-space()="SELECT PLAN"]]`
        );
        await selectButton.waitFor({ timeout: this.standardTimeout });
        await selectButton.click();
    }

    async clickSkipAddons(): Promise<void> {
        const skipButton = this.page.getByRole('button', { name: 'skip add-ons' });
        await skipButton.waitFor({ timeout: this.standardTimeout });
        await skipButton.click();
    }

    async verifyCartItemCount(expectedCount: number): Promise<void> {
        const cartText = this.page.getByText('Item in a Cart:').locator('..');
        const countValue = cartText.locator('span').filter({ hasText: new RegExp(`^${expectedCount}$`) });
        await expect(countValue).toBeVisible({ timeout: this.standardTimeout });
    }

    async runCheckAvailabilityFlow(address: string): Promise<void> {
        await this.navigateToCpq();
        await this.enterAddress(address);
        await this.selectAddressOption(address);
        await this.clickCheckAvailability();
        await this.verifyProductOfferingPageLoaded();
    }

    async selectOffersAndProductsForInternetTvAndPhone(): Promise<void> {
        await this.selectInternetPlan('Internet 1000');
        await this.selectEquipmentOption('Router Rental WiFi 7 - Upgrade');
        await this.clickConfirmEquipment();
        await this.selectAddonCheckbox('Mesh Rental');
        await this.clickAddToPlan();
        await this.verifyToastMessage('The add-ons were successfully added to the plan in your cart');

        await this.selectTvPlan('TV Intro');
        await this.selectEquipmentOption('IPTV PVR Rental');
        await this.clickConfirmEquipment();
        await this.selectAddonCheckbox('Adventure');
        await this.selectAddonCheckbox('Canadian Time Shift');
        await this.clickIndividualChannelsTab();
        await this.selectAddonCheckbox('AXS TV HD');
        await this.selectAddonCheckbox('BBC Earth');
        await this.clickAddToPlan();
        await this.verifyToastMessage('The add-ons were successfully added to the plan in your cart');

        await this.selectPhonePlan();
        await this.selectAddonCheckbox('North America 500');
        await this.selectAddonCheckbox('Unlimited India');
        await this.selectAddonCheckbox('Unlimited Asia');
        await this.selectAddonCheckbox('Unlimited North America');
        await this.clickAddToPlan();
        await this.verifyToastMessage('The add-ons were successfully added to the plan in your cart');
        await this.verifyCartItemCount(3);
    }
}

export const runCheckAvailabilityFlow = async (cpqPage: CpqPage, address: string): Promise<void> => {
    await cpqPage.runCheckAvailabilityFlow(address);
};

export const selectOffersAndProductsForInternetTvAndPhone = async (cpqPage: CpqPage): Promise<void> => {
    await cpqPage.selectOffersAndProductsForInternetTvAndPhone();
};
