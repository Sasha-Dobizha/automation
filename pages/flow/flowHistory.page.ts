import { expect, type Page, type Locator } from '@playwright/test';
import { COMMON_TIMEOUTS, COMMON_URLS, GLDS_CONFIG } from '../../data/common.data';
import { PROCESS_MANAGER_CONFIG } from '../../data/flow/processManager.data';

export interface ProcessFailureDetails {
    step: string;
    error: string;
}

export const TERMINAL_PROCESS_STATUSES = ['success', 'failed'] as const;

export class FlowHistoryPage {
    private readonly page: Page;

    readonly searchInput: Locator;
    readonly refreshButton: Locator;
    readonly firstRow: Locator;
    readonly firstRowStatusCell: Locator;
    readonly executionLogsAccordion: Locator;
    readonly executionLogsText: Locator;
    readonly firstFailedStep: Locator;
    readonly failedStepAccordions: Locator;
    readonly leafFailedStepAccordion: Locator;
    readonly leafFailedStepSummary: Locator;
    readonly leafFailedStepName: Locator;
    readonly leafFailedStepErrorEditor: Locator;
    readonly workOrderIdValue: Locator;
    readonly statusValue: Locator;

    constructor(page: Page) {
        this.page = page;

        this.searchInput = page.locator(
            `input[placeholder="${PROCESS_MANAGER_CONFIG.selectors.processHistorySearchPlaceholder}"]`,
        );
        this.refreshButton = page.locator('[aria-label="Refresh Table Data"] button');
        this.firstRow = page.locator('tbody tr').first();
        // Table columns (0-based): processName(0), status(1), currentTask(2),
        // inputParameters(3), environment(4), startTime(5), endTime(6), duration(7)
        this.firstRowStatusCell = this.firstRow.locator('td').nth(1);

        this.executionLogsText = page.getByText('Execution Logs', { exact: true });
        this.executionLogsAccordion = page
            .locator('[role="button"]')
            .filter({ hasText: 'Execution Logs' })
            .first();

        this.firstFailedStep = page.getByText('Step Failed', { exact: true }).first();
        this.failedStepAccordions = page
            .locator('.MuiAccordion-root')
            .filter({ has: page.getByText('Step Failed', { exact: true }) });
        // The leaf failed-step accordion is the deepest one (innermost nested Step Failed).
        this.leafFailedStepAccordion = this.failedStepAccordions.last();
        this.leafFailedStepSummary = this.leafFailedStepAccordion
            .locator('.MuiAccordionSummary-root')
            .first();
        this.leafFailedStepName = this.leafFailedStepAccordion
            .locator('.MuiAccordionSummary-content span')
            .nth(1);
        this.leafFailedStepErrorEditor = this.leafFailedStepAccordion
            .locator('[data-lexical-editor="true"]')
            .first();

        this.workOrderIdValue = this.buildParameterValueLocator('workOrderID');
        this.statusValue = this.buildParameterValueLocator('Status');
    }

    private buildParameterValueLocator(label: string): Locator {
        return this.page.locator(
            `xpath=//span[normalize-space(text())="${label}"]/ancestor::div[contains(@class, "ept2sxe2")][1]//div[contains(@class, "ept2sxe0")]`,
        );
    }

    async navigateToHistory(): Promise<void> {
        await this.page.goto(`${COMMON_URLS.baseUrl}${PROCESS_MANAGER_CONFIG.urls.processHistory}`);
        await expect(this.searchInput).toBeVisible({ timeout: COMMON_TIMEOUTS.standard });
    }

