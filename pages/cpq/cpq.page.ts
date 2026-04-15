import { expect, type Page, type Locator } from "@playwright/test";
import { ADDRESS_CONFIG } from "../../data/cpq/address.data";
import { PerformanceTracker } from "../../utils/performance-tracker";

export interface ProductSelectionConfig {
    internet: {
        plan: string;
        equipment: string;
        addons: string[];
    };
    tv: {
        plan: string;
        equipment: string;
        packageAddons: string[];
        individualChannels: string[];
    };
    phone: {
        addons: string[];
    };
}

export class CpqPage {
    readonly addressInput: Locator;
    readonly checkAvailabilityButton: Locator;
    readonly availabilityConfirmation: Locator;
    readonly confirmEquipmentButton: Locator;
    readonly addToPlanButton: Locator;
    readonly individualChannelsTab: Locator;
    readonly toastAlert: Locator;
    readonly cartItemSection: Locator;
    readonly phoneSectionButton: Locator;
    readonly tracker: PerformanceTracker;

    private readonly equipmentRadio: Locator;
    private readonly addonCheckbox: Locator;
    private readonly selectPlanButton: Locator;
    private readonly cartItemCount: Locator;

    private readonly cpqBaseUrl: string;
    private readonly standardTimeout: number;
    private readonly shortTimeout: number;
    private readonly page: Page;

    constructor(page: Page, tracker?: PerformanceTracker) {
        const { urls, timeouts } = ADDRESS_CONFIG;

        this.page = page;
        this.tracker = tracker ?? new PerformanceTracker();
        this.cpqBaseUrl = urls.cpqBaseUrl;
        this.standardTimeout = timeouts.standard;
        this.shortTimeout = timeouts.short;

        this.addressInput = page.getByPlaceholder("Enter address..");
        this.checkAvailabilityButton = page.getByRole("button", {
            name: "Check Availability",
        });
        this.availabilityConfirmation = page.getByText(
            "Novus Is Available in Your Building",
        );
        this.confirmEquipmentButton = page.getByRole("button", {
            name: "Confirm Equipment",
        });
        this.addToPlanButton = page.getByRole("button", {
            name: "Add to Plan",
        });
        this.individualChannelsTab = page.getByRole("tab", {
            name: "Individual Channels",
        });
        this.toastAlert = page.getByRole("alert");
        this.cartItemSection = page.getByText("Item in a Cart:").locator("..");
        this.phoneSectionButton = page
            .getByText("Want Phone Too?")
            .locator("..")
            .getByRole("button", { name: /select plan/i });

        this.equipmentRadio = page.locator('[role="radio"]');
        this.addonCheckbox = page.locator('[role="checkbox"]');
        this.selectPlanButton = page.getByRole("button", {
            name: /select plan/i,
        });
        this.cartItemCount = this.cartItemSection.locator("span");
    }

    private async clickWhenReady(
        locator: Locator,
        label: string,
        timeout = this.standardTimeout,
    ): Promise<void> {
        await this.tracker.measure(`Wait: ${label}`, () =>
            locator.waitFor({ timeout }),
        );
        await locator.click();
    }

    async navigateToCpq(): Promise<void> {
        await this.tracker.measure("Navigate: CPQ page load", async () => {
            await this.page.goto(this.cpqBaseUrl);
            await expect(this.addressInput).toBeVisible({
                timeout: this.standardTimeout,
            });
        });
    }

    async enterAddress(address: string): Promise<void> {
        await this.addressInput.click();
        await this.addressInput.fill(address);
    }

    async selectAddressFromSuggestions(): Promise<void> {
        const firstOption = this.page.getByRole('option').first();
        await this.tracker.measure('Wait: address autocomplete options', () =>
            firstOption.waitFor({ timeout: this.shortTimeout }),
        );
        await firstOption.click();
    }

    async clickCheckAvailability(): Promise<void> {
        await this.checkAvailabilityButton.click();
    }

    async verifyProductOfferingPageLoaded(): Promise<void> {
        await this.tracker.measure("Wait: availability confirmation", () =>
            expect(this.availabilityConfirmation).toBeVisible({
                timeout: this.standardTimeout,
            }),
        );
    }

