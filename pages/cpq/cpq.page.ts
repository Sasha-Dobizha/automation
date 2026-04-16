import { expect, type Page, type Locator } from "@playwright/test";
import { ADDRESS_CONFIG } from "../../data/cpq/address.data";
import { PerformanceTracker, type TimingCategory } from "../../utils/performance-tracker";
import type { CheckoutFormData } from "../../data/cpq/checkout.data";

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
    private readonly saveChangesButton: Locator;
    private readonly cartItemCount: Locator;

    // Checkout locators
    private readonly checkoutButton: Locator;
    private readonly titleDropdown: Locator;
    private readonly firstNameInput: Locator;
    private readonly lastNameInput: Locator;
    private readonly dateOfBirthInput: Locator;
    private readonly phoneInput: Locator;
    private readonly selectOptionDropdown: Locator;
    private readonly emailInput: Locator;
    private readonly confirmEmailInput: Locator;
    private readonly generatePasswordButton: Locator;
    private readonly saveAndContinueButton: Locator;
    private readonly installationDialog: Locator;
    private readonly installationConfirmButton: Locator;

    // Address flow locators
    private readonly addressSuggestionOption: Locator;
    private readonly addressErrorText: Locator;

    // Installation scheduling locators
    private readonly nextWeekButton: Locator;
    private readonly timeSlots: Locator;

    // Dialog locators
    private readonly individualChannelsDialog: Locator;
    private readonly installationInfoText: Locator;

    // Terms and Conditions locators
    private readonly tcLabel: Locator;
    private readonly tcDialog: Locator;
    private readonly pdfContainer: Locator;
    private readonly tcAcceptButton: Locator;

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
        this.saveChangesButton = page.getByRole("button", {
            name: /save changes/i,
        });
        this.cartItemCount = this.cartItemSection.locator("span");

        // Checkout locators
        this.checkoutButton = page.getByRole("button", { name: "Checkout" });
        const autocompleteInputs = page.locator(
            'input[role="combobox"][placeholder="Select Option"]',
        );
        this.titleDropdown = autocompleteInputs.nth(0);
        this.firstNameInput = page.getByPlaceholder("Enter your first name...");
        this.lastNameInput = page.getByPlaceholder("Enter your last name...");
        this.dateOfBirthInput = page.locator('input[name="dateOfBirth"]');
        this.phoneInput = page.getByPlaceholder("(123) 456-7890");
        this.selectOptionDropdown = autocompleteInputs.nth(1);
        this.emailInput = page.getByPlaceholder("Enter your email...");
        this.confirmEmailInput = page.getByPlaceholder(
            "Confirm your email...",
        );
        this.generatePasswordButton = page
            .locator("svg")
            .filter({ has: page.locator('circle[cx="12"][cy="12"][r="1.5"]') })
            .first();
        this.saveAndContinueButton = page.getByRole("button", {
            name: /Save and Continue/i,
        });
        this.installationDialog = page.getByRole("dialog");
        this.installationConfirmButton = page
            .getByRole("dialog")
            .getByRole("button", { name: "Confirm" });

        this.addressSuggestionOption = page.getByRole("option").first();
        this.addressErrorText = page.getByText(
            "Please select an address from the suggestions to continue.",
        );

        this.individualChannelsDialog = page
            .getByRole("dialog")
            .filter({ has: this.saveChangesButton })
            .first();
        this.installationInfoText = this.installationDialog.getByText(
            "Installation Information",
        );

        this.nextWeekButton = page.getByRole("button", { name: "Next week" });
        this.timeSlots = page.locator('div[role="button"][aria-pressed]');

        this.tcLabel = page.locator("label").filter({
            hasText: "I have read and agree to the Terms and Conditions",
        });
        this.tcDialog = page.getByRole("dialog").filter({
            hasText: "Terms and Conditions",
        });
        this.pdfContainer = page.locator('[data-testid="core__inner-pages"]');
        this.tcAcceptButton = this.tcDialog
            .locator("button")
            .filter({ hasText: "Accept" });
    }

    private async fillField(locator: Locator, value: string): Promise<void> {
        await locator.click();
        await locator.fill(value);
    }

    private async clickWhenReady(
        locator: Locator,
        label: string,
        timeout = this.standardTimeout,
        category: TimingCategory = 'element-visible',
    ): Promise<void> {
        await this.tracker.measure(
            `Wait: ${label}`,
            () => locator.waitFor({ timeout }),
            category,
        );
        await locator.click();
    }

    async navigateToCpq(): Promise<void> {
        await this.tracker.measure(
            "Navigate: CPQ page load",
            async () => {
                await this.page.goto(this.cpqBaseUrl);
                await expect(this.addressInput).toBeVisible({
                    timeout: this.standardTimeout,
                });
            },
            'page-load',
        );
    }

    async enterAddress(address: string): Promise<void> {
        await this.fillField(this.addressInput, address);
    }

    async selectAddressFromSuggestions(): Promise<void> {
        await this.tracker.measure('Wait: address autocomplete options', () =>
            this.addressSuggestionOption.waitFor({ timeout: this.shortTimeout }),
        );
        await this.addressSuggestionOption.click();
    }

    async clickCheckAvailability(): Promise<void> {
        await this.checkAvailabilityButton.click();
    }

    async verifyProductOfferingPageLoaded(): Promise<void> {
        await this.tracker.measure(
            "Page Load: Product Offerings",
            () =>
                expect(this.availabilityConfirmation).toBeVisible({
                    timeout: this.standardTimeout,
                }),
            'page-load',
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

        const isAddressError = await this.addressErrorText.isVisible({ timeout: 3000 }).catch(() => false);
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

    private async saveChangesAndWaitForDialogToClose(): Promise<void> {
        await this.tracker.measure(
            "Wait: Save Changes button",
            () => this.saveChangesButton.waitFor({ timeout: this.standardTimeout }),
        );
        await this.tracker.measure(
            "Dialog Close: Individual Channels (Save Changes click)",
            async () => {
                await this.saveChangesButton.click();
                await expect(this.individualChannelsDialog).toBeHidden({
                    timeout: this.standardTimeout,
                });
            },
            'dialog-close',
        );
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
        const hasSaveChangesButton = await this.saveChangesButton
            .isVisible({ timeout: this.shortTimeout })
            .catch(() => false);
        if (hasSaveChangesButton) {
            await this.saveChangesAndWaitForDialogToClose();
            await this.verifyToastMessage(successToast);
        } else {
            await this.addToPlanAndVerify(successToast);
        }
        await this.selectPhonePlan();
        for (const addon of config.phone.addons) {
            await this.selectAddonCheckbox(addon);
        }
        await this.addToPlanAndVerify(successToast);
    }

    // --- Checkout Flow ---

    async clickCheckout(): Promise<void> {
        await this.clickWhenReady(this.checkoutButton, "Checkout button");
        await this.tracker.measure(
            "Page Load: Checkout (Customer Information)",
            () =>
                expect(this.firstNameInput).toBeVisible({
                    timeout: this.standardTimeout,
                }),
            'page-load',
        );
    }

    private async selectAutocompleteByIndex(
        combobox: Locator,
        optionIndex: number,
        label: string,
    ): Promise<void> {
        await this.clickWhenReady(combobox, `Open dropdown: ${label}`);
        const option = this.page.getByRole("option").nth(optionIndex);
        await this.tracker.measure(`Wait: ${label} option`, () =>
            option.waitFor({ timeout: this.standardTimeout }),
        );
        await option.click();
    }

    async fillCustomerInformation(
        config: CheckoutFormData,
    ): Promise<void> {
        await this.selectAutocompleteByIndex(this.titleDropdown, 0, "Title");
        await this.fillField(this.firstNameInput, config.firstName);
        await this.fillField(this.lastNameInput, config.lastName);
        await this.dateOfBirthInput.fill(config.dateOfBirth);
        await this.fillField(this.phoneInput, config.phoneNumber);
        await this.selectAutocompleteByIndex(
            this.selectOptionDropdown,
            0,
            "Select Option",
        );
        await this.fillField(this.emailInput, config.email);
        await this.fillField(this.confirmEmailInput, config.email);
        await this.tracker.measure("Click: Generate password", async () => {
            await this.generatePasswordButton.waitFor({
                timeout: this.standardTimeout,
            });
            await this.generatePasswordButton.click();
        });
    }

    async clickSaveAndContinue(): Promise<void> {
        await this.clickWhenReady(
            this.saveAndContinueButton,
            "Save and Continue button",
        );
    }

    async verifyInstallationPopup(): Promise<void> {
        await this.tracker.measure(
            "Wait: Installation Information dialog",
            () =>
                expect(this.installationInfoText).toBeVisible({
                    timeout: this.standardTimeout,
                }),
        );
    }

    async confirmInstallation(): Promise<void> {
        await this.clickWhenReady(
            this.installationConfirmButton,
            "Installation Confirm button",
        );
        await this.tracker.measure(
            "Dialog Close: Installation Information (Confirm click)",
            () =>
                expect(this.installationDialog).toBeHidden({
                    timeout: this.standardTimeout,
                }),
            'dialog-close',
        );
    }

    // --- Installation Scheduling ---

    async selectInstallationDate(): Promise<void> {
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + 3);
        const dayAbbrev = days[targetDate.getDay()];
        const dayOfMonth = targetDate.getDate();

        for (let attempt = 0; attempt < 4; attempt++) {
            const dateButton = this.page.locator(
                `div[role="button"][aria-label^="${dayAbbrev} ${dayOfMonth},"][aria-disabled="false"]`,
            );
            try {
                await dateButton.waitFor({
                    state: "visible",
                    timeout: 3000,
                });
                await this.tracker.measure(
                    `Click: Installation date ${dayAbbrev} ${dayOfMonth}`,
                    () => dateButton.click(),
                );
                return;
            } catch {
                await this.nextWeekButton.click();
            }
        }

        throw new Error(
            `Could not find available installation date: ${dayAbbrev} ${dayOfMonth}`,
        );
    }

    async selectRandomTimeSlot(): Promise<void> {
        await this.tracker.measure("Wait: Time slots available", () =>
            this.timeSlots.first().waitFor({ timeout: this.standardTimeout }),
        );
        const count = await this.timeSlots.count();
        const randomIndex = Math.floor(Math.random() * count);
        const selectedSlot = this.timeSlots.nth(randomIndex);
        const slotLabel =
            (await selectedSlot.getAttribute("aria-label")) ?? "unknown";
        await this.tracker.measure(`Click: Time slot "${slotLabel}"`, () =>
            selectedSlot.click(),
        );
    }

    // --- Terms and Conditions ---

    async acceptTermsAndConditions(): Promise<void> {
        await this.clickWhenReady(this.tcLabel, "Terms and Conditions checkbox");
        await this.tracker.measure("Wait: Terms and Conditions loaded", () =>
            expect(this.tcDialog).toBeVisible({ timeout: this.standardTimeout }),
        );

        await this.tracker.measure(
            "Scroll: Terms and Conditions PDF",
            async () => {
                await this.pdfContainer.evaluate(async (el) => {
                    const step = 500;
                    const maxAttempts = 30;
                    for (let i = 0; i < maxAttempts; i++) {
                        el.scrollBy(0, step);
                        await new Promise((r) => setTimeout(r, 200));
                        if (
                            el.scrollTop + el.clientHeight >=
                            el.scrollHeight - 10
                        ) {
                            break;
                        }
                    }
                });
            },
        );

        await this.tracker.measure("Wait: Accept button enabled", () =>
            expect(this.tcAcceptButton).toBeEnabled({ timeout: this.standardTimeout }),
        );
        await this.tcAcceptButton.click();
        await this.tracker.measure(
            "Dialog Close: Terms and Conditions (Accept click)",
            () =>
                expect(this.tcDialog).toBeHidden({
                    timeout: this.standardTimeout,
                }),
            'dialog-close',
        );
    }

    // --- Complete Checkout ---

    async completeCheckoutFlow(config: CheckoutFormData): Promise<void> {
        await this.clickCheckout();
        await this.fillCustomerInformation(config);
        await this.clickSaveAndContinue();

        await this.verifyInstallationPopup();
        await this.confirmInstallation();

        await this.selectInstallationDate();
        await this.selectRandomTimeSlot();
        await this.clickSaveAndContinue();

        // Phone Number step uses pre-selected defaults
        await this.clickSaveAndContinue();

        await this.acceptTermsAndConditions();
    }
}