    async searchForProcess(processId: string): Promise<void> {
        const cleanId = processId.replace(/^#/, '').trim();
        await this.searchInput.fill(cleanId);
        await expect(this.firstRow).toBeVisible({ timeout: COMMON_TIMEOUTS.standard });
    }

    async getDuration(fulfilmentProcessId: string): Promise<string> {
        try {
            const responsePromise = this.page.waitForResponse(
                (res) =>
                    res.url().includes(`/fulfillment/process/${fulfilmentProcessId}`) &&
                    res.url().includes('skipLogs=false') &&
                    res.status() === 200,
                { timeout: COMMON_TIMEOUTS.standard },
            );
            await this.page.reload({ waitUntil: 'domcontentloaded' });
            const response = await responsePromise;
            const body = await response.json();
            return String(body.duration ?? 'N/A');
        } catch {
            return 'N/A';
        }
    }

    async cancelGldsWorkOrder(workOrderId: string): Promise<boolean> {
        if (!workOrderId || workOrderId === 'Not Created') {
            return false;
        }

        const credentials = Buffer.from(`${GLDS_CONFIG.username}:${GLDS_CONFIG.password}`).toString('base64');
        const url = `${GLDS_CONFIG.baseUrl}/work-order/${workOrderId}/cancel?reason=DCN`;

        try {
            const response = await this.page.request.get(url, {
                headers: { 'Authorization': `Basic ${credentials}` },
                ignoreHTTPSErrors: true,
            });
            return response.ok();
        } catch {
            return false;
        }
    }

    async cancelAmsPortWorkOrder(amsPortId: string): Promise<boolean> {
        if (!amsPortId || amsPortId === 'Not Created') {
            return false;
        }

        const url = `https://216.19.176.8:8443/sms/api/portReservation/${encodeURIComponent(amsPortId)}`;

        try {
            const response = await this.page.request.delete(url, {
                ignoreHTTPSErrors: true,
            });
            return response.ok();
        } catch {
            return false;
        }
    }

    async getFirstRowStatus(): Promise<string> {
        await expect(this.firstRowStatusCell).toBeVisible({ timeout: COMMON_TIMEOUTS.standard });
        return ((await this.firstRowStatusCell.textContent()) ?? '').trim();
    }

    /**
     * Polls the process history table by clicking the refresh button until the first
     * row reaches a terminal status (Success or Failed). Returns the final status.
     * Throws if the process does not terminate within the configured timeout.
     */
    async waitForTerminalStatus(
        options: { timeoutMs?: number; pollIntervalMs?: number } = {},
    ): Promise<string> {
        const timeoutMs = options.timeoutMs ?? COMMON_TIMEOUTS.long;
        const pollIntervalMs = options.pollIntervalMs ?? 5000;
        const deadline = timeoutMs === 0 ? Infinity : Date.now() + timeoutMs;

        let status = await this.getFirstRowStatus();
        while (!TERMINAL_PROCESS_STATUSES.includes(status.toLowerCase() as (typeof TERMINAL_PROCESS_STATUSES)[number])) {
            if (Date.now() >= deadline) {
                throw new Error(
                    `Fulfilment Sequence Process did not reach a terminal status (Success/Failed) within ${timeoutMs}ms. Last observed status: "${status}".`,
                );
            }

            await this.page.waitForTimeout(pollIntervalMs);
            await this.refreshButton.click();
            await expect(this.firstRow).toBeVisible({ timeout: COMMON_TIMEOUTS.standard });
            status = await this.getFirstRowStatus();
        }

        return status;
    }

    async openFirstProcess(): Promise<void> {
        await this.firstRow.locator('td').first().click();
        await expect(this.executionLogsText).toBeVisible({ timeout: COMMON_TIMEOUTS.standard });
    }

    async getWorkOrderId(): Promise<string> {
        // Work Order ID is only created on successful fulfilment; treat its
        // absence as a non-fatal condition so downstream reporting can proceed.
        try {
            await this.workOrderIdValue.first().waitFor({
                state: 'visible',
                timeout: COMMON_TIMEOUTS.short,
            });
        } catch {
            return 'Not Created';
        }

        await this.workOrderIdValue.scrollIntoViewIfNeeded();
        const value = ((await this.workOrderIdValue.textContent()) ?? '').trim();
        return value.length > 0 ? value : 'Not Created';
    }

    async getStatus(): Promise<string> {
        await this.statusValue.scrollIntoViewIfNeeded();
        await expect(this.statusValue).toBeVisible({ timeout: COMMON_TIMEOUTS.standard });
        return ((await this.statusValue.textContent()) ?? '').trim();
    }

    async expandExecutionLogs(): Promise<void> {
        await this.executionLogsAccordion.scrollIntoViewIfNeeded();
        const expanded = await this.executionLogsAccordion.getAttribute('aria-expanded');
        if (expanded !== 'true') {
            await this.executionLogsAccordion.click();
        }
    }

    async getFailedStepDetails(): Promise<ProcessFailureDetails> {
        await expect(this.firstFailedStep).toBeVisible({ timeout: COMMON_TIMEOUTS.standard });
        await this.firstFailedStep.scrollIntoViewIfNeeded();

        // Nested Step Failed accordions (e.g. parent "GLDS Error Flow" wrapping
        // child "Step 4: Order Fulfilment") must all be expanded so the leaf
        // accordion's error body is reachable.
        await this.expandAllFailedStepAccordions();

        await this.leafFailedStepSummary.scrollIntoViewIfNeeded();
        const step = ((await this.leafFailedStepName.textContent()) ?? '').trim();

        await expect(this.leafFailedStepErrorEditor).toBeVisible({
            timeout: COMMON_TIMEOUTS.standard,
        });
        const error = ((await this.leafFailedStepErrorEditor.innerText()) ?? '').trim();

        return { step, error };
    }

    private async expandAllFailedStepAccordions(): Promise<void> {
        const count = await this.failedStepAccordions.count();

        for (let i = 0; i < count; i++) {
            const accordion = this.failedStepAccordions.nth(i);
            const summary = accordion.locator('.MuiAccordionSummary-root').first();
            const expandIcon = accordion
                .locator('.MuiAccordionSummary-expandIconWrapper')
                .first();

            await this.expandAccordion(summary, expandIcon);
        }
    }

    private async expandAccordion(summary: Locator, expandIcon: Locator): Promise<void> {
        const maxAttempts = 3;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const expanded = await summary.getAttribute('aria-expanded').catch(() => null);
            if (expanded === 'true') {
                return;
            }

            await expandIcon.scrollIntoViewIfNeeded().catch(() => undefined);
            await expandIcon.click({ force: true }).catch(async () => {
                await summary.click({ force: true });
            });

            try {
                await expect(summary).toHaveAttribute('aria-expanded', 'true', {
                    timeout: COMMON_TIMEOUTS.short,
                });
                return;
            } catch {
                // Accordion didn't expand yet; retry on the next iteration.
            }
        }
    }
}
