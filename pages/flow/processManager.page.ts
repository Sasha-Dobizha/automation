import { expect, test, type Page, type Locator, type Browser } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { AUTH_PATHS } from '../../config/auth.config';
import { PROCESS_MANAGER_CONFIG } from '../../data/flow/processManager.data';
import { COMMON_TIMEOUTS } from '../../data/common.data';
import { newProcess, type ProcessData } from '../../factories/processManager.factory';

const { urls, selectors, messages, breadcrumbs } = PROCESS_MANAGER_CONFIG;

export class ProcessManagerPage {
    private readonly page: Page;

    // --- Page locators (Create Process) ---
    readonly newProcessButton: Locator;
    readonly dialog: Locator;
    readonly processNameInput: Locator;
    readonly processDescriptionTextarea: Locator;
    readonly processTypeDropdown: Locator;
    readonly processTypeOptions: Locator;
    readonly tagsInput: Locator;
    readonly createButton: Locator;
    readonly breadcrumb: Locator;
    readonly processCreatedToast: Locator;

    // --- Page locators (Edit Process / Deploy) ---
    readonly searchInput: Locator;
    readonly editProcessLink: Locator;
    readonly showingProcessesText: Locator;
    readonly stepLibraryTab: Locator;
    readonly stepSearchInput: Locator;
    readonly flowCanvas: Locator;
    readonly inputConfigurationAccordion: Locator;
    readonly ticketNameEditor: Locator;
    readonly closeStepModalButton: Locator;
    readonly deployButton: Locator;

    // --- Page locators (Initial Parameters) ---
    readonly initialParametersTab: Locator;
    readonly addNewParameterButton: Locator;
    readonly parameterNameInput: Locator;
    readonly confirmParameterButton: Locator;

    // --- Page locators (Trigger Process Step Config) ---

    // --- Page locators (Trigger Process - Define Execution) ---
    readonly defineExecutionButton: Locator;
    readonly firstNameInput: Locator;
    readonly uploadProcessButton: Locator;

    // --- Page locators (Trigger Process) ---
    readonly selectProcessDropdown: Locator;
    readonly submitExecutionButton: Locator;
    readonly executionSubmittedToast: Locator;
    readonly executionSubmittedDialogTitle: Locator;
    readonly viewExecutionButton: Locator;
    readonly leavePageButton: Locator;

    // --- Page locators (Process History) ---
    readonly processHistorySearchInput: Locator;
    readonly firstRowStatusCell: Locator;
    readonly refreshTableButton: Locator;

    // --- Page locators (Delete Process) ---
    readonly processCards: Locator;
    readonly settingsIcon: Locator;
    readonly deleteButton: Locator;
    readonly deleteConfirmationInput: Locator;
    readonly continueButton: Locator;
    readonly processDeletedToast: Locator;
    readonly noProcessesFoundText: Locator;

    // --- Page locators (Export Process) ---
    readonly exportButton: Locator;

    // --- Page locators (Import Process) ---
    readonly importProcessButton: Locator;
    readonly importAndCreateOption: Locator;
    readonly fileUploadInput: Locator;
    readonly confirmImportButton: Locator;

    // --- Page locators (Process Settings - Edit Details) ---
    readonly editProcessDetailsSection: Locator;
    readonly settingsProcessNameInput: Locator;
    readonly saveDetailsButton: Locator;
    readonly sidePanelCloseButton: Locator;

    // --- Page locators (Schedule Execution) ---
    readonly executionFrequencyDropdown: Locator;

