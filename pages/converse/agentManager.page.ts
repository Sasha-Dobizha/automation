import { expect, test, type Page, type Locator } from '@playwright/test';
import { AGENT_MANAGER_CONFIG } from '../../data/converse/agentManager.data';
import { COMMON_TIMEOUTS } from '../../data/common.data';

const { urls, selectors, messages, breadcrumbs, testData } = AGENT_MANAGER_CONFIG;

export class AgentManagerPage {
    // --- Create Agent ---
    readonly newAgentButton: Locator;
    readonly agentNameInput: Locator;
    readonly tagsInput: Locator;
    readonly confirmButton: Locator;
    readonly breadcrumb: Locator;

    // --- Search & Edit ---
    readonly searchInput: Locator;
    readonly editAgentLink: Locator;

    // --- Agent Editor ---
    readonly greetingTextarea: Locator;
    readonly objectiveNameInput: Locator;
    readonly addActionButton: Locator;
    readonly actionTypeDropdown: Locator;
    readonly actionTypeOptions: Locator;
    readonly actionNameTextarea: Locator;
    readonly deployButton: Locator;

    // --- Service Ticket fields ---
    readonly ticketNameInput: Locator;
    readonly ticketTypeCombobox: Locator;

    // --- Invoke API fields ---
    readonly requestMethodCombobox: Locator;
    readonly requestUrlTextarea: Locator;
    readonly addParameterButton: Locator;
    readonly parameterNameInput: Locator;
    readonly parameterValueInput: Locator;

    // --- Knowledge Base fields ---
    readonly knowledgeBaseCombobox: Locator;

    // --- Execute Process fields ---
    readonly processCombobox: Locator;

    // --- Transfer to Agent fields ---
    readonly targetAgentCombobox: Locator;

    private readonly page: Page;

    constructor(page: Page) {
        this.page = page;
        // Create Agent
        this.newAgentButton = page.getByRole('button', {
            name: selectors.newAgentButton,
        });
        this.agentNameInput = page.locator(
            `input[name="${selectors.agentNameInput}"]`,
        );
        this.tagsInput = page
            .locator('div[class*="-control"]')
            .filter({
                has: page
                    .locator('[id*="placeholder"]')
                    .filter({ hasText: 'Create...' }),
            })
            .locator('input[role="combobox"]');
        this.confirmButton = page.locator('#useHiddenButtonToTriggerFormApi');
        this.breadcrumb = page.locator('nav[aria-label="breadcrumb"]');

        // Search & Edit
        this.searchInput = page.getByPlaceholder(selectors.searchPlaceholder, {
            exact: true,
        });
        this.editAgentLink = page.getByText(selectors.editAgentText, {
            exact: true,
        });

        // Agent Editor
        this.greetingTextarea = page
            .locator('#greeting')
            .locator(`textarea[placeholder="${selectors.greetingPlaceholder}"]`)
            .first();
        this.objectiveNameInput = page.locator('span').filter({
            hasText: selectors.objectiveNamePlaceholder,
        });
        this.addActionButton = page.getByRole('button', {
            name: selectors.addActionButton,
        });
        this.actionTypeDropdown = page
            .locator('div[class*="-control"]')
            .filter({
                has: page
                    .locator('[id*="placeholder"]')
                    .filter({ hasText: 'Select Type' }),
            })
            .first();
        this.actionTypeOptions = page.locator('[role="option"]');
        this.actionNameTextarea = page.locator(
            `textarea[placeholder="${selectors.actionNamePlaceholder}"]`,
        );
        this.deployButton = page.getByRole('button', {
            name: selectors.deployButton,
            exact: true,
        });

        // Service Ticket
        this.ticketNameInput = page.locator(
            `textarea[name="${selectors.issueNameInput}"]`,
        );
        this.ticketTypeCombobox = this.comboboxByPlaceholder(
            page,
            'Select issue type',
        );

        // Invoke API
        this.requestMethodCombobox = this.comboboxByPlaceholder(
            page,
            'Select Request Method',
        );
        this.requestUrlTextarea = page.locator(
            `textarea[placeholder="${selectors.requestUrlPlaceholder}"]`,
        );
        this.addParameterButton = page
            .locator('div')
            .filter({ hasText: /^Header Parameters/ })
            .locator('..')
            .getByRole('button', { name: selectors.addParameterButton });
        this.parameterNameInput = page.locator(
            `textarea[placeholder="${selectors.parameterNamePlaceholder}"]`,
        );
        this.parameterValueInput = page.locator(
            `textarea[placeholder="${selectors.parameterValuePlaceholder}"]`,
        );

        // Knowledge Base
        this.knowledgeBaseCombobox = page
            .locator('label')
            .filter({ hasText: 'Knowledge Base' })
            .locator('..')
            .locator('..')
            .locator('input[role="combobox"]')
            .first();

        // Execute Process
        this.processCombobox = this.comboboxByPlaceholder(
            page,
            'Select Process',
        );

        // Transfer to Agent
        this.targetAgentCombobox = this.comboboxByPlaceholder(
            page,
            'Select Agent',
        );
    }

