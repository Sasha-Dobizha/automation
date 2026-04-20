import type {
    Reporter,
    TestCase,
    TestResult,
    FullResult,
} from '@playwright/test/reporter';
import * as fs from 'fs';
import * as path from 'path';

type TimingCategory = 'page-load' | 'dialog-close' | 'element-visible';

interface TimingEntry {
    action: string;
    category: TimingCategory;
    durationMs: number;
    timestamp: number;
}

interface TestTimingData {
    testTitle: string;
    testFile: string;
    status: string;
    totalDuration: number;
    entries: TimingEntry[];
}

interface ActionStats {
    action: string;
    category: TimingCategory;
    count: number;
    avg: number;
    min: number;
    max: number;
    p50: number;
    p95: number;
}

interface ExecutionAnnotation {
    type: string;
    description: string;
}

interface ExecutionRecord {
    index: number;
    address: string;
    statuses: Set<string>;
    annotations: Map<string, string>;
}

const ATTACHMENT_NAME = 'perf-timings';

const ADDRESS_TITLE_REGEX = /^\[(\d+)\].*?\baddress:\s*(.+?)\s*$/i;

const SYMPHONA_BASE_URL =
    (process.env.BASE_URL || 'https://onprem.app.symphona.ai').replace(/\/+$/, '');

const SERVICE_TICKET_URL = (id: string) =>
    `${SYMPHONA_BASE_URL}/serve/tickets?isAscending=false&sortOrder=createdAt&pageNumber=0&pageSize=25&selectedItem=%22${encodeURIComponent(
        id,
    )}%22`;

const FULFILMENT_PROCESS_URL = (id: string) =>
    `${SYMPHONA_BASE_URL}/flow/history?isAscending=false&sortOrder=startTime&pageNumber=0&pageSize=25&selectedItem=%22${encodeURIComponent(
        id,
    )}%22`;

const EXECUTION_FIELDS: Array<{
    key: string;
    label: string;
    link?: (id: string) => string;
    mono?: boolean;
    multiline?: boolean;
    appendItems?: Array<{ key: string; label: string }>;
}> = [
    { key: 'Confirmation Number', label: 'Confirmation Number', mono: true },
    {
        key: 'Service Ticket ID',
        label: 'Service Ticket ID',
        link: SERVICE_TICKET_URL,
        mono: true,
    },
    {
        key: 'Fulfilment Sequence Process ID',
        label: 'Fulfilment Sequence Process ID',
        link: FULFILMENT_PROCESS_URL,
        mono: true,
    },
    {
        key: 'Work Order ID',
        label: 'Work Order ID',
        mono: true,
        appendItems: [
            { key: 'GLDS Order Cancelled', label: 'GLDS Cancelled' },
            { key: 'AMS Port Cancelled', label: 'AMS Port Cancelled' },
        ],
    },
    { key: 'Phone Number', label: 'Phone Number', mono: true },
    { key: 'Process Duration', label: 'Process Duration (sec)' },
    { key: 'Process Status', label: 'Process Status' },
    { key: 'Failed Step', label: 'Failed Step' },
    { key: 'Process Error', label: 'Process Error', multiline: true },
];

const CATEGORY_META: Record<
    TimingCategory,
    { label: string; icon: string; description: string }
> = {
    'page-load': {
        label: 'Page Loads',
        icon: '&#x1F4C4;',
        description:
            'Full page navigations and major view transitions — measures time from navigation start until key content is visible.',
    },
    'dialog-close': {
        label: 'Dialog Dismissals',
        icon: '&#x1F4AC;',
        description:
            'Time from clicking an action button until the associated dialog / modal disappears from view.',
    },
    'element-visible': {
        label: 'Element Visibility',
        icon: '&#x1F441;',
        description:
            'Time spent waiting for individual UI elements (buttons, inputs, toasts, etc.) to become visible and interactive.',
    },
};

const CATEGORY_ORDER: TimingCategory[] = [
    'page-load',
    'dialog-close',
    'element-visible',
];