    constructor(page: Page) {
        this.page = page;
        // Create Process locators
        this.newProcessButton = page.getByRole('button', { name: selectors.newProcessButton });
        this.dialog = page.getByRole('dialog');
        this.processNameInput = page.locator(`input[name="${selectors.processNameInput}"]`);
        this.processDescriptionTextarea = page.locator(
            `textarea[name="${selectors.processDescriptionTextarea}"]`,
        );
        this.processTypeDropdown = this.dialog
            .locator('label', { hasText: 'Process Type' })
            .locator('..')
            .locator('div[class*="-control"]').first();
        this.processTypeOptions = page.locator('[role="option"]');
        this.tagsInput = this.dialog
            .locator('label', { hasText: 'Tags' })
            .locator('..')
            .locator('input[role="combobox"]');
        this.createButton = this.dialog.locator('button').filter({ hasText: selectors.createButton }).last();
        this.breadcrumb = page.locator('nav[aria-label="breadcrumb"]');
        this.processCreatedToast = page.getByText(messages.processCreated);

        // Edit Process / Deploy locators
        this.searchInput = page.getByPlaceholder(selectors.searchPlaceholder, { exact: true });
        this.editProcessLink = page.getByText('Edit Process', { exact: true });
        this.showingProcessesText = page.getByText(/Showing .+ of .+ Process/);
        this.stepLibraryTab = page.getByRole('tab', { name: selectors.stepLibraryTab });
        this.stepSearchInput = page.locator(`input[placeholder="${selectors.stepSearchPlaceholder}"]`);
        this.flowCanvas = page.locator('text=Start End');
        this.inputConfigurationAccordion = page
            .getByRole('button', { name: new RegExp(selectors.inputConfigurationLabel) });
        this.ticketNameEditor = page
            .locator('div[contenteditable="true"][data-lexical-editor="true"]').first();
        this.closeStepModalButton = page
            .locator('[data-testid="CloseRoundedIcon"]').locator('..');
        this.deployButton = page.getByRole('button', { name: selectors.deployButton });

        // Initial Parameters locators
        this.initialParametersTab = page.getByRole('tab', { name: selectors.initialParametersTab });
        this.addNewParameterButton = page
            .locator('h4', { hasText: 'Input Parameters' })
            .locator('..').locator('..').getByRole('button', { name: selectors.addNewParameterButton });
        this.parameterNameInput = page.locator(`input[name="${selectors.parameterNameInputName}"]`);
        this.confirmParameterButton = page.getByRole('button', {
            name: selectors.confirmParameterButton,
            exact: true,
        });

        // Trigger Process - Define Execution locators
        this.defineExecutionButton = page.getByRole('button', { name: selectors.defineExecutionButton });
        this.firstNameInput = page.locator(`input#${selectors.initialParameterName}`);
        this.uploadProcessButton = page.getByRole('button', { name: selectors.uploadProcessButton });

        // Trigger Process locators
        this.selectProcessDropdown = page.locator('#react-select-2-input');
        this.submitExecutionButton = page.getByRole('button', { name: selectors.submitExecutionButton });
        this.executionSubmittedToast = page.getByText(messages.executionSubmittedToast);
        this.executionSubmittedDialogTitle = page.getByRole('heading', { name: messages.executionSubmittedDialog });
        this.viewExecutionButton = page.getByRole('button', { name: selectors.viewExecutionButton });
        this.leavePageButton = page.getByRole('button', { name: selectors.leavePageButton });

        // Process History locators
        this.processHistorySearchInput = page.locator(
            `input[placeholder="${selectors.processHistorySearchPlaceholder}"]`,
        );
        this.firstRowStatusCell = page.locator('tbody tr').first().locator('td').nth(1);
        this.refreshTableButton = page.locator('[aria-label="Refresh Table Data"] button');

        // Delete Process locators
        this.processCards = page.locator('[class*="configurationRoot"]');
        this.settingsIcon = page.locator('._settings_icon_m4deb_51');
        this.deleteButton = page.getByRole('button', { name: selectors.deleteButton, exact: true });
        this.deleteConfirmationInput = page.getByRole('textbox').nth(3);
        this.continueButton = page.getByRole('button', { name: selectors.continueButton, exact: true });
        this.processDeletedToast = page.getByText(messages.processDeleted);
        this.noProcessesFoundText = page.getByText(selectors.noProcessesFound, { exact: true });

        // Export Process locators
        this.exportButton = page.getByRole('button', { name: /Export/ });

        // Import Process locators
        this.importProcessButton = page.getByLabel('Import a Process');
        this.importAndCreateOption = page.getByRole('button', {
            name: 'Import and create a new Process',
        });
        this.fileUploadInput = page.locator('input#file-upload');
        this.confirmImportButton = page.getByRole('button', { name: 'Confirm', exact: true });

        // Process Settings - Edit Details locators
        this.editProcessDetailsSection = page
            .getByRole('heading', { name: selectors.editProcessDetails });
        this.settingsProcessNameInput = page.locator('input[name="processName"]');
        this.saveDetailsButton = page.getByRole('button', { name: selectors.saveDetailsButton });
        this.sidePanelCloseButton = page.locator(
            'svg[data-testid="CloseIcon"][class*="_sideModalCloseIcon_"]',
        ).first();

        // Schedule Execution locators
        this.executionFrequencyDropdown = page
            .locator('label').filter({ hasText: 'Execution Frequency' })
            .locator('..').locator('div[class*="-control"]').first();
    }

