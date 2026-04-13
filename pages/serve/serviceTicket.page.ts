import { expect, test, type Page, type Locator } from '@playwright/test';
import { COMMON_TIMEOUTS } from '../../data/common.data';
import { SERVICE_TICKET_CONFIG } from '../../data/serve/serviceTicket.data';

const { urls, selectors, messages } = SERVICE_TICKET_CONFIG;

export class ServiceTicketPage {
    // --- Service Ticket Type form ---
    readonly ticketTypeNameTextarea: Locator;
    readonly addActionButton: Locator;
    readonly designTab: Locator;
    readonly processTab: Locator;
    readonly resultMessagesTab: Locator;
    readonly actionNameInput: Locator;
    readonly processCombobox: Locator;
    readonly onSuccessMessageTextarea: Locator;
    readonly onErrorMessageTextarea: Locator;
    readonly createActionButton: Locator;
    readonly saveChangesButton: Locator;

    // --- Service Ticket form ---
    readonly createTicketButton: Locator;
    readonly ticketNameInput: Locator;
    readonly ticketTypeCombobox: Locator;
    readonly assigneeCombobox: Locator;
    readonly submitCreateButton: Locator;

    // --- Service Ticket list ---
    readonly searchInput: Locator;

    // --- Service Ticket details ---
    readonly ticketDetailsTab: Locator;
    readonly actionsMenuIcon: Locator;
    readonly executeActionButton: Locator;
    readonly viewTicketToastContainer: Locator;
    readonly viewTicketLinkBase: Locator;
    readonly ticketSpanBase: Locator;
    readonly ticketDetailsTabName: string;
    readonly ticketCreatedMessageSuffix: string;
    readonly ticketDeletedMessageSuffix: string;
    readonly deleteTicketOption: Locator;
    readonly deleteConfirmButton: Locator;

    // --- Front Office / Service Ticket Type management ---
    readonly ticketTypeAccordionExpand: Locator;
    readonly searchTicketTypesInput: Locator;
    readonly confirmDeleteTicketTypeTextbox: Locator;
    readonly confirmTicketTypeButton: Locator;
    private readonly deleteTypeIconSelector: string;

    private readonly page: Page;

