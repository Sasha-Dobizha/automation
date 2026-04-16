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

const ATTACHMENT_NAME = 'perf-timings';

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
    }

    async onEnd(_result: FullResult) {
        if (this.testTimings.length === 0) {
            console.log(
                '\n  Performance Reporter: no timing data collected (add PerformanceTracker to page objects).',
            );
            return;
        }

        const stats = this.computeStats();

        fs.mkdirSync(this.outputDir, { recursive: true });

        fs.writeFileSync(
            path.join(this.outputDir, 'timings.json'),
            JSON.stringify(
                {
                    generated: new Date().toISOString(),
                    tests: this.testTimings,
                    stats,
                },
                null,
                2,
            ),
        );

        fs.writeFileSync(
            path.join(this.outputDir, 'index.html'),
            this.generateHtml(stats),
        );

        console.log(
            `\n  Performance report generated -> ${path.resolve(this.outputDir, 'index.html')}`,
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

    private generateHtml(stats: ActionStats[]): string {
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

  @media (max-width: 768px) { body { padding: 1rem; } .summary-cards { flex-direction: column; } }
</style>
</head>
<body>

<h1>Performance Report</h1>
<p class="subtitle">Generated ${new Date().toLocaleString()} &middot; ${this.testTimings.length} test(s) &middot; ${totalActions} action(s) measured</p>

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

</body>
</html>`;
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
      <td class="mono">${this.formatMs(s.min)}</td>
      <td class="mono">${this.formatMs(s.max)}</td>
      <td class="mono">${this.formatMs(s.p50)}</td>
      <td class="mono">${this.formatMs(s.p95)}</td>
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
      <th>Min</th>
      <th>Max</th>
      <th>Median</th>
      <th>P95</th>
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
}

export default PerformanceReporter;