    // =====================
    // Private helpers
    // =====================

    private getComboboxByPlaceholder(placeholder: string | RegExp): Locator {
        const filter = typeof placeholder === 'string' ? { hasText: placeholder } : { hasText: placeholder };
        return this.page.locator('[id*="placeholder"]').filter(filter).locator('..').locator('input[role="combobox"]');
    }

    private get typeCombobox(): Locator {
        return this.getComboboxByPlaceholder('Ticket Type');
    }

    private get parameterTypeDropdown(): Locator {
        return this.getComboboxByPlaceholder(selectors.parameterTypePlaceholder);
    }

    private get childProcessCombobox(): Locator {
        return this.getComboboxByPlaceholder(/^Process$/);
    }

    private async searchAndOpenProcessSettings(processName: string): Promise<void> {
        await this.navigateToProcessManager();
        await this.searchForProcess(processName);
        await this.verifyProcessCardVisible();
        await this.clickProcessSettings();
    }

    private static async withAuthContext<T>(
        browser: Browser,
        fn: (pmPage: ProcessManagerPage) => Promise<T>,
    ): Promise<T> {
        const context = await browser.newContext({ storageState: AUTH_PATHS.adminState });
        const page = await context.newPage();
        const pmPage = new ProcessManagerPage(page);
        try {
            return await fn(pmPage);
        } finally {
            await context.close();
        }
    }

    private getStepLocator(stepId: number): Locator {
        return this.page.locator(`#step-id-${stepId}`);
    }

    private async waitAndClick(locator: Locator): Promise<void> {
        await locator.waitFor({ state: 'visible', timeout: COMMON_TIMEOUTS.short });
        await locator.click();
    }

    private async selectComboboxOption(
        input: Locator,
        value: string,
        {
            fill = true,
            exact = false,
            timeout = COMMON_TIMEOUTS.short,
        }: { fill?: boolean; exact?: boolean; timeout?: number } = {},
    ): Promise<void> {
        await input.click();
        if (fill) await input.fill(value);
        const option = this.page.getByRole('option', { name: value, exact });
        await option.waitFor({ timeout });
        await option.click();
    }

    private async dragAndDrop(
        source: Locator,
        target: Locator,
    ): Promise<void> {
        const sourceBox = await source.boundingBox();
        const targetBox = await target.boundingBox();

        if (!sourceBox || !targetBox) {
            throw new Error('Source or target element not found');
        }

        await this.page.mouse.move(
            sourceBox.x + sourceBox.width / 2,
            sourceBox.y + sourceBox.height / 2,
        );
        await this.page.mouse.down();

        await this.page.mouse.move(
            targetBox.x + targetBox.width / 2,
            targetBox.y + targetBox.height / 2,
        );
        await this.page.mouse.up();
    }

    private async submitExecutionAndVerify(
        processName: string,
        maxRetries: number = 10,
    ): Promise<void> {
        await test.step('Click Submit Execution button', async () => {
            await this.clickSubmitExecution();
        });

        await test.step('Verify execution submitted toast and dialog', async () => {
            await this.verifyExecutionSubmitted();
        });

        await test.step('Click View Execution button', async () => {
            await this.clickViewExecution();
        });

        await test.step('Click Leave Page button', async () => {
            await this.clickLeavePage();
        });

        await test.step('Search for process in Process History', async () => {
            await this.searchProcessHistory(processName);
        });

        await test.step('Verify process execution status is Success', async () => {
            await this.verifyProcessExecutionStatus('Success', maxRetries);
        });
    }

    private async wasProcessCreated(processName: string): Promise<boolean> {
        await this.navigateToProcessManager();
        await this.searchForProcess(processName);

        const processNameText = this.page.getByText(processName, { exact: true }).first();
        try {
            await processNameText.waitFor({ state: 'visible', timeout: COMMON_TIMEOUTS.standard });
            return true;
        } catch {
            return false;
        }
    }