    constructor(page: Page) {
        this.page = page;
        // Service Ticket Type form locators
        this.ticketTypeNameTextarea = page.locator(`textarea[name="${selectors.ticketTypeNameInput}"]`);
        this.addActionButton = page.getByRole('button', { name: selectors.addActionButton });
        this.designTab = page.getByRole('tab', { name: selectors.designTab });
        this.processTab = page.getByRole('tab', { name: selectors.processTab });
        this.resultMessagesTab = page.getByRole('tab', { name: selectors.resultMessagesTab });
        this.actionNameInput = page.locator('input[name="name"][placeholder="Enter Action Name..."]');
        this.processCombobox = page.locator('input[role="combobox"]').last();
        this.onSuccessMessageTextarea = page.locator(`textarea[name="${selectors.onSuccessMessageInput}"]`);
        this.onErrorMessageTextarea = page.locator(`textarea[name="${selectors.onErrorMessageInput}"]`);
        this.createActionButton = page.locator('button').filter({ hasText: selectors.createButton }).last();
        this.saveChangesButton = page.getByRole('button', { name: selectors.saveChangesButton });

        // Service Ticket form locators (scoped to Create Service Ticket dialog to avoid matching Symphona AI combobox)
        const createTicketDialog = page.getByRole('dialog', { name: 'Create Service Ticket' });
        this.createTicketButton = page.getByRole('button', { name: selectors.createTicketButton }).first();
        this.ticketNameInput = createTicketDialog.locator(`input[name="${selectors.ticketNameInput}"]`);
        this.ticketTypeCombobox = createTicketDialog
            .locator('label:has-text("Ticket Type")')
            .locator('xpath=..')
            .locator('input[role="combobox"]');
        this.assigneeCombobox = createTicketDialog.locator('.assignee__input-container input[role="combobox"]');
        this.submitCreateButton = createTicketDialog.getByRole('button', {
            name: selectors.createButton,
            exact: true,
        });

        // Service Ticket list locators
        this.searchInput = page.getByPlaceholder(selectors.searchPlaceholder, { exact: true });

        // Service Ticket details locators
        this.ticketDetailsTab = page.getByRole('tab', { name: selectors.ticketDetailsTab });
        this.actionsMenuIcon = page.locator('span[aria-label="Actions"]');
        this.executeActionButton = page
            .getByRole('dialog')
            .getByRole('button', { name: selectors.executeActionButton, exact: true });
        this.viewTicketToastContainer = page
            .locator('[class*="Toastify"]')
            .filter({ hasText: messages.actionExecuted });
        this.viewTicketLinkBase = this.viewTicketToastContainer.locator('a, button');
        this.ticketSpanBase = page.locator('span');
        this.ticketDetailsTabName = selectors.ticketDetailsTab;
        this.ticketCreatedMessageSuffix = messages.ticketCreated;
        this.ticketDeletedMessageSuffix = messages.ticketDeleted;
        this.deleteTicketOption = page.getByText(selectors.deleteTicketText);
        this.deleteConfirmButton = page.getByRole('button', { name: selectors.deleteButton, exact: true });

        // Front Office / Service Ticket Type management locators
        this.ticketTypeAccordionExpand = page.locator('[data-testid="ExpandMoreRoundedIcon"]').first();
        this.searchTicketTypesInput = page.getByPlaceholder(selectors.searchTicketTypesPlaceholder);
        const deleteTicketTypeDialog = page.getByRole('dialog');
        this.confirmDeleteTicketTypeTextbox = deleteTicketTypeDialog.getByRole('textbox');
        this.confirmTicketTypeButton = deleteTicketTypeDialog.getByRole('button', {
            name: selectors.confirmTicketTypeButton,
        });
        this.deleteTypeIconSelector = '[data-testid="DeleteOutlineRoundedIcon"]';
    }

    // =====================
    // Private helpers
    // =====================

    private async waitAndClick(locator: Locator): Promise<void> {
        await locator.waitFor({ state: 'visible', timeout: COMMON_TIMEOUTS.short });
        await locator.click();
    }

    private async selectComboboxOption(
        input: Locator,
        value: string,
        { timeout = COMMON_TIMEOUTS.short }: { timeout?: number } = {},
    ): Promise<void> {
        await input.scrollIntoViewIfNeeded();
        await input.click();
        await input.fill(value);
        const option = this.page.getByRole('option', { name: value });
        await option.waitFor({ timeout });
        await option.click();
    }

    private getTicketSpan(ticketName: string): Locator {
        return this.ticketSpanBase.filter({ hasText: ticketName }).first();
    }

    private getActionButton(actionName: string): Locator {
        return this.page.getByRole('button', { name: actionName });
    }

    private async fillTextarea(locator: Locator, text: string): Promise<void> {
        await locator.clear();
        await locator.fill(text);
    }

    private async searchInInput(input: Locator, searchText: string): Promise<void> {
        await input.waitFor({ state: 'visible', timeout: COMMON_TIMEOUTS.short });
        await input.fill(searchText);
        await expect(input).toHaveValue(searchText, { timeout: COMMON_TIMEOUTS.short });
    }

    private async verifyToast(message: string): Promise<void> {
        await expect(this.page.getByText(message)).toBeVisible({
            timeout: COMMON_TIMEOUTS.standard,
        });
    }

    // =====================
    // Navigation
    // =====================

    async navigateToCreateServiceTicketType(): Promise<void> {
        await this.page.goto(urls.createServiceTicketType);
        await expect(this.ticketTypeNameTextarea).toBeVisible({ timeout: COMMON_TIMEOUTS.standard });
    }