    // =====================
    // Private helpers
    // =====================

    private comboboxByPlaceholder(page: Page, placeholder: string): Locator {
        return page
            .locator('[id*="placeholder"]')
            .filter({ hasText: placeholder })
            .locator('..')
            .locator('input[role="combobox"]');
    }

    private async waitAndClick(locator: Locator): Promise<void> {
        await locator.waitFor({
            state: 'visible',
            timeout: COMMON_TIMEOUTS.short,
        });
        await locator.click();
    }

    private async waitAndFill(locator: Locator, value: string): Promise<void> {
        await locator.waitFor({
            state: 'visible',
            timeout: COMMON_TIMEOUTS.short,
        });
        await locator.fill(value);
    }

    private async selectComboboxOption(
        input: Locator,
        value: string,
        {
            fill = true,
            pressEnter = false,
            timeout = COMMON_TIMEOUTS.short,
        }: { fill?: boolean; pressEnter?: boolean; timeout?: number } = {},
    ): Promise<void> {
        await input.click();
        if (fill) {
            await input.fill(value);
        }
        const option = this.page.getByRole('option', { name: value, exact: true });
        await option.waitFor({ timeout });
        if (pressEnter) {
            await this.page.keyboard.press('Enter');
            return;
        }
        await option.click();
    }

    // =====================
    // Navigation
    // =====================

    async navigateToAgentManager(): Promise<void> {
        await this.page.goto(urls.agentManager);
        await expect(this.newAgentButton).toBeVisible({
            timeout: COMMON_TIMEOUTS.standard,
        });
    }

    // =====================
    // Create Agent
    // =====================

    async createAgent(agentName: string, tag: string): Promise<void> {
        await test.step('Navigate to Agent Manager page', async () => {
            await this.navigateToAgentManager();
        });

        await test.step('Click "+ New Agent" button', async () => {
            await this.newAgentButton.click();
            await expect(this.agentNameInput).toBeVisible({
                timeout: COMMON_TIMEOUTS.short,
            });
        });

        await test.step('Fill agent name and add tag', async () => {
            await this.agentNameInput.fill(agentName);
            await this.tagsInput.click();
            await this.tagsInput.pressSequentially(tag, { delay: 50 });
            await this.page.keyboard.press('Enter');
        });

        await test.step('Click Confirm button', async () => {
            await this.confirmButton.click();
        });

        await test.step('Verify agent created toast', async () => {
            await expect(
                this.page.getByText(messages.agentCreated(agentName)),
            ).toBeVisible({ timeout: COMMON_TIMEOUTS.standard });
        });

        await test.step('Verify redirected to New Agent editor', async () => {
            await expect(
                this.breadcrumb.getByText(breadcrumbs.newAgent),
            ).toBeVisible({ timeout: COMMON_TIMEOUTS.standard });
        });
    }

    // =====================
    // Search & Edit Agent
    // =====================

    async searchAndOpenEditor(agentName: string): Promise<void> {
        await test.step('Navigate to Agent Manager page', async () => {
            await this.navigateToAgentManager();
        });

        await test.step('Search for the agent', async () => {
            await this.searchInput.fill(agentName);
        });

        await test.step('Hover on agent card and click Edit', async () => {
            const agentNameSpan = this.page
                .locator('span')
                .filter({ hasText: agentName })
                .first();
            await agentNameSpan.hover({ timeout: COMMON_TIMEOUTS.short });
            await this.editAgentLink.waitFor({
                state: 'visible',
                timeout: COMMON_TIMEOUTS.short,
            });
            await this.editAgentLink.click();
        });

        await test.step('Verify agent editor loaded', async () => {
            await expect(
                this.page.getByText(agentName, { exact: true }).first(),
            ).toBeVisible({ timeout: COMMON_TIMEOUTS.standard });
        });
    }

