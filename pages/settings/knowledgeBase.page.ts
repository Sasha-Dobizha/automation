import { expect, test, type Page, type Locator } from '@playwright/test';
import { KNOWLEDGE_BASE_CONFIG } from '../../data/knowledgeBase/knowledgeBase.data';
import path from 'path';

const { urls, selectors, messages, testData, sourceTypeIndex, timeouts } = KNOWLEDGE_BASE_CONFIG;

export class KnowledgeBasePage {
    readonly aiKnowledgeBaseAccordion: Locator;
    readonly expandIcon: Locator;
    readonly createKBButton: Locator;
    readonly kbNameTextarea: Locator;
    readonly createKSButton: Locator;
    readonly finalCreateKBButton: Locator;
    readonly sourceTypeDropdown: Locator;
    readonly ksNameInput: Locator;
    readonly ksSubmitButton: Locator;
    readonly plainTextInput: Locator;
    readonly urlInput: Locator;
    readonly addParameterButton: Locator;
    readonly parameterNameInput: Locator;
    readonly parameterValueInput: Locator;
    readonly crawlWebsiteToggle: Locator;
    readonly crawlMaxDepthInput: Locator;
    readonly searchInput: Locator;
    readonly toastContainer: Locator;
    readonly toastCloseButton: Locator;
    readonly dialog: Locator;
    readonly deleteConfirmInput: Locator;
    readonly confirmButton: Locator;

    private readonly page: Page;

    constructor(page: Page) {
        this.page = page;
        this.aiKnowledgeBaseAccordion = page.locator('.MuiAccordion-root').filter({
            hasText: selectors.aiKnowledgeBaseText,
        });
        this.expandIcon = this.aiKnowledgeBaseAccordion.locator(
            '[data-testid="ExpandMoreRoundedIcon"]',
        );
        this.createKBButton = page
            .getByRole('button', { name: selectors.createKnowledgeBaseButton })
            .first();
        this.kbNameTextarea = page.locator('textarea[name="name"]');
        this.createKSButton = page.getByRole('button', {
            name: selectors.createKnowledgeSourceButton,
        });
        this.finalCreateKBButton = page
            .locator('button.MuiLoadingButton-root')
            .filter({ hasText: selectors.createKnowledgeBaseButton });

        this.sourceTypeDropdown = page.locator('.css-1xc3v61-indicatorContainer').first();
        this.ksNameInput = page.locator('input#Name');
        this.ksSubmitButton = page.getByRole('button', {
            name: selectors.createButton,
            exact: true,
        });

        this.plainTextInput = page.locator('textarea[name="source.plainText"]');
        this.urlInput = page.locator('input[name="url"]');
        this.addParameterButton = page
            .locator('div')
            .filter({ hasText: /^API Request Header Parameters/ })
            .getByRole('button', { name: selectors.addParameterButton });
        this.parameterNameInput = page.getByPlaceholder(selectors.parameterNamePlaceholder);
        this.parameterValueInput = page.getByPlaceholder(selectors.parameterValuePlaceholder);
        this.crawlWebsiteToggle = page
            .locator('div')
            .filter({ hasText: /^Crawl Website/ })
            .locator('.MuiSwitch-switchBase');
        this.crawlMaxDepthInput = page.locator('input[name="maxCrawlDepth"][type="text"]');

        this.searchInput = page.getByPlaceholder(selectors.searchPlaceholder);

        this.toastContainer = page.locator('.Toastify__toast');
        this.toastCloseButton = page.locator('.Toastify__toast button.MuiIconButton-root');

        this.dialog = page.getByRole('dialog');
        this.deleteConfirmInput = this.dialog.locator('input');
        this.confirmButton = this.dialog.getByRole('button', {
            name: selectors.confirmButton,
        });
    }

    // =====================
    // Private helpers
    // =====================

    private async waitAndClick(locator: Locator): Promise<void> {
        await locator.waitFor({ state: 'visible', timeout: timeouts.short });
        await locator.click();
    }

    private async waitAndFill(locator: Locator, value: string): Promise<void> {
        await locator.waitFor({ state: 'visible', timeout: timeouts.short });
        await locator.fill(value);
    }

    private async verifyToast(message: string): Promise<void> {
        await expect(this.page.getByText(message)).toBeVisible({
            timeout: timeouts.standard,
        });
    }