class PerformanceReporter implements Reporter {
    private testTimings: TestTimingData[] = [];
    private executionByIndex: Map<number, ExecutionRecord> = new Map();
    private outputDir: string;

    constructor(options: { outputDir?: string } = {}) {
        this.outputDir = options.outputDir || 'performance-report';
    }

    onTestEnd(test: TestCase, result: TestResult) {
        for (const attachment of result.attachments) {
            if (attachment.name === ATTACHMENT_NAME && attachment.body) {
                const entries: TimingEntry[] = JSON.parse(
                    attachment.body.toString(),
                );
                this.testTimings.push({
                    testTitle: test.title,
                    testFile: path.relative(process.cwd(), test.location.file),
                    status: result.status || 'unknown',
                    totalDuration: result.duration,
                    entries,
                });
            }
        }

        this.collectExecutionData(test, result);
    }

    private collectExecutionData(test: TestCase, result: TestResult) {
        const match = test.title.match(ADDRESS_TITLE_REGEX);
        if (!match) return;

        const index = parseInt(match[1], 10);
        const address = match[2].trim();

        const annotations: ExecutionAnnotation[] = [
            ...(test.annotations as ExecutionAnnotation[] | undefined ?? []),
            ...((result as unknown as { annotations?: ExecutionAnnotation[] })
                .annotations ?? []),
        ];

        let record = this.executionByIndex.get(index);
        if (!record) {
            record = {
                index,
                address,
                statuses: new Set<string>(),
                annotations: new Map<string, string>(),
            };
            this.executionByIndex.set(index, record);
        }

        if (result.status) {
            record.statuses.add(result.status);
        }

        for (const annotation of annotations) {
            if (!annotation || !annotation.type) continue;
            const description = (annotation.description ?? '').trim();
            if (!description) continue;
            record.annotations.set(annotation.type, description);
        }
    }

    async onEnd(_result: FullResult) {
        if (this.testTimings.length === 0 && this.executionByIndex.size === 0) {
            console.log(
                '\n  Performance Reporter: no timing data collected (add PerformanceTracker to page objects).',
            );
            return;
        }

        const stats = this.computeStats();
        const executions = this.getSortedExecutions();

        fs.mkdirSync(this.outputDir, { recursive: true });

        fs.writeFileSync(
            path.join(this.outputDir, 'timings.json'),
            JSON.stringify(
                {
                    generated: new Date().toISOString(),
                    tests: this.testTimings,
                    stats,
                    executions: executions.map((e) => ({
                        index: e.index,
                        address: e.address,
                        statuses: [...e.statuses],
                        annotations: Object.fromEntries(e.annotations),
                    })),
                },
                null,
                2,
            ),
        );

        fs.writeFileSync(
            path.join(this.outputDir, 'index.html'),
            this.generateHtml(stats, executions),
        );

        console.log(
            `\n  Performance report generated -> ${path.resolve(this.outputDir, 'index.html')}`,
        );
    }

    private getSortedExecutions(): ExecutionRecord[] {
        return [...this.executionByIndex.values()].sort(
            (a, b) => a.index - b.index,
        );
    }

    /* ------------------------------------------------------------------ */
    /*  Statistics                                                         */
    /* ------------------------------------------------------------------ */

    private computeStats(): ActionStats[] {
        const actionMap = new Map<string, { durations: number[]; category: TimingCategory }>();

        for (const test of this.testTimings) {
            for (const entry of test.entries) {
                const key = entry.action;
                if (!actionMap.has(key)) {
                    actionMap.set(key, {
                        durations: [],
                        category: entry.category ?? 'element-visible',
                    });
                }
                actionMap.get(key)!.durations.push(entry.durationMs);
            }
        }

        const stats: ActionStats[] = [];
        for (const [action, { durations, category }] of actionMap) {
            const sorted = [...durations].sort((a, b) => a - b);
            stats.push({
                action,
                category,
                count: durations.length,
                avg: Math.round(
                    durations.reduce((a, b) => a + b, 0) / durations.length,
                ),
                min: sorted[0],
                max: sorted[sorted.length - 1],
                p50: sorted[Math.floor(sorted.length * 0.5)],
                p95: sorted[Math.floor(sorted.length * 0.95)],
            });
        }

        return stats.sort((a, b) => b.avg - a.avg);
    }