    // =====================
    // Action-specific field methods
    // =====================

    async fillServiceTicketFields(ticketName: string): Promise<void> {
        await test.step('Fill ticket Name', async () => {
            await this.waitAndFill(this.ticketNameInput, ticketName);
        });
        await test.step('Select Ticket Type', async () => {
            await this.selectComboboxOption(
                this.ticketTypeCombobox,
                testData.ticketType,
            );
        });
    }

    async fillInvokeApiFields(): Promise<void> {
        await test.step('Select Request Method', async () => {
            await this.selectComboboxOption(
                this.requestMethodCombobox,
                testData.requestMethod,
                { pressEnter: true },
            );
        });
        await test.step('Fill Request URL', async () => {
            await this.waitAndFill(this.requestUrlTextarea, testData.apiUrl);
        });
        await test.step('Add Header Parameter', async () => {
            await this.waitAndClick(this.addParameterButton);
            await this.waitAndFill(
                this.parameterNameInput,
                testData.apiHeaderName,
            );
            await this.parameterValueInput.fill(testData.apiHeaderValue);
        });
    }

    async fillQueryKnowledgeBaseFields(): Promise<void> {
        await test.step('Select Knowledge Base', async () => {
            await this.selectComboboxOption(
                this.knowledgeBaseCombobox,
                testData.knowledgeBaseName,
                { pressEnter: true, timeout: COMMON_TIMEOUTS.standard },
            );
        });
    }

    async fillExecuteProcessFields(): Promise<void> {
        await test.step('Select Process', async () => {
            await this.selectComboboxOption(
                this.processCombobox,
                testData.processName,
                { timeout: COMMON_TIMEOUTS.standard },
            );
        });
    }

    async fillTransferToAgentFields(): Promise<void> {
        await test.step('Select Target Agent', async () => {
            await this.targetAgentCombobox.click();
            await this.actionTypeOptions.first().waitFor({
                timeout: COMMON_TIMEOUTS.short,
            });
            await this.actionTypeOptions.first().click();
        });
    }

    // =====================
    // Deploy
    // =====================

    async deploy(agentName: string): Promise<void> {
        await test.step('Click Deploy button', async () => {
            await this.waitAndClick(this.deployButton);
        });

        await test.step('Verify agent deployed toast', async () => {
            await expect(
                this.page.getByText(messages.agentDeployed(agentName)),
            ).toBeVisible({ timeout: COMMON_TIMEOUTS.standard });
        });
    }

    // =====================
    // Composite: Configure any action
    // =====================

    async configureAction(
        agentName: string,
        actionTypeIdx: number,
        actionName: string,
        fillActionFields?: () => Promise<void>,
        opts?: { withGreetingAndObjective?: boolean },
    ): Promise<void> {
        await this.searchAndOpenEditor(agentName);

        if (opts?.withGreetingAndObjective) {
            await test.step('Update Greeting Guidance', async () => {
                await this.greetingTextarea.waitFor({
                    state: 'visible',
                    timeout: COMMON_TIMEOUTS.short,
                });
                await this.greetingTextarea.clear();
                await this.greetingTextarea.fill(testData.greeting);
            });
            await test.step('Fill Objective Name', async () => {
                await this.objectiveNameInput.click();
                await this.page.keyboard.type(testData.objectiveName);
            });
        }

        await test.step('Click + Add Action', async () => {
            await this.waitAndClick(this.addActionButton);
        });

        await test.step('Select Action Type', async () => {
            await this.actionTypeDropdown.click();
            await this.actionTypeOptions.first().waitFor({
                timeout: COMMON_TIMEOUTS.short,
            });
            await this.actionTypeOptions.nth(actionTypeIdx).click();
        });

        await test.step('Fill Action Name', async () => {
            await this.waitAndFill(this.actionNameTextarea, actionName);
        });

        if (fillActionFields) {
            await fillActionFields();
        }

        await this.deploy(agentName);
    }

    // =====================
    // Composite: greeting & objective
    // =====================

    async configureGreetingAndObjective(agentName: string): Promise<void> {
        await this.searchAndOpenEditor(agentName);

        await test.step('Update Greeting Guidance', async () => {
            await this.greetingTextarea.waitFor({
                state: 'visible',
                timeout: COMMON_TIMEOUTS.short,
            });
            await this.greetingTextarea.clear();
            await this.greetingTextarea.fill(testData.greeting);
        });

        await test.step('Fill Objective Name', async () => {
            await this.objectiveNameInput.click();
            await this.page.keyboard.type(testData.objectiveName);
        });

        await this.deploy(agentName);
    }