    private async verifyProcessAbsentFromSearch(processName: string): Promise<void> {
        await this.searchForProcess(processName);
        await this.verifyNoProcessesFound();
    }

    // =====================
    // Navigation
    // =====================

    async navigateToProcessManager(): Promise<void> {
        await this.page.goto(urls.processManager);
        await expect(this.newProcessButton).toBeVisible({ timeout: COMMON_TIMEOUTS.standard });
    }

    // =====================
    // New Process dialog
    // =====================

    async clickNewProcess(): Promise<void> {
        await this.newProcessButton.click();
        await expect(this.dialog).toBeVisible({ timeout: COMMON_TIMEOUTS.short });
        await expect(this.processNameInput).toBeVisible({ timeout: COMMON_TIMEOUTS.short });
    }

    async fillProcessName(name: string): Promise<void> {
        await this.processNameInput.fill(name);
    }

    async fillProcessDescription(description: string): Promise<void> {
        await this.processDescriptionTextarea.fill(description);
    }

    async selectProcessType(optionIndex: number): Promise<void> {
        await this.processTypeDropdown.click();
        await this.processTypeOptions.first().waitFor({ timeout: COMMON_TIMEOUTS.short });
        await this.processTypeOptions.nth(optionIndex).click();
    }

    async addTag(tag: string): Promise<void> {
        await this.tagsInput.click();
        await this.tagsInput.pressSequentially(tag, { delay: 50 });
        await this.page.keyboard.press('Enter');
    }

    async clickCreate(): Promise<void> {
        await this.createButton.click();
    }

    // =====================
    // Assertions (Create)
    // =====================

    async verifyProcessCreatedToast(): Promise<void> {
        await expect(this.processCreatedToast).toBeVisible({
            timeout: COMMON_TIMEOUTS.standard,
        });
    }

    async verifyOnProcessManagerPage(): Promise<void> {
        await expect(this.breadcrumb.getByText(breadcrumbs.processManager)).toBeVisible({
            timeout: COMMON_TIMEOUTS.standard,
        });
    }

    // =====================
    // Search & Edit Process
    // =====================

    async searchForProcess(name: string): Promise<void> {
        await this.searchInput.fill(name);
    }

    async verifyProcessCardVisible(): Promise<void> {
        await expect(this.showingProcessesText).toBeVisible({ timeout: COMMON_TIMEOUTS.short });
    }

    async hoverProcessCardAndClickEdit(processName: string): Promise<void> {
        const processNameSpan = this.page.locator('span').filter({ hasText: processName }).last();
        await processNameSpan.hover({ timeout: COMMON_TIMEOUTS.short });
        await this.editProcessLink.waitFor({ state: 'visible', timeout: COMMON_TIMEOUTS.short });
        await this.editProcessLink.click();
    }

    async verifyProcessEditorLoaded(): Promise<void> {
        await expect(this.page).toHaveURL(urls.editorPattern, { timeout: COMMON_TIMEOUTS.standard });
    }

    // =====================
    // Step Library
    // =====================

    async ensureStepLibraryTab(): Promise<void> {
        await this.stepLibraryTab.click();
    }

    async searchForStep(stepName: string): Promise<void> {
        await this.stepSearchInput.fill(stepName);
    }

    async dragStepToAddNode(stepName: string): Promise<void> {
        const source = this.page.locator(`role=complementary >> text="${stepName}"`);
        await source.waitFor({ state: 'visible', timeout: COMMON_TIMEOUTS.short });
        await this.dragAndDrop(source, this.flowCanvas);
    }

    async verifyStepOnCanvas(stepId: number): Promise<void> {
        await expect(this.getStepLocator(stepId)).toBeVisible({
            timeout: COMMON_TIMEOUTS.short,
        });
    }

    async addDelegateStepAndOpenConfig(
        stepName: string,
        stepId: number = 2,
    ): Promise<void> {
        await this.ensureStepLibraryTab();
        await this.searchForStep(stepName);
        await this.dragStepToAddNode(stepName);
        await this.verifyStepOnCanvas(stepId);
        await this.clickOnStep(stepId);
        await this.expandInputConfiguration();
    }