    /* ------------------------------------------------------------------ */
    /*  HTML Generation                                                    */
    /* ------------------------------------------------------------------ */

    private generateHtml(stats: ActionStats[], executions: ExecutionRecord[]): string {
        const totalActions = this.testTimings.reduce(
            (sum, t) => sum + t.entries.length,
            0,
        );

        const countByCategory = (cat: TimingCategory) =>
            stats
                .filter((s) => s.category === cat)
                .reduce((sum, s) => sum + s.count, 0);

        const categorySectionsHtml = CATEGORY_ORDER.map((cat) =>
            this.renderCategorySection(
                cat,
                stats.filter((s) => s.category === cat),
            ),
        ).join('');

        const testsHtml = this.testTimings
            .map((t) => this.renderTestSection(t))
            .join('');

        const executionTabHtml = this.renderExecutionTab(executions);
        const hasExecutions = executions.length > 0;
        const hasTimings = this.testTimings.length > 0;

        return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Performance Report</title>
<style>
  :root {
    --bg: #f8f9fa; --surface: #fff; --border: #dee2e6;
    --text: #212529; --text-muted: #6c757d;
    --green: #28a745; --yellow: #ffc107; --orange: #fd7e14; --red: #dc3545;
    --green-bg: #d4edda; --yellow-bg: #fff3cd; --orange-bg: #ffe8cc; --red-bg: #f8d7da;
    --blue: #0d6efd; --blue-bg: #cfe2ff;
    --purple: #6f42c1; --purple-bg: #e2d9f3;
    --teal: #20c997; --teal-bg: #d2f4ea;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: var(--bg); color: var(--text); line-height: 1.5; padding: 2rem; }
  h1 { font-size: 1.75rem; margin-bottom: .25rem; }
  .subtitle { color: var(--text-muted); margin-bottom: 2rem; font-size: .9rem; }

  /* Summary cards */
  .summary-cards { display: flex; gap: 1rem; margin-bottom: 2rem; flex-wrap: wrap; }
  .card { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 1.25rem 1.5rem; min-width: 150px; flex: 1; }
  .card .label { font-size: .8rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: .05em; }
  .card .value { font-size: 1.5rem; font-weight: 700; margin-top: .25rem; }
  .card-accent-blue { border-left: 4px solid var(--blue); }
  .card-accent-purple { border-left: 4px solid var(--purple); }
  .card-accent-teal { border-left: 4px solid var(--teal); }

  /* Section headers */
  .section-header { display: flex; align-items: center; gap: .75rem; margin: 2.5rem 0 .5rem; padding-bottom: .5rem; border-bottom: 2px solid var(--border); }
  .section-header h2 { font-size: 1.3rem; margin: 0; }
  .section-icon { font-size: 1.4rem; }
  .section-desc { color: var(--text-muted); font-size: .85rem; margin-bottom: 1rem; }

  /* Tables */
  table { width: 100%; border-collapse: collapse; background: var(--surface); border: 1px solid var(--border); border-radius: 8px; overflow: hidden; margin-bottom: 2rem; }
  th { background: #f1f3f5; text-align: left; padding: .75rem 1rem; font-size: .8rem; text-transform: uppercase; letter-spacing: .05em; color: var(--text-muted); border-bottom: 2px solid var(--border); white-space: nowrap; }
  td { padding: .6rem 1rem; border-bottom: 1px solid #eee; font-size: .9rem; }
  tr:last-child td { border-bottom: none; }
  .mono { font-family: 'SF Mono', 'Consolas', 'Monaco', monospace; font-size: .85rem; }

  /* Speed-tier badges */
  .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: .8rem; font-weight: 600; }
  .badge-fast { background: var(--green-bg); color: var(--green); }
  .badge-moderate { background: var(--yellow-bg); color: #856404; }
  .badge-slow { background: var(--orange-bg); color: #a84300; }
  .badge-critical { background: var(--red-bg); color: var(--red); }

  /* Category tags */
  .cat-tag { display: inline-block; padding: 1px 7px; border-radius: 3px; font-size: .7rem; font-weight: 600; text-transform: uppercase; letter-spacing: .03em; margin-right: .4rem; vertical-align: middle; }
  .cat-page-load { background: var(--blue-bg); color: var(--blue); }
  .cat-dialog-close { background: var(--purple-bg); color: var(--purple); }
  .cat-element-visible { background: var(--teal-bg); color: #0a7c5a; }

  /* Bar chart */
  .bar-container { display: flex; align-items: center; gap: .5rem; }
  .bar { height: 10px; border-radius: 5px; min-width: 2px; transition: width .3s; }
  .bar-fast { background: var(--green); }
  .bar-moderate { background: var(--yellow); }
  .bar-slow { background: var(--orange); }
  .bar-critical { background: var(--red); }

  /* Per-test details */
  details { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; margin-bottom: 1rem; }
  summary { padding: 1rem 1.25rem; cursor: pointer; font-weight: 600; font-size: .95rem; display: flex; align-items: center; gap: .75rem; }
  summary:hover { background: #f8f9fa; }
  details[open] summary { border-bottom: 1px solid var(--border); }
  .test-meta { color: var(--text-muted); font-weight: 400; font-size: .8rem; margin-left: auto; }
  .status-passed { color: var(--green); }
  .status-failed { color: var(--red); }
  .status-skipped { color: var(--text-muted); }

  /* Timeline */
  .timeline { padding: 1rem 1.25rem; }
  .timeline-row { display: flex; align-items: center; padding: .4rem 0; gap: 1rem; border-bottom: 1px solid #f1f3f5; }
  .timeline-row:last-child { border-bottom: none; }
  .timeline-idx { color: var(--text-muted); font-size: .75rem; min-width: 1.5rem; text-align: right; }
  .timeline-action { flex: 1; font-size: .9rem; }
  .timeline-duration { font-family: 'SF Mono', monospace; font-size: .85rem; min-width: 5rem; text-align: right; }

  /* Empty state */
  .empty-section { color: var(--text-muted); font-style: italic; padding: 1rem; background: var(--surface); border: 1px dashed var(--border); border-radius: 8px; margin-bottom: 2rem; }

  /* Tabs */
  .tabs { display: flex; gap: .25rem; border-bottom: 2px solid var(--border); margin-bottom: 2rem; flex-wrap: wrap; }
  .tab-btn { background: transparent; border: 0; padding: .75rem 1.25rem; cursor: pointer; font-size: .95rem; font-weight: 600; color: var(--text-muted); border-bottom: 3px solid transparent; margin-bottom: -2px; font-family: inherit; display: inline-flex; align-items: center; gap: .5rem; }
  .tab-btn:hover { color: var(--text); }
  .tab-btn.active { color: var(--blue); border-bottom-color: var(--blue); }
  .tab-btn .count-pill { background: var(--border); color: var(--text-muted); padding: 1px 8px; border-radius: 10px; font-size: .75rem; font-weight: 700; }
  .tab-btn.active .count-pill { background: var(--blue-bg); color: var(--blue); }
  .tab-panel { display: none; }
  .tab-panel.active { display: block; }

  /* Execution summary stats */
  .exec-stats { display: flex; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
  .exec-stat-card { background: var(--surface); border: 1px solid var(--border); border-left: 4px solid var(--border); border-radius: 8px; padding: 1rem 1.5rem; flex: 1; min-width: 140px; }
  .exec-stat-card .label { font-size: .8rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: .05em; }
  .exec-stat-card .value { font-size: 1.4rem; font-weight: 700; margin-top: .25rem; }
  .exec-stat-card.stat-ok { border-left-color: var(--green); }
  .exec-stat-card.stat-warn { border-left-color: var(--yellow); }
  .exec-stat-card.stat-fail { border-left-color: var(--red); }
  .exec-stat-card.stat-neutral { border-left-color: var(--blue); }

  /* Execution cards */
  .exec-grid { display: flex; flex-direction: column; gap: 1.5rem; }
  .exec-card { background: var(--surface); border: 1px solid var(--border); border-left-width: 6px; border-radius: 8px; overflow: hidden; }
  .exec-card.status-ok { border-left-color: var(--green); background: linear-gradient(to right, var(--green-bg) 0, var(--green-bg) 6px, var(--surface) 6px); }
  .exec-card.status-fail { border-left-color: var(--red); background: linear-gradient(to right, var(--red-bg) 0, var(--red-bg) 6px, var(--surface) 6px); }
  .exec-card.status-unknown { border-left-color: var(--text-muted); }
  details.exec-card > summary { cursor: pointer; list-style: none; display: flex; align-items: center; gap: .75rem; flex-wrap: wrap; padding: 1.25rem 1.5rem; }
  details.exec-card > summary::-webkit-details-marker, details.exec-card > summary::marker { display: none; }
  .collapse-icon { font-size: .65rem; color: var(--text-muted); transition: transform .15s; flex-shrink: 0; }
  details.exec-card[open] > summary .collapse-icon { transform: rotate(90deg); }
  details.exec-card > ul.exec-details { border-top: 1px solid #eef0f2; padding: .25rem 1.5rem .75rem; }
  .exec-card-title { font-size: 1rem; font-weight: 700; display: flex; align-items: center; gap: .5rem; }
  .exec-card-title .exec-idx { background: var(--border); color: var(--text-muted); padding: 2px 8px; border-radius: 4px; font-size: .8rem; font-weight: 700; font-family: 'SF Mono', monospace; }
  .exec-status-badge { display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: .8rem; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; }
  .exec-status-badge.ok { background: var(--green); color: #fff; }
  .exec-status-badge.fail { background: var(--red); color: #fff; }
  .exec-status-badge.unknown { background: var(--text-muted); color: #fff; }
  .exec-details { list-style: none; margin: 0; padding: 0; }
  .exec-details li { padding: .4rem 0; border-bottom: 1px solid #eef0f2; display: flex; gap: .75rem; align-items: baseline; flex-wrap: wrap; }
  .exec-details li:last-child { border-bottom: none; }
  .exec-details .exec-label { color: var(--text-muted); font-size: .85rem; min-width: 220px; font-weight: 600; }
  .exec-details .exec-value { flex: 1; font-size: .9rem; word-break: break-word; }
  .exec-details .exec-value.mono { font-family: 'SF Mono', 'Consolas', 'Monaco', monospace; font-size: .85rem; }
  .exec-details .exec-value a { color: var(--blue); text-decoration: none; border-bottom: 1px dashed var(--blue); }
  .exec-details .exec-value a:hover { text-decoration: none; border-bottom-style: solid; }
  .exec-details .exec-value.error-block { white-space: pre-wrap; background: #fdf2f2; border: 1px solid #f5c6cb; border-radius: 6px; padding: .5rem .75rem; font-family: 'SF Mono', monospace; font-size: .8rem; color: #721c24; max-height: 220px; overflow: auto; }
  .exec-append-group { display: flex; flex: 2; gap: 0; }
  .exec-append-item { flex: 1; padding: 0 0 0 .75rem; border-left: 1px solid var(--border); }
  .exec-append-item .append-label { font-size: .78rem; color: var(--text-muted); font-weight: 600; display: block; text-transform: uppercase; letter-spacing: .03em; }
  .exec-append-item .append-value { font-size: .9rem; font-weight: 700; }
  .append-yes { color: var(--green); }
  .append-no { color: var(--red); }

  @media (max-width: 768px) { body { padding: 1rem; } .summary-cards { flex-direction: column; } .exec-details .exec-label { min-width: auto; } }
</style>
</head>
<body>

<h1>Performance Report</h1>
<p class="subtitle">Generated ${new Date().toLocaleString()} &middot; ${this.testTimings.length} test(s) &middot; ${totalActions} action(s) measured</p>

<div class="tabs" role="tablist">
  <button type="button" class="tab-btn${hasExecutions || !hasTimings ? ' active' : ''}" role="tab" data-tab="execution" aria-selected="${hasExecutions || !hasTimings}">
    Execution Summary
    <span class="count-pill">${executions.length}</span>
  </button>
  <button type="button" class="tab-btn${hasExecutions ? '' : ' active'}" role="tab" data-tab="performance" aria-selected="${!hasExecutions}">
    Performance
    <span class="count-pill">${this.testTimings.length}</span>
  </button>
</div>

<section id="tab-execution" class="tab-panel${hasExecutions || !hasTimings ? ' active' : ''}" role="tabpanel">
${executionTabHtml}
</section>

<section id="tab-performance" class="tab-panel${hasExecutions ? '' : ' active'}" role="tabpanel">
<div class="summary-cards">
  <div class="card">
    <div class="label">Tests Tracked</div>
    <div class="value">${this.testTimings.length}</div>
  </div>
  <div class="card">
    <div class="label">Total Actions</div>
    <div class="value">${totalActions}</div>
  </div>
  <div class="card card-accent-blue">
    <div class="label">${CATEGORY_META['page-load'].label}</div>
    <div class="value">${countByCategory('page-load')}</div>
  </div>
  <div class="card card-accent-purple">
    <div class="label">${CATEGORY_META['dialog-close'].label}</div>
    <div class="value">${countByCategory('dialog-close')}</div>
  </div>
  <div class="card card-accent-teal">
    <div class="label">${CATEGORY_META['element-visible'].label}</div>
    <div class="value">${countByCategory('element-visible')}</div>
  </div>
  <div class="card">
    <div class="label">Slowest Avg</div>
    <div class="value">${stats.length ? this.formatMs(stats[0].avg) : '\u2014'}</div>
  </div>
</div>

${categorySectionsHtml}

<div class="section-header">
  <span class="section-icon">&#x1F4CB;</span>
  <h2>Per-Test Breakdown</h2>
</div>
<p class="section-desc">Expand each test to see the full measurement timeline with category tags.</p>
${testsHtml}
</section>

<script>
  (function () {
    var buttons = document.querySelectorAll('.tab-btn');
    var panels = document.querySelectorAll('.tab-panel');
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var target = btn.getAttribute('data-tab');
        buttons.forEach(function (b) {
          var active = b.getAttribute('data-tab') === target;
          b.classList.toggle('active', active);
          b.setAttribute('aria-selected', active ? 'true' : 'false');
        });
        panels.forEach(function (p) {
          p.classList.toggle('active', p.id === 'tab-' + target);
        });
      });
    });
  })();
</script>

</body>
</html>`;
    }

    /* ------------------------------------------------------------------ */
    /*  Execution Summary Tab                                              */
    /* ------------------------------------------------------------------ */

    private renderExecutionTab(executions: ExecutionRecord[]): string {
        const header = `
<div class="section-header">
  <h2>Execution Summary</h2>
</div>
<p class="section-desc">One section per address from <code>ADDRESSES</code>. Sections are highlighted red when the Fulfilment Sequence Process failed, green when it completed successfully.</p>`;

        if (executions.length === 0) {
            return `${header}
<div class="empty-section">No execution data was captured for this run.</div>`;
        }

        const statsHtml = this.renderExecutionStats(executions);
        const cards = executions
            .map((record) => this.renderExecutionCard(record))
            .join('');

        return `${header}
${statsHtml}
<div class="exec-grid">${cards}</div>`;
    }

    private renderExecutionStats(executions: ExecutionRecord[]): string {
        const total = executions.length;

        const failedCount = executions.filter((r) => {
            const ps = (r.annotations.get('Process Status') || '').toLowerCase();
            return ps === 'failed' || r.statuses.has('failed') || r.statuses.has('timedOut');
        }).length;

        const failRate = total > 0 ? `${Math.round((failedCount / total) * 100)}%` : 'N/A';

        const durations = executions
            .map((r) => parseFloat(r.annotations.get('Process Duration') || ''))
            .filter((d) => !isNaN(d));
        const avgDuration =
            durations.length > 0
                ? `${(durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(1)}s`
                : 'N/A';

        const failClass = failedCount > 0 ? 'stat-fail' : 'stat-ok';

        return `<div class="exec-stats">
  <div class="exec-stat-card stat-neutral">
    <div class="label">Orders Submitted</div>
    <div class="value">${total}</div>
  </div>
  <div class="exec-stat-card ${failClass}">
    <div class="label">Fail Rate</div>
    <div class="value">${failRate}</div>
  </div>
  <div class="exec-stat-card stat-neutral">
    <div class="label">Avg Order Submission Duration</div>
    <div class="value">${avgDuration}</div>
  </div>
</div>`;
    }

    private renderExecutionCard(record: ExecutionRecord): string {
        const processStatus = (record.annotations.get('Process Status') || '').trim();
        const testsFailed = record.statuses.has('failed') || record.statuses.has('timedOut');
        const normalizedStatus = processStatus.toLowerCase();

        let cardClass = 'exec-card status-unknown';

        if (normalizedStatus === 'failed' || testsFailed) {
            cardClass = 'exec-card status-fail';
        } else if (normalizedStatus === 'success' || normalizedStatus === 'succeeded' || normalizedStatus === 'completed') {
            cardClass = 'exec-card status-ok';
        } else if (record.statuses.has('passed') && !processStatus) {
            cardClass = 'exec-card status-ok';
        }

        const appendOnlyKeys = new Set(
            EXECUTION_FIELDS.flatMap((f) => f.appendItems?.map((a) => a.key) ?? []),
        );

        const rows = EXECUTION_FIELDS
            .filter((field) => record.annotations.has(field.key) && !appendOnlyKeys.has(field.key))
            .map((field) => {
                const rawValue = record.annotations.get(field.key) || '';
                const appendValues = field.appendItems
                    ? new Map(field.appendItems.map((a) => [a.key, record.annotations.get(a.key) ?? '']))
                    : undefined;
                return this.renderExecutionRow(field, rawValue, appendValues);
            })
            .join('');

        return `
<details class="${cardClass}" open>
  <summary>
    <span class="collapse-icon">&#9654;</span>
    <div class="exec-card-title">
      <span># Address - index ${record.index}: ${this.escapeHtml(record.address)}</span>
    </div>
  </summary>
  <ul class="exec-details">
    ${rows || '<li><span class="exec-label">No annotations captured</span><span class="exec-value">&mdash;</span></li>'}
  </ul>
</details>`;
    }

    private renderExecutionRow(
        field: (typeof EXECUTION_FIELDS)[number],
        rawValue: string,
        appendValues?: Map<string, string>,
    ): string {
        const valueClasses = ['exec-value'];
        if (field.mono) valueClasses.push('mono');

        let valueHtml: string;

        if (field.link) {
            const href = field.link(rawValue);
            valueHtml = `<a href="${this.escapeAttr(href)}" target="_blank" rel="noopener noreferrer">${this.escapeHtml(rawValue)}</a>`;
        } else if (field.multiline) {
            valueClasses.push('error-block');
            valueHtml = this.escapeHtml(rawValue);
        } else if (field.key === 'Process Status') {
            const lower = rawValue.toLowerCase();
            let badge = 'unknown';
            if (lower === 'failed') badge = 'fail';
            else if (lower === 'success' || lower === 'succeeded' || lower === 'completed') badge = 'ok';
            valueHtml = `<span class="exec-status-badge ${badge}">${this.escapeHtml(rawValue)}</span>`;
        } else {
            valueHtml = this.escapeHtml(rawValue);
        }

        let appendHtml = '';
        if (field.appendItems && field.appendItems.length > 0 && appendValues) {
            const items = field.appendItems.map((item) => {
                const val = appendValues.get(item.key) ?? '';
                const colorClass = val.toLowerCase() === 'yes'
                    ? 'append-yes'
                    : val.toLowerCase() === 'no'
                        ? 'append-no'
                        : '';
                return `<span class="exec-append-item">
          <span class="append-label">${this.escapeHtml(item.label)}</span>
          <span class="append-value ${colorClass}">${this.escapeHtml(val || '\u2014')}</span>
        </span>`;
            }).join('');
            appendHtml = `<span class="exec-append-group">${items}</span>`;
        }

        return `<li>
      <span class="exec-label">${this.escapeHtml(field.label)}</span>
      <span class="${valueClasses.join(' ')}">${valueHtml}</span>${appendHtml}
    </li>`;
    }

    /* ------------------------------------------------------------------ */
    /*  Category Section                                                   */
    /* ------------------------------------------------------------------ */

    private renderCategorySection(
        category: TimingCategory,
        catStats: ActionStats[],
    ): string {
        const meta = CATEGORY_META[category];
        const catClass = `cat-${category}`;

        const header = `
<div class="section-header">
  <span class="section-icon">${meta.icon}</span>
  <h2>${meta.label}</h2>
</div>
<p class="section-desc">${meta.description}</p>`;

        if (catStats.length === 0) {
            return `${header}<div class="empty-section">No measurements recorded for this category.</div>`;
        }

        const globalMax = Math.max(...catStats.map((s) => s.max), 1);

        const rows = catStats
            .map((s) => {
                const barWidth = Math.max(
                    2,
                    Math.round((s.avg / globalMax) * 200),
                );
                const tier = this.tier(s.avg);
                return `<tr>
      <td><span class="cat-tag ${catClass}">${meta.label}</span>${this.escapeHtml(s.action)}</td>
      <td class="mono">${s.count}</td>
      <td class="mono"><span class="badge badge-${tier}">${this.formatMs(s.avg)}</span></td>
      <td><div class="bar-container"><div class="bar bar-${tier}" style="width:${barWidth}px"></div></div></td>
    </tr>`;
            })
            .join('');

        return `${header}
<table>
  <thead>
    <tr>
      <th>Action</th>
      <th>Count</th>
      <th>Avg</th>
      <th>Distribution</th>
    </tr>
  </thead>
  <tbody>${rows}</tbody>
</table>`;
    }

    /* ------------------------------------------------------------------ */
    /*  Per-Test Section                                                   */
    /* ------------------------------------------------------------------ */

    private renderTestSection(t: TestTimingData): string {
        const statusClass = `status-${t.status}`;
        const rows = t.entries
            .map((e, i) => {
                const cat = (e.category ?? 'element-visible') as TimingCategory;
                const catClass = `cat-${cat}`;
                const catLabel = CATEGORY_META[cat]?.label ?? cat;
                return `<div class="timeline-row">
          <span class="timeline-idx">${i + 1}</span>
          <span class="timeline-action"><span class="cat-tag ${catClass}">${catLabel}</span>${this.escapeHtml(e.action)}</span>
          <span class="timeline-duration"><span class="badge badge-${this.tier(e.durationMs)}">${this.formatMs(e.durationMs)}</span></span>
        </div>`;
            })
            .join('');

        const totalWait = t.entries.reduce((sum, e) => sum + e.durationMs, 0);

        return `<details>
  <summary>
    <span class="${statusClass}">&bull;</span>
    ${this.escapeHtml(t.testTitle)}
    <span class="test-meta">${t.testFile} &middot; total wait: ${this.formatMs(totalWait)} &middot; test duration: ${this.formatMs(t.totalDuration)}</span>
  </summary>
  <div class="timeline">${rows}</div>
</details>`;
    }

    /* ------------------------------------------------------------------ */
    /*  Helpers                                                            */
    /* ------------------------------------------------------------------ */

    private tier(ms: number): string {
        if (ms < 1000) return 'fast';
        if (ms < 3000) return 'moderate';
        if (ms < 5000) return 'slow';
        return 'critical';
    }

    private formatMs(ms: number): string {
        if (ms < 1000) return `${ms}ms`;
        return `${(ms / 1000).toFixed(2)}s`;
    }

    private escapeHtml(str: string): string {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    private escapeAttr(str: string): string {
        return this.escapeHtml(str).replace(/'/g, '&#39;');
    }
}

export default PerformanceReporter;
