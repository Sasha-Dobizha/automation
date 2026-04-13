import { expect, test, type Page, type Locator } from '@playwright/test';
import { AGENT_TESTER_CONFIG } from '../../data/converse/agentTester.data';
import { COMMON_TIMEOUTS } from '../../data/common.data';

const { urls, messages, timeouts } = AGENT_TESTER_CONFIG;

export class AgentTesterPage {
    private readonly page: Page;

    // --- Agent Tester Controls ---
    readonly agentDropdownInput: Locator;
    readonly widgetDropdownInput: Locator;
    readonly applyButton: Locator;

    // --- Chat Widget ---
    readonly chatInput: Locator;

    // --- Live Chat ---
    readonly requestsTab: Locator;
    readonly acceptRequestButton: Locator;

    constructor(page: Page) {
        this.page = page;

        this.agentDropdownInput = this.comboboxByLabel('Agent');
        this.widgetDropdownInput = this.comboboxByLabel('Widget');

        this.applyButton = page.getByRole('button', {
            name: 'Apply',
            exact: true,
        });

        this.chatInput = page
            .locator('textarea[placeholder="Enter your message..."]')
            .first();

        this.requestsTab = page.getByRole('tab', { name: 'Requests' });
        this.acceptRequestButton = page
            .locator('#app-layout-flex')
            .getByRole('button', { name: 'Accept Request' });
    }

    // =====================
    // Private helpers
    // =====================

    private comboboxByLabel(label: string): Locator {
        return this.page
            .locator('label')
            .filter({ hasText: new RegExp(`^${label}$`) })
            .locator('..')
            .locator('input[role="combobox"]');
    }

    private async waitAndClick(locator: Locator): Promise<void> {
        await locator.waitFor({
            state: 'visible',
            timeout: COMMON_TIMEOUTS.standard,
        });
        await locator.click();
    }

    // =====================
    // Navigation
    // =====================

    async navigateToAgentTester(): Promise<void> {
        await this.page.goto(urls.agentTester);
        await expect(this.applyButton).toBeVisible({
            timeout: COMMON_TIMEOUTS.standard,
        });
    }

    async navigateToLiveChat(): Promise<void> {
        await this.page.goto(urls.liveChat);
        await expect(this.requestsTab).toBeVisible({
            timeout: COMMON_TIMEOUTS.standard,
        });
    }

    // =====================
    // Agent Tester Setup
    // =====================

    async selectAgent(agentName: string): Promise<void> {
        await this.agentDropdownInput.click();
        await this.agentDropdownInput.fill(agentName);
        const option = this.page
            .getByRole('option', { name: agentName })
            .first();
        await option.waitFor({ timeout: COMMON_TIMEOUTS.standard });
        await option.click();
    }

    async selectFirstWidget(): Promise<void> {
        await this.widgetDropdownInput.click();
        const firstOption = this.page.locator('[role="option"]').first();
        await firstOption.waitFor({ timeout: COMMON_TIMEOUTS.short });
        await firstOption.click();
    }

    // =====================
    // Chat Interaction
    // =====================

    async sendMessage(message: string): Promise<void> {
        await this.chatInput.fill(message, {
            timeout: COMMON_TIMEOUTS.standard,
        });
        await this.page.keyboard.press('Enter');
    }

    async waitForChatResponse(
        expectedText: string | RegExp,
        timeout: number = timeouts.chatResponse,
    ): Promise<void> {
        await expect(
            this.page.getByText(expectedText).last(),
        ).toBeVisible({ timeout });
    }

    // =====================
    // Composite: Initiate Chat Session
    // =====================

    async initiateChat(agentName: string): Promise<void> {
        await test.step('Navigate to Agent Tester', async () => {
            await this.navigateToAgentTester();
        });

        await test.step('Select agent from dropdown', async () => {
            await this.selectAgent(agentName);
        });

        await test.step('Select widget from dropdown', async () => {
            await this.selectFirstWidget();
        });

        await test.step('Click Apply', async () => {
            await this.applyButton.click();
        });

        await test.step('Verify greeting message appears', async () => {
            await this.waitForChatResponse(messages.greeting);
        });
    }

    // =====================
    // Live Chat Actions
    // =====================

    async clickRequestsTab(): Promise<void> {
        await this.waitAndClick(this.requestsTab);
    }

    async clickFirstRequest(): Promise<void> {
        const firstRequest = this.page
            .getByText(/Unknown User/)
            .first();
        await expect(firstRequest).toBeVisible({
            timeout: COMMON_TIMEOUTS.standard,
        });
        await firstRequest.click();
    }

    async acceptRequest(): Promise<void> {
        await this.waitAndClick(this.acceptRequestButton);
    }

    async verifyLiveAgentConnected(): Promise<void> {
        await expect(
            this.page.getByText(messages.liveAgentConnected),
        ).toBeVisible({ timeout: COMMON_TIMEOUTS.standard });
    }
}