    async navigateToServiceTickets(): Promise<void> {
        await this.page.goto(urls.serviceTickets);
        await expect(this.createTicketButton).toBeVisible({ timeout: COMMON_TIMEOUTS.standard });
    }

    async navigateToFrontOffice(): Promise<void> {
        await this.page.goto(urls.frontOffice, { waitUntil: 'domcontentloaded' });
        await expect(this.ticketTypeAccordionExpand).toBeVisible({ timeout: COMMON_TIMEOUTS.standard });
    }

    // =====================
    // Create Service Ticket Type
    // =====================

    async fillTicketTypeName(name: string): Promise<void> {
        await this.ticketTypeNameTextarea.fill(name);
    }

    async clickAddAction(): Promise<void> {
        await this.waitAndClick(this.addActionButton);
    }

    async clickDesignTab(): Promise<void> {
        await this.waitAndClick(this.designTab);
    }

    async fillActionName(name: string): Promise<void> {
        await this.actionNameInput.waitFor({ state: 'visible', timeout: COMMON_TIMEOUTS.short });
        await this.actionNameInput.fill(name);
    }

    async clickProcessTab(): Promise<void> {
        await this.waitAndClick(this.processTab);
    }

    async selectProcess(processName: string): Promise<void> {
        await this.selectComboboxOption(this.processCombobox, processName, {
            timeout: COMMON_TIMEOUTS.standard,
        });
    }

    async clickResultMessagesTab(): Promise<void> {
        await this.waitAndClick(this.resultMessagesTab);
    }

    async fillSuccessMessage(message: string): Promise<void> {
        await this.fillTextarea(this.onSuccessMessageTextarea, message);
    }

    async fillErrorMessage(message: string): Promise<void> {
        await this.fillTextarea(this.onErrorMessageTextarea, message);
    }

    async clickCreateAction(): Promise<void> {
        await this.waitAndClick(this.createActionButton);
    }

    async clickSaveChanges(): Promise<void> {
        await this.waitAndClick(this.saveChangesButton);
    }

    async verifyTicketTypeCreatedToast(): Promise<void> {
        await this.verifyToast(messages.ticketTypeCreated);
    }

    // =====================
    // Create Service Ticket
    // =====================

    async clickCreateTicket(): Promise<void> {
        await this.waitAndClick(this.createTicketButton);
    }

    async fillTicketName(name: string): Promise<void> {
        await this.ticketNameInput.waitFor({ state: 'visible', timeout: COMMON_TIMEOUTS.short });
        await this.ticketNameInput.fill(name);
    }

    async selectTicketType(typeName: string): Promise<void> {
        await this.selectComboboxOption(this.ticketTypeCombobox, typeName, {
            timeout: COMMON_TIMEOUTS.standard,
        });
    }

    async selectAssignee(assigneeName: string): Promise<void> {
        await this.selectComboboxOption(this.assigneeCombobox, assigneeName, {
            timeout: COMMON_TIMEOUTS.standard,
        });
    }

    async clickSubmitCreate(): Promise<void> {
        await this.waitAndClick(this.submitCreateButton);
    }

    async verifyTicketCreatedToast(ticketName: string): Promise<void> {
        await this.verifyToast(`${ticketName} ${this.ticketCreatedMessageSuffix}`);
    }

    // =====================
    // Search & Open Service Ticket
    // =====================

    async searchForTicket(ticketName: string): Promise<void> {
        await this.searchInInput(this.searchInput, ticketName);
    }

    async clickTicketById(ticketName: string): Promise<void> {
        await this.waitAndClick(this.getTicketSpan(ticketName));
    }

    // =====================
    // Execute Action
    // =====================

    async clickActionButton(actionName: string): Promise<void> {
        await this.waitAndClick(this.getActionButton(actionName));
    }

    async clickExecuteAction(): Promise<void> {
        await this.waitAndClick(this.executeActionButton);
    }