    // =====================
    // Delegate Step Config
    // =====================

    async clickOnStep(stepId: number): Promise<void> {
        await this.getStepLocator(stepId).click();
    }

    async expandInputConfiguration(): Promise<void> {
        await this.inputConfigurationAccordion.click();
    }

    async fillTicketName(ticketName: string): Promise<void> {
        await this.ticketNameEditor.click();
        await this.page.keyboard.type(ticketName);
    }

    async selectStepType(typeName: string): Promise<void> {
        await this.selectComboboxOption(this.typeCombobox, typeName, { exact: true });
    }

    async closeStepModal(): Promise<void> {
        await this.closeStepModalButton.click();
    }

    // =====================
    // Initial Parameters
    // =====================

    async clickInitialParametersTab(): Promise<void> {
        await this.initialParametersTab.click();
    }

    async clickAddNewParameter(): Promise<void> {
        await this.addNewParameterButton.click();
    }

    async fillParameterName(name: string): Promise<void> {
        await this.parameterNameInput.fill(name);
    }

    async selectParameterType(typeName: string): Promise<void> {
        await this.selectComboboxOption(this.parameterTypeDropdown, typeName, {
            fill: false,
            exact: true,
        });
    }

    async clickConfirmParameter(): Promise<void> {
        await this.confirmParameterButton.click();
    }

    async verifyParameterAdded(paramName: string): Promise<void> {
        await expect(this.page.getByText(paramName, { exact: true })).toBeVisible({
            timeout: COMMON_TIMEOUTS.short,
        });
        await expect(this.page.getByText('Value (DYNAMIC):')).toBeVisible({
            timeout: COMMON_TIMEOUTS.short,
        });
        await expect(this.page.getByText('Data Type: ANYTHING')).toBeVisible({
            timeout: COMMON_TIMEOUTS.short,
        });
    }

    async addInitialParameter(paramName: string, paramType: string): Promise<void> {
        await test.step('Switch to Initial Parameters tab', async () => {
            await this.clickInitialParametersTab();
        });

        await test.step('Add a new parameter', async () => {
            await this.clickAddNewParameter();
            await this.fillParameterName(paramName);
            await this.selectParameterType(paramType);
            await this.clickConfirmParameter();
        });

        await test.step(`Verify parameter "${paramName}" was added`, async () => {
            await this.verifyParameterAdded(paramName);
        });
    }

    // =====================
    // Trigger Process Step Config
    // =====================

    async selectChildProcess(processName: string): Promise<void> {
        await this.selectComboboxOption(this.childProcessCombobox, processName, {
            timeout: COMMON_TIMEOUTS.standard,
        });
    }

    // =====================
    // Deploy
    // =====================

    async clickDeploy(): Promise<void> {
        await this.deployButton.click();
    }

    async verifyProcessDeployedToast(processName: string): Promise<void> {
        await expect(
            this.page.getByText(`${processName} ${messages.processDeployed}`),
        ).toBeVisible({ timeout: COMMON_TIMEOUTS.standard });
    }

    // =====================
    // Trigger Process
    // =====================

    async navigateToTrigger(): Promise<void> {
        await this.page.goto(urls.trigger);
        await expect(this.selectProcessDropdown).toBeVisible({ timeout: COMMON_TIMEOUTS.standard });
    }

    async selectProcessInTrigger(processName: string): Promise<void> {
        await this.selectComboboxOption(this.selectProcessDropdown, processName, {
            timeout: COMMON_TIMEOUTS.standard,
        });
    }

    async clickDefineExecution(): Promise<void> {
        await this.waitAndClick(this.defineExecutionButton);
    }

    async fillFirstNameInput(name: string): Promise<void> {
        await this.firstNameInput.waitFor({ state: 'visible', timeout: COMMON_TIMEOUTS.standard });
        await this.firstNameInput.fill(name);
    }

    async clickUploadProcess(): Promise<void> {
        await this.uploadProcessButton.click();
    }

    async clickSubmitExecution(): Promise<void> {
        await this.submitExecutionButton.click();
    }

    async verifyExecutionSubmitted(): Promise<void> {
        await expect(this.executionSubmittedToast).toBeVisible({
            timeout: COMMON_TIMEOUTS.standard,
        });
        await expect(this.executionSubmittedDialogTitle).toBeVisible({
            timeout: COMMON_TIMEOUTS.standard,
        });
    }