    async selectPlan(planName: string): Promise<void> {
        const planCard = this.page
            .locator("div")
            .filter({ has: this.page.getByText(planName, { exact: true }) })
            .filter({ has: this.selectPlanButton })
            .last();
        await this.clickWhenReady(
            planCard.locator(this.selectPlanButton),
            `Select Plan: ${planName}`,
        );
    }

    async selectPhonePlan(): Promise<void> {
        await this.clickWhenReady(
            this.phoneSectionButton,
            "Phone section button",
        );
    }

    async selectEquipmentOption(equipmentName: string): Promise<void> {
        await this.clickWhenReady(
            this.equipmentRadio.filter({ hasText: equipmentName }),
            `Equipment: ${equipmentName}`,
        );
    }

    async selectAddonCheckbox(addonName: string): Promise<void> {
        const addonOption = this.addonCheckbox.filter({ hasText: addonName });
        await this.tracker.measure(`Wait: Addon "${addonName}" ready`, () =>
            addonOption.waitFor({ timeout: this.standardTimeout }),
        );
        const isChecked = await addonOption.getAttribute("aria-checked");
        if (isChecked !== "true") {
            await addonOption.click();
        }
    }

    async verifyToastMessage(message: string): Promise<void> {
        await this.tracker.measure(`Wait: toast "${message}"`, () =>
            expect(this.toastAlert.filter({ hasText: message })).toBeVisible({
                timeout: this.standardTimeout,
            }),
        );
    }

    async verifyCartItemCount(expectedCount: number): Promise<void> {
        const countValue = this.cartItemCount.filter({
            hasText: new RegExp(`^${expectedCount}$`),
        });
        await this.tracker.measure(`Wait: cart count = ${expectedCount}`, () =>
            expect(countValue).toBeVisible({ timeout: this.standardTimeout }),
        );
    }

    // --- Composite Flows ---

    async runCheckAvailabilityFlow(address: string): Promise<void> {
        await this.navigateToCpq();
        await this.enterAddress(address);
        await this.selectAddressFromSuggestions();
        await this.clickCheckAvailability();

        const addressError = this.page.getByText('Please select an address from the suggestions to continue.');
        const isAddressError = await addressError.isVisible({ timeout: 3000 }).catch(() => false);
        if (isAddressError) {
            await this.addressInput.clear();
            await this.addressInput.fill(address);
            await this.selectAddressFromSuggestions();
            await this.clickCheckAvailability();
        }

        await this.verifyProductOfferingPageLoaded();
    }

    private async selectEquipmentWithAddons(
        equipment: string,
        addons: string[],
    ): Promise<void> {
        await this.selectEquipmentOption(equipment);
        await this.clickWhenReady(
            this.confirmEquipmentButton,
            "Confirm Equipment button",
        );
        for (const addon of addons) {
            await this.selectAddonCheckbox(addon);
        }
    }

    private async addToPlanAndVerify(successToast: string): Promise<void> {
        await this.clickWhenReady(this.addToPlanButton, "Add to Plan button");
        await this.verifyToastMessage(successToast);
    }

    async selectOffersAndProducts(
        config: ProductSelectionConfig,
        successToast: string,
    ): Promise<void> {
        await this.selectPlan(config.internet.plan);
        await this.selectEquipmentWithAddons(
            config.internet.equipment,
            config.internet.addons,
        );
        await this.addToPlanAndVerify(successToast);

        await this.selectPlan(config.tv.plan);
        await this.selectEquipmentWithAddons(
            config.tv.equipment,
            config.tv.packageAddons,
        );
        await this.clickWhenReady(
            this.individualChannelsTab,
            "Individual Channels tab",
        );
        for (const channel of config.tv.individualChannels) {
            await this.selectAddonCheckbox(channel);
        }
        await this.addToPlanAndVerify(successToast);
        await this.selectPhonePlan();
        for (const addon of config.phone.addons) {
            await this.selectAddonCheckbox(addon);
        }
        await this.addToPlanAndVerify(successToast);
    }
}