    async verifyActionExecutedToast(): Promise<void> {
        await this.verifyToast(messages.actionExecuted);
    }

    async clickViewTicketLinkInToast(ticketName: string): Promise<Page> {
        const escapedName = ticketName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const viewTicketLink = this.viewTicketLinkBase
            .filter({ hasText: new RegExp(`View.*${escapedName}`, 'i') })
            .first();
        await viewTicketLink.waitFor({ state: 'visible', timeout: COMMON_TIMEOUTS.standard });

        const [newPage] = await Promise.all([
            this.page.context().waitForEvent('page'),
            viewTicketLink.click(),
        ]);
        await newPage.waitForLoadState('domcontentloaded');
        return newPage;
    }

    async verifyOnTicketDetailsTab(page?: Page): Promise<void> {
        const ticketDetailsTab =
            page === undefined
                ? this.ticketDetailsTab
                : page.getByRole('tab', { name: this.ticketDetailsTabName });
        await expect(ticketDetailsTab).toBeVisible({ timeout: COMMON_TIMEOUTS.standard });
        await expect(ticketDetailsTab).toHaveAttribute('aria-selected', 'true');
    }

    // =====================
    // Delete Service Ticket
    // =====================

    async clickActionsMenu(): Promise<void> {
        await this.waitAndClick(this.actionsMenuIcon);
    }

    async clickDeleteTicket(): Promise<void> {
        await this.waitAndClick(this.deleteTicketOption);
    }

    async confirmDelete(): Promise<void> {
        await this.waitAndClick(this.deleteConfirmButton);
    }

    async verifyTicketDeletedToast(ticketName: string): Promise<void> {
        await this.verifyToast(`${ticketName} ${this.ticketDeletedMessageSuffix}`);
    }

    // =====================
    // Delete Service Ticket Type
    // =====================

    async expandServiceTicketTypeSection(): Promise<void> {
        await this.waitAndClick(this.ticketTypeAccordionExpand);
    }

    async searchForTicketType(typeName: string): Promise<void> {
        await this.searchInInput(this.searchTicketTypesInput, typeName);
    }


    async hoverAndDeleteTicketType(typeName: string): Promise<void> {
        const row = this.page.getByRole('row').filter({ hasText: typeName }).first();
        await row.waitFor({ state: 'visible', timeout: COMMON_TIMEOUTS.short });
        await row.scrollIntoViewIfNeeded();
        await row.hover();
        const deleteIcon = row.locator(this.deleteTypeIconSelector);
        await deleteIcon.click({ force: true });
    }

    async confirmDeleteTicketType(): Promise<void> {
        await this.confirmDeleteTicketTypeTextbox.fill(selectors.confirmDeleteTicketTypeText);
        await this.waitAndClick(this.confirmTicketTypeButton);
    }

    async verifyTicketTypeDeletedToast(): Promise<void> {
        await this.verifyToast(messages.ticketTypeDeleted);
    }

    // =====================
    // Composite Flows
    // =====================

    async createServiceTicketType(
        typeName: string,
        actionName: string,
        processName: string,
        successMessage: string,
        errorMessage: string,
    ): Promise<void> {
        await test.step('Navigate to Create Service Ticket Type page', async () => {
            await this.navigateToCreateServiceTicketType();
        });

        await test.step(`Fill Service Ticket Type name: "${typeName}"`, async () => {
            await this.fillTicketTypeName(typeName);
        });

        await test.step('Click "+ Add Action" button', async () => {
            await this.clickAddAction();
        });

        await test.step('Go to Design tab and fill Action name', async () => {
            await this.clickDesignTab();
            await this.fillActionName(actionName);
        });

        await test.step('Go to Process tab and select process', async () => {
            await this.clickProcessTab();
            await this.selectProcess(processName);
        });

        await test.step('Go to Result Messages tab and update messages', async () => {
            await this.clickResultMessagesTab();
            await this.fillSuccessMessage(successMessage);
            await this.fillErrorMessage(errorMessage);
        });

        await test.step('Click Create button to create the action', async () => {
            await this.clickCreateAction();
        });

        await test.step('Click "Save Changes" to create the Service Ticket Type', async () => {
            await this.clickSaveChanges();
        });

        await test.step('Verify Service Ticket Type created toast', async () => {
            await this.verifyTicketTypeCreatedToast();
        });
    }