    // =====================
    // Composite: per-action-type wrappers
    // =====================

    async configureServiceTicketAction(
        agentName: string,
        ticketName: string,
    ): Promise<void> {
        await this.configureAction(
            agentName,
            AGENT_MANAGER_CONFIG.actionTypeIndex.serviceTicket,
            testData.serviceTicketActionName,
            () => this.fillServiceTicketFields(ticketName),
        );
    }

    async configureInvokeApiAction(agentName: string): Promise<void> {
        await this.configureAction(
            agentName,
            AGENT_MANAGER_CONFIG.actionTypeIndex.invokeApi,
            testData.invokeApiActionName,
            () => this.fillInvokeApiFields(),
        );
    }

    async configureQueryKnowledgeBaseAction(agentName: string): Promise<void> {
        await this.configureAction(
            agentName,
            AGENT_MANAGER_CONFIG.actionTypeIndex.queryKnowledgeBase,
            testData.queryKBActionName,
            () => this.fillQueryKnowledgeBaseFields(),
        );
    }

    async configureExecuteProcessAction(agentName: string): Promise<void> {
        await this.configureAction(
            agentName,
            AGENT_MANAGER_CONFIG.actionTypeIndex.executeProcess,
            testData.executeProcessActionName,
            () => this.fillExecuteProcessFields(),
        );
    }

    async configureTransferToAgentAction(agentName: string): Promise<void> {
        await this.configureAction(
            agentName,
            AGENT_MANAGER_CONFIG.actionTypeIndex.transferToAgent,
            testData.transferToAgentActionName,
            () => this.fillTransferToAgentFields(),
        );
    }

    async configureTransferToHumanAction(agentName: string): Promise<void> {
        await this.configureAction(
            agentName,
            AGENT_MANAGER_CONFIG.actionTypeIndex.transferToHuman,
            testData.transferToHumanActionName,
        );
    }

    // =====================
    // Prerequisites
    // =====================

    async ensureKnowledgeBaseExists(): Promise<void> {
        await test.step('Check if "Symphona All Docs" KB exists', async () => {
            await this.page.goto(urls.knowledgeBases);
            const searchInput = this.page.getByPlaceholder(
                'Search Knowledge Base Names...',
            );
            await expect(searchInput).toBeVisible({
                timeout: COMMON_TIMEOUTS.standard,
            });
            await searchInput.fill(testData.knowledgeBaseName);

            const kbRow = this.page
                .getByRole('row')
                .filter({ hasText: testData.knowledgeBaseName });
            try {
                await expect(kbRow).toBeVisible({
                    timeout: COMMON_TIMEOUTS.short,
                });
            } catch {
                await test.step('KB not found — creating it', async () => {
                    const { KnowledgeBasePage } = await import(
                        '../../pages/settings/knowledgeBase.page'
                    );
                    const kb = new KnowledgeBasePage(this.page);
                    await kb.createKBWithWebsiteSource(
                        testData.knowledgeBaseName,
                        `KS ${testData.knowledgeBaseName}`,
                    );
                });
            }
        });
    }

    async ensureProcessExists(): Promise<void> {
        await test.step('Check if "Automation Process" exists', async () => {
            const { ProcessManagerPage } = await import(
                '../../pages/flow/processManager.page'
            );
            const pmPage = new ProcessManagerPage(this.page);
            await pmPage.navigateToProcessManager();
            await pmPage.searchForProcess(testData.processName);

            const showingProcesses = this.page.getByText(/Showing .+ of .+ Process/);
            const noResults = this.page.getByText('No Processes Found', {
                exact: true,
            });

            await showingProcesses
                .or(noResults)
                .waitFor({ state: 'visible', timeout: COMMON_TIMEOUTS.standard });

            const isAbsent = await noResults.isVisible();

            if (isAbsent) {
                await test.step(
                    'Process not found — creating and deploying it',
                    async () => {
                        await pmPage.createProcess({
                            name: testData.processName,
                            description: 'Automation process for agent tests',
                            tag: 'automation',
                            ticketName: 'Automation Ticket',
                        });
                        await pmPage.openAndDeploy(testData.processName);
                    },
                );
            }
        });
    }
}