    private async dismissToast(message: string): Promise<void> {
        const closeButton = this.toastContainer
            .filter({ hasText: message })
            .locator('button.MuiIconButton-root');
        if (await closeButton.isVisible({ timeout: timeouts.short })) {
            await closeButton.click();
        }
    }

    private getKBRow(name: string): Locator {
        return this.page.getByRole('row').filter({ hasText: name });
    }

    // =====================
    // Navigation
    // =====================

    async navigateToGeneralSettings(): Promise<void> {
        await this.page.goto(urls.generalSettings);
        await expect(this.aiKnowledgeBaseAccordion).toBeVisible({
            timeout: timeouts.standard,
        });
    }

    async navigateToKnowledgeBases(): Promise<void> {
        await this.page.goto(urls.knowledgeBases);
        await expect(this.searchInput).toBeVisible({ timeout: timeouts.standard });
    }

    // =====================
    // Private actions
    // =====================

    private async expandAIKnowledgeBase(): Promise<void> {
        await this.waitAndClick(this.expandIcon);
    }

    private async clickCreateKnowledgeBase(): Promise<void> {
        await this.waitAndClick(this.createKBButton);
    }

    private async fillKBName(name: string): Promise<void> {
        await this.waitAndFill(this.kbNameTextarea, name);
    }

    private async clickCreateKnowledgeSource(): Promise<void> {
        await this.waitAndClick(this.createKSButton);
    }

    private async selectSourceType(index: number): Promise<void> {
        await this.waitAndClick(this.sourceTypeDropdown);
        await this.page.locator('[role="option"]').nth(index).click();
    }

    private async fillKSName(name: string): Promise<void> {
        await this.waitAndFill(this.ksNameInput, name);
    }

    private async fillPlainText(text: string): Promise<void> {
        await this.plainTextInput.fill(text);
    }

    private async uploadFile(filePath: string): Promise<void> {
        await this.page.locator('input#file-upload').setInputFiles(filePath);
    }

    private async fillUrl(url: string): Promise<void> {
        await this.urlInput.fill(url);
    }

    private async addHeaderParameter(name: string, value: string): Promise<void> {
        await this.waitAndClick(this.addParameterButton);
        await this.parameterNameInput.fill(name);
        await this.parameterValueInput.fill(value);
    }

    private async toggleCrawlWebsite(): Promise<void> {
        await this.crawlWebsiteToggle.click();
    }

    private async fillCrawlMaxDepth(value: string): Promise<void> {
        await this.crawlMaxDepthInput.clear();
        await this.crawlMaxDepthInput.fill(value);
    }

    private async clickCreateSource(): Promise<void> {
        await this.ksSubmitButton.click();
    }

    private async clickFinalCreateKB(): Promise<void> {
        await this.waitAndClick(this.finalCreateKBButton);
    }

    private async searchForKB(name: string): Promise<void> {
        await this.searchInput.fill(name);
    }

    private async verifyKBStatusReady(name: string): Promise<void> {
        const row = this.getKBRow(name);
        await row.hover();
        await expect(row).toContainText(selectors.readyStatus, {
            timeout: timeouts.long,
        });
    }

    private async hoverAndClickDelete(name: string): Promise<void> {
        const row = this.getKBRow(name);
        await row.hover();
        await row.locator(`span[aria-label="${selectors.deleteAriaLabel}"]`).click();
    }

    private async confirmDeleteKB(): Promise<void> {
        await this.deleteConfirmInput.fill(selectors.confirmDeleteText);
        await this.waitAndClick(this.confirmButton);
    }

    // =====================
    // Private composites
    // =====================

    private async startKBCreation(kbName: string): Promise<void> {
        await this.navigateToGeneralSettings();
        await this.expandAIKnowledgeBase();
        await this.clickCreateKnowledgeBase();
        await this.fillKBName(kbName);
        await this.clickCreateKnowledgeSource();
    }

    private async finalizeKBCreation(): Promise<void> {
        await this.clickCreateSource();
        await this.verifyToast(messages.knowledgeSourceCreated);
        await this.dismissToast(messages.knowledgeSourceCreated);
        await this.clickFinalCreateKB();
        await this.verifyKBCreationToast();
    }