    async clickViewExecution(): Promise<void> {
        await this.viewExecutionButton.click();
    }

    async clickLeavePage(): Promise<void> {
        await this.leavePageButton.click();
    }

    // =====================
    // Process History
    // =====================

    async navigateToProcessHistory(): Promise<void> {
        await this.page.goto(urls.processHistory);
        await expect(this.processHistorySearchInput).toBeVisible({ timeout: COMMON_TIMEOUTS.standard });
    }

    async searchProcessHistory(processName: string): Promise<void> {
        await expect(this.processHistorySearchInput).toBeVisible({ timeout: COMMON_TIMEOUTS.standard });
        await this.processHistorySearchInput.fill(processName);
        await expect(this.firstRowStatusCell).toBeVisible({ timeout: COMMON_TIMEOUTS.short });
    }

    async verifyProcessExecutionStatus(expectedStatus: string, maxRetries: number = 10): Promise<void> {
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                await expect(this.firstRowStatusCell).toContainText(expectedStatus, {
                    timeout: 3000,
                });
                return;
            } catch {
                if (attempt === maxRetries - 1) {
                    throw new Error(
                        `Expected process execution status "${expectedStatus}" was not observed after ${maxRetries} checks.`,
                    );
                }
            }

            await this.refreshTableButton.click();
        }
    }

    // =====================
    // Delete Process
    // =====================

    async clickProcessSettings(): Promise<void> {
        await this.settingsIcon.waitFor({ state: 'visible', timeout: COMMON_TIMEOUTS.short });
        await this.settingsIcon.click();
    }

    async clickDelete(): Promise<void> {
        await this.waitAndClick(this.deleteButton);
    }

    async confirmDeleteProcess(): Promise<void> {
        await this.deleteConfirmationInput.waitFor({ state: 'visible', timeout: COMMON_TIMEOUTS.short });
        await this.deleteConfirmationInput.click();
        await this.deleteConfirmationInput.fill(selectors.deleteConfirmationText);
        await expect(this.continueButton).toBeEnabled({ timeout: COMMON_TIMEOUTS.short });
        await this.continueButton.click();
    }

    async verifyProcessDeletedToast(): Promise<void> {
        await expect(this.processDeletedToast).toBeVisible({
            timeout: COMMON_TIMEOUTS.standard,
        });
    }

    async verifyNoProcessesFound(): Promise<void> {
        await this.page.waitForLoadState('domcontentloaded');
        await expect(this.noProcessesFoundText).toBeVisible({
            timeout: COMMON_TIMEOUTS.standard,
        });
    }

    // =====================
    // Export Process
    // =====================

    async clickExport(): Promise<void> {
        await this.waitAndClick(this.exportButton);
    }

    // =====================
    // Import Process
    // =====================

    async clickImportProcessDropdown(): Promise<void> {
        await this.importProcessButton.click();
    }

    async selectImportAndCreateNew(): Promise<void> {
        await this.waitAndClick(this.importAndCreateOption);
    }

    async uploadProcessFile(filePath: string): Promise<void> {
        await this.fileUploadInput.setInputFiles(filePath);
    }

    async clickConfirmImport(): Promise<void> {
        await this.waitAndClick(this.confirmImportButton);
    }

    // =====================
    // Process Settings - Edit Details
    // =====================

    async clickEditProcessDetails(): Promise<void> {
        await this.waitAndClick(this.editProcessDetailsSection);
    }

    async updateProcessName(newName: string): Promise<void> {
        await this.settingsProcessNameInput.waitFor({
            state: 'visible',
            timeout: COMMON_TIMEOUTS.short,
        });
        await this.settingsProcessNameInput.clear();
        await this.settingsProcessNameInput.fill(newName);
    }

    async saveProcessDetails(): Promise<void> {
        await this.waitAndClick(this.saveDetailsButton);
    }

    async closeSidePanel(): Promise<void> {
        await this.waitAndClick(this.sidePanelCloseButton);
    }

    // =====================
    // Schedule Execution
    // =====================

    async selectExecutionFrequency(frequency: string): Promise<void> {
        await this.selectComboboxOption(this.executionFrequencyDropdown, frequency, {
            fill: false,
            exact: false,
        });
    }

    // =====================
    // Composite Flows
    // =====================

    async createProcess(data: ProcessData): Promise<void> {
        await test.step('Navigate to Process Manager page', async () => {
            await this.navigateToProcessManager();
        });

        await test.step('Click "+ New Process" button', async () => {
            await this.clickNewProcess();
        });

        await test.step('Enter process name and description', async () => {
            await this.fillProcessName(data.name);
            await this.fillProcessDescription(data.description);
        });

        await test.step('Select type as "Action (Service Ticket)"', async () => {
            // "Action (Service Ticket)" is the 4th option (index 3, 0-based)
            await this.selectProcessType(3);
        });

        await test.step('Add "automation" tag', async () => {
            await this.addTag(data.tag);
        });

        await test.step('Click Create button', async () => {
            await this.clickCreate();
        });

        await test.step(`Verify process "${data.name}" created successfully`, async () => {
            await this.verifyProcessCreatedToast();
        });
    }

    async searchAndOpenEditor(processName: string): Promise<void> {
        await test.step('Navigate to Process Manager page', async () => {
            await this.navigateToProcessManager();
        });

        await test.step('Search for the created process by name', async () => {
            await this.searchForProcess(processName);
            await this.verifyProcessCardVisible();
        });

        await test.step('Hover on process card and click Edit', async () => {
            await this.hoverProcessCardAndClickEdit(processName);
        });

        await test.step('Verify process editor opened', async () => {
            await this.verifyProcessEditorLoaded();
        });
    }

    async deployProcess(processName: string): Promise<void> {
        await test.step('Close the step configuration modal', async () => {
            await this.closeStepModal();
        });

        await test.step('Click Deploy button', async () => {
            await this.clickDeploy();
        });

        await test.step('Verify process deployed successfully', async () => {
            await this.verifyProcessDeployedToast(processName);
        });
    }

    async triggerAndVerifyProcess(
        processName: string,
        options?: { requiresExecutionInput?: boolean; firstName?: string },
    ): Promise<void> {
        await test.step('Navigate to Process Trigger page', async () => {
            await this.navigateToTrigger();
        });

        await test.step('Select process from the dropdown', async () => {
            await this.selectProcessInTrigger(processName);
        });

        if (options?.requiresExecutionInput) {
            await test.step('Click Define Execution button', async () => {
                await this.clickDefineExecution();
            });

            await test.step('Fill in the first_name field with a random name', async () => {
                await this.fillFirstNameInput(options.firstName ?? '');
            });

            await test.step('Click Upload Process button', async () => {
                await this.clickUploadProcess();
            });
        }

        await this.submitExecutionAndVerify(processName);
    }

    async exportProcess(processName: string): Promise<string> {
        await test.step('Search for process and open settings', async () => {
            await this.searchAndOpenProcessSettings(processName);
        });

        let filePath = '';
        await test.step('Click Export and download the process file', async () => {
            const downloadPromise = this.page.waitForEvent('download');
            await this.clickExport();
            const download = await downloadPromise;
            const downloadsDir = path.join(process.cwd(), 'test-downloads');
            if (!fs.existsSync(downloadsDir)) {
                fs.mkdirSync(downloadsDir, { recursive: true });
            }
            filePath = path.join(downloadsDir, download.suggestedFilename());
            await download.saveAs(filePath);
        });

        await test.step('Verify exported file exists', async () => {
            expect(fs.existsSync(filePath)).toBeTruthy();
        });

        return filePath;
    }

    async importProcess(filePath: string): Promise<void> {
        await test.step('Navigate to Process Manager page', async () => {
            await this.navigateToProcessManager();
        });

        await test.step('Click "Import a Process" dropdown', async () => {
            await this.clickImportProcessDropdown();
        });

        await test.step('Select "Import and Create a New Process"', async () => {
            await this.selectImportAndCreateNew();
        });

        await test.step('Upload the process JSON file', async () => {
            await this.uploadProcessFile(filePath);
        });

        await test.step('Click Confirm to complete import', async () => {
            await this.clickConfirmImport();
        });
    }

    async renameProcess(currentName: string, newName: string): Promise<void> {
        await test.step('Search for process and open settings', async () => {
            await this.searchAndOpenProcessSettings(currentName);
        });

        await test.step('Click Edit Process Details', async () => {
            await this.clickEditProcessDetails();
        });

        await test.step(`Rename process to "${newName}"`, async () => {
            await this.updateProcessName(newName);
        });

        await test.step('Save process details', async () => {
            await this.saveProcessDetails();
        });

        await test.step('Close side panel', async () => {
            await this.closeSidePanel();
        });

        await test.step('Navigate to Process Manager to reset search filters', async () => {
            await this.navigateToProcessManager();
        });
    }

    async scheduleAndVerifyProcess(
        processName: string,
        minutesAhead: number = 1,
    ): Promise<void> {
        await test.step('Navigate to Process Trigger page', async () => {
            await this.navigateToTrigger();
        });

        await test.step('Select process from the dropdown', async () => {
            await this.selectProcessInTrigger(processName);
        });

        await test.step('Select "Only Once" execution frequency', async () => {
            await this.selectExecutionFrequency('Only Once');
        });

        await this.submitExecutionAndVerify(processName, 20);
    }

    async openAndDeploy(processName: string): Promise<void> {
        await test.step('Navigate to Process Manager page', async () => {
            await this.navigateToProcessManager();
        });

        await test.step('Search for the process by name', async () => {
            await this.searchForProcess(processName);
            await this.verifyProcessCardVisible();
        });

        await test.step('Hover on process card and click Edit', async () => {
            await this.hoverProcessCardAndClickEdit(processName);
        });

        await test.step('Verify process editor loaded', async () => {
            await this.verifyProcessEditorLoaded();
        });

        await test.step('Deploy the process', async () => {
            await this.clickDeploy();
        });

        await test.step('Verify process deployed successfully', async () => {
            await this.verifyProcessDeployedToast(processName);
        });
    }

    async deleteProcess(processName: string): Promise<void> {
        await test.step('Search for process and open settings', async () => {
            await this.searchAndOpenProcessSettings(processName);
        });

        await test.step('Click Delete button', async () => {
            await this.clickDelete();
        });

        await test.step('Type confirmation text and click Continue', async () => {
            await this.confirmDeleteProcess();
        });

        await test.step('Verify process deleted toast message', async () => {
            await this.verifyProcessDeletedToast();
        });

        await test.step('Verify process no longer appears in search', async () => {
            await this.verifyProcessAbsentFromSearch(processName);
        });
    }

    static async createProcessForTests(
        browser: Browser,
        options?: { retryOnceOnCreateFailure?: boolean },
    ): Promise<string> {
        return ProcessManagerPage.withAuthContext(browser, async (pmPage) => {
            const processData = newProcess.build();

            await test.step(`Create process for tests: "${processData.name}"`, async () => {
                try {
                    await pmPage.createProcess(processData);
                } catch (error) {
                    if (!options?.retryOnceOnCreateFailure) {
                        throw error;
                    }

                    const createdWithoutToast = await pmPage.wasProcessCreated(processData.name);
                    if (!createdWithoutToast) {
                        await test.step(
                            `Retry process creation once: "${processData.name}"`,
                            async () => {
                                await pmPage.createProcess(processData);
                            },
                        );
                    }
                }
            });

            return processData.name;
        });
    }

    static async createAndDeployProcessForTests(browser: Browser): Promise<string> {
        return ProcessManagerPage.withAuthContext(browser, async (pmPage) => {
            const processData = newProcess.build();
            await pmPage.createProcess(processData);
            await pmPage.openAndDeploy(processData.name);
            return processData.name;
        });
    }

    static async deployProcessForTests(browser: Browser, processName: string): Promise<void> {
        await ProcessManagerPage.withAuthContext(browser, async (pmPage) => {
            await pmPage.openAndDeploy(processName);
        });
    }

    static async deleteProcessForTests(browser: Browser, processNames: string[]): Promise<void> {
        await ProcessManagerPage.withAuthContext(browser, async (pmPage) => {
            for (const name of processNames) {
                if (!name) continue;
                try {
                    await pmPage.deleteProcess(name);
                } catch {
                    console.warn(`[Cleanup] Failed to delete process "${name}" — it may have already been removed.`);
                }
            }
        });
    }
}