    async createServiceTicket(
        ticketName: string,
        ticketTypeName: string,
        assignee: string,
    ): Promise<void> {
        await test.step('Navigate to Service Tickets page', async () => {
            await this.navigateToServiceTickets();
        });

        await test.step('Click "+ Create" button', async () => {
            await this.clickCreateTicket();
        });

        await test.step(`Fill Ticket Name: "${ticketName}"`, async () => {
            await this.fillTicketName(ticketName);
        });

        await test.step(`Select Ticket Type: "${ticketTypeName}"`, async () => {
            await this.selectTicketType(ticketTypeName);
        });

        await test.step(`Select Assignee: "${assignee}"`, async () => {
            await this.selectAssignee(assignee);
        });

        await test.step('Click Create to submit the form', async () => {
            await this.clickSubmitCreate();
        });

        await test.step('Verify Service Ticket created toast', async () => {
            await this.verifyTicketCreatedToast(ticketName);
        });
    }

    async searchAndExecuteAction(
        ticketName: string,
        actionName: string,
    ): Promise<void> {
        await test.step('Navigate to Service Tickets page', async () => {
            await this.navigateToServiceTickets();
        });

        await test.step(`Search for service ticket: "${ticketName}"`, async () => {
            await this.searchForTicket(ticketName);
        });

        await test.step('Click on the service ticket to open it', async () => {
            await this.clickTicketById(ticketName);
        });

        await test.step(`Click the "${actionName}" action button`, async () => {
            await this.clickActionButton(actionName);
        });

        await test.step('Click "Execute Action" in the confirmation dialog', async () => {
            await this.clickExecuteAction();
        });

        let newPage: Page | undefined;
        await test.step('Click "View Ticket" link in toast (opens in new tab)', async () => {
            newPage = await this.clickViewTicketLinkInToast(ticketName);
        });

        await test.step('Verify redirected to Ticket Details tab', async () => {
            await this.verifyOnTicketDetailsTab(newPage);
        });
    }

    async deleteServiceTicket(ticketName: string): Promise<void> {
        await test.step('Navigate to Service Tickets page', async () => {
            await this.navigateToServiceTickets();
        });

        await test.step(`Search for service ticket: "${ticketName}"`, async () => {
            await this.searchForTicket(ticketName);
        });

        await test.step('Click on the service ticket to open it', async () => {
            await this.clickTicketById(ticketName);
        });

        await test.step('Click Actions menu icon', async () => {
            await this.clickActionsMenu();
        });

        await test.step('Click "Delete Ticket" option', async () => {
            await this.clickDeleteTicket();
        });

        await test.step('Confirm deletion', async () => {
            await this.confirmDelete();
        });

        await test.step('Verify ticket deleted toast', async () => {
            await this.verifyTicketDeletedToast(ticketName);
        });
    }

    async deleteServiceTicketType(typeName: string): Promise<void> {
        await test.step('Navigate to Front Office settings', async () => {
            await this.navigateToFrontOffice();
        });

        await test.step('Expand Service Ticket Type section', async () => {
            await this.expandServiceTicketTypeSection();
        });

        await test.step('Hover on ticket type row and click delete', async () => {
            await this.hoverAndDeleteTicketType(typeName);
        });

        await test.step('Confirm deletion of ticket type', async () => {
            await this.confirmDeleteTicketType();
        });

        await test.step('Verify ticket type deleted toast', async () => {
            await this.verifyTicketTypeDeletedToast();
        });
    }
}