    private async verifyKBCreationToast(): Promise<void> {
        const successToast = this.page.getByText(messages.knowledgeBaseCreated);
        const warningToast = this.page.getByText(messages.knowledgeBaseInProgress);

        await expect(successToast.or(warningToast)).toBeVisible({
            timeout: timeouts.standard,
        });

        if (await successToast.isVisible()) {
            await this.dismissToast(messages.knowledgeBaseCreated);
        } else {
            await this.dismissToast(messages.knowledgeBaseInProgress);
        }
    }

    private async createKB(
        kbName: string,
        sourceLabel: string,
        configureSource: () => Promise<void>,
    ): Promise<void> {
        await test.step('Navigate and open KB creation form', async () => {
            await this.startKBCreation(kbName);
        });

        await test.step(`Configure ${sourceLabel} Knowledge Source`, async () => {
            await configureSource();
        });

        await test.step('Submit Knowledge Source and finalize Knowledge Base', async () => {
            await this.finalizeKBCreation();
        });
    }

    private async navigateAndSearchKB(kbName: string): Promise<void> {
        await test.step('Navigate to Knowledge Bases list', async () => {
            await this.navigateToKnowledgeBases();
        });

        await test.step(`Search for "${kbName}"`, async () => {
            await this.searchForKB(kbName);
        });
    }

    // =====================
    // Public: Create flows
    // =====================

    async createKBWithTextSource(kbName: string, ksName: string): Promise<void> {
        await this.createKB(kbName, 'Text', async () => {
            await this.selectSourceType(sourceTypeIndex.text);
            await this.fillKSName(ksName);
            await this.fillPlainText(testData.textContent);
        });
    }

    async createKBWithFileSource(kbName: string): Promise<void> {
        await this.createKB(kbName, 'File', async () => {
            await this.selectSourceType(sourceTypeIndex.file);
            await this.uploadFile(path.resolve(testData.uploadFilePath));
        });
    }

    async createKBWithApiSource(kbName: string, ksName: string): Promise<void> {
        await this.createKB(kbName, 'API', async () => {
            await this.selectSourceType(sourceTypeIndex.api);
            await this.fillKSName(ksName);
            await this.fillUrl(testData.apiUrl);
            await this.addHeaderParameter(testData.apiHeaderName, testData.apiHeaderValue);
        });
    }

    async createKBWithWebsiteSource(kbName: string, ksName: string): Promise<void> {
        await this.createKB(kbName, 'Website', async () => {
            await this.selectSourceType(sourceTypeIndex.website);
            await this.fillKSName(ksName);
            await this.fillUrl(testData.websiteUrl);
            await this.toggleCrawlWebsite();
            await this.crawlMaxDepthInput.waitFor({ state: 'visible', timeout: timeouts.short });
            await this.fillCrawlMaxDepth(testData.crawlMaxDepth);
        });
    }

    // =====================
    // Public: Verify & Delete
    // =====================

    async verifyKBVisibleInList(kbName: string): Promise<void> {
        await this.navigateAndSearchKB(kbName);

        await test.step('Verify KB row is visible in the list', async () => {
            await expect(this.getKBRow(kbName)).toBeVisible({ timeout: timeouts.standard });
        });
    }

    async verifyKBStatus(kbName: string): Promise<void> {
        await this.navigateAndSearchKB(kbName);

        await test.step('Verify status is Ready (Up-to-Date)', async () => {
            await this.verifyKBStatusReady(kbName);
        });
    }

    async verifyKBNotInList(kbName: string): Promise<void> {
        await this.navigateAndSearchKB(kbName);

        await test.step('Verify KB row is no longer in the list', async () => {
            await expect(this.getKBRow(kbName)).toBeHidden({ timeout: timeouts.standard });
        });
    }

    async deleteKB(kbName: string): Promise<void> {
        await this.navigateAndSearchKB(kbName);

        await test.step('Hover on row and click Delete', async () => {
            await this.hoverAndClickDelete(kbName);
        });

        await test.step('Confirm deletion', async () => {
            await this.confirmDeleteKB();
        });

        await test.step('Verify Knowledge Base deleted toast', async () => {
            await this.verifyToast(messages.knowledgeBaseDeleted);
        });
    }
}
