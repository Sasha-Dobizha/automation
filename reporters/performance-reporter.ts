import type {
    Reporter,
    TestCase,
    TestResult,
    FullResult,
} from '@playwright/test/reporter';
import * as fs from 'fs';
import * as path from 'path';

interface TimingEntry {
    action: string;
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
    count: number;
    avg: number;
    min: number;
    max: number;
    p50: number;
    p95: number;
}

const ATTACHMENT_NAME = 'perf-timings';

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
                '\n⏱  Performance Reporter: no timing data collected (add PerformanceTracker to page objects).',
            );
            return;
        }

        const stats = this.computeStats();

        fs.mkdirSync(this.outputDir, { recursive: true });

        fs.writeFileSync(
            path.join(this.outputDir, 'timings.json'),
            JSON.stringify(
                { generated: new Date().toISOString(), tests: this.testTimings, stats },
                null,
                2,
            ),
        );

        fs.writeFileSync(
            path.join(this.outputDir, 'index.html'),
            this.generateHtml(stats),
        );

        console.log(
            `\n⏱  Performance report generated → ${path.resolve(this.outputDir, 'index.html')}`,
        );
    }

    private computeStats(): ActionStats[] {
        const actionMap = new Map<string, number[]>();

        for (const test of this.testTimings) {
            for (const entry of test.entries) {
                if (!actionMap.has(entry.action)) {
                    actionMap.set(entry.action, []);
                }
                actionMap.get(entry.action)!.push(entry.durationMs);
            }
        }

        const stats: ActionStats[] = [];
        for (const [action, values] of actionMap) {
            const sorted = [...values].sort((a, b) => a - b);
            stats.push({
                action,
                count: values.length,
                avg: Math.round(
                    values.reduce((a, b) => a + b, 0) / values.length,
                ),
                min: sorted[0],
                max: sorted[sorted.length - 1],
                p50: sorted[Math.floor(sorted.length * 0.5)],
                p95: sorted[Math.floor(sorted.length * 0.95)],
            });
        }

        return stats.sort((a, b) => b.avg - a.avg);
    }

    private generateHtml(stats: ActionStats[]): string {
        const totalActions = this.testTimings.reduce(
            (sum, t) => sum + t.entries.length,
            0,
        );
        const testsHtml = this.testTimings
            .map((t) => this.renderTestSection(t))
            .join('');
        const statsRowsHtml = stats.map((s) => this.renderStatsRow(s)).join('');

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
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: var(--bg); color: var(--text); line-height: 1.5; padding: 2rem; }
  h1 { font-size: 1.75rem; margin-bottom: .25rem; }
  .subtitle { color: var(--text-muted); margin-bottom: 2rem; font-size: .9rem; }
  .summary-cards { display: flex; gap: 1rem; margin-bottom: 2rem; flex-wrap: wrap; }
  .card { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 1.25rem 1.5rem; min-width: 160px; }
  .card .label { font-size: .8rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: .05em; }
  .card .value { font-size: 1.5rem; font-weight: 700; margin-top: .25rem; }
  h2 { font-size: 1.3rem; margin: 2rem 0 1rem; border-bottom: 2px solid var(--border); padding-bottom: .5rem; }
  table { width: 100%; border-collapse: collapse; background: var(--surface); border: 1px solid var(--border); border-radius: 8px; overflow: hidden; margin-bottom: 2rem; }
  th { background: #f1f3f5; text-align: left; padding: .75rem 1rem; font-size: .8rem; text-transform: uppercase; letter-spacing: .05em; color: var(--text-muted); border-bottom: 2px solid var(--border); white-space: nowrap; }
  td { padding: .6rem 1rem; border-bottom: 1px solid #eee; font-size: .9rem; }
  tr:last-child td { border-bottom: none; }
  .mono { font-family: 'SF Mono', 'Consolas', 'Monaco', monospace; font-size: .85rem; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: .8rem; font-weight: 600; }
  .badge-fast { background: var(--green-bg); color: var(--green); }
  .badge-moderate { background: var(--yellow-bg); color: #856404; }
  .badge-slow { background: var(--orange-bg); color: #a84300; }
  .badge-critical { background: var(--red-bg); color: var(--red); }
  .bar-container { display: flex; align-items: center; gap: .5rem; }
  .bar { height: 10px; border-radius: 5px; min-width: 2px; transition: width .3s; }
  .bar-fast { background: var(--green); }
  .bar-moderate { background: var(--yellow); }
  .bar-slow { background: var(--orange); }
  .bar-critical { background: var(--red); }
  details { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; margin-bottom: 1rem; }
  summary { padding: 1rem 1.25rem; cursor: pointer; font-weight: 600; font-size: .95rem; display: flex; align-items: center; gap: .75rem; }
  summary:hover { background: #f8f9fa; }
  details[open] summary { border-bottom: 1px solid var(--border); }
  .test-meta { color: var(--text-muted); font-weight: 400; font-size: .8rem; margin-left: auto; }
  .status-passed { color: var(--green); }
  .status-failed { color: var(--red); }
  .status-skipped { color: var(--text-muted); }
  .timeline { padding: 1rem 1.25rem; }
  .timeline-row { display: flex; align-items: center; padding: .4rem 0; gap: 1rem; border-bottom: 1px solid #f1f3f5; }
  .timeline-row:last-child { border-bottom: none; }
  .timeline-idx { color: var(--text-muted); font-size: .75rem; min-width: 1.5rem; text-align: right; }
  .timeline-action { flex: 1; font-size: .9rem; }
  .timeline-duration { font-family: 'SF Mono', monospace; font-size: .85rem; min-width: 5rem; text-align: right; }
  @media (max-width: 768px) { body { padding: 1rem; } .summary-cards { flex-direction: column; } }
</style>
</head>
<body>
<h1>⏱ Element Wait-Time Performance Report</h1>
<p class="subtitle">Generated ${new Date().toLocaleString()} · ${this.testTimings.length} test(s) · ${totalActions} action(s) measured</p>

<div class="summary-cards">
  <div class="card">
    <div class="label">Tests Tracked</div>
    <div class="value">${this.testTimings.length}</div>
  </div>
  <div class="card">
    <div class="label">Total Actions</div>
    <div class="value">${totalActions}</div>
  </div>
  <div class="card">
    <div class="label">Unique Actions</div>
    <div class="value">${stats.length}</div>
  </div>
  <div class="card">
    <div class="label">Slowest Avg</div>
    <div class="value">${stats.length ? this.formatMs(stats[0].avg) : '—'}</div>
  </div>
</div>

<h2>Action Summary (sorted by avg wait time)</h2>
<table>
  <thead>
    <tr>
      <th>Action</th>
      <th>Count</th>
      <th>Avg</th>
      <th>Min</th>
      <th>Max</th>
      <th>Median</th>
      <th>Slowest (Typical)</th>
      <th>Distribution</th>
    </tr>
  </thead>
  <tbody>
    ${statsRowsHtml}
  </tbody>
</table>

<h2>Per-Test Breakdown</h2>
${testsHtml}

</body>
</html>`;
    }

    private renderStatsRow(s: ActionStats): string {
        const maxBar = Math.max(
            ...this.computeStats().map((x) => x.max),
            1,
        );
        const barWidth = Math.max(2, Math.round((s.avg / maxBar) * 200));
        const tier = this.tier(s.avg);

        return `<tr>
      <td>${this.escapeHtml(s.action)}</td>
      <td class="mono">${s.count}</td>
      <td class="mono"><span class="badge badge-${tier}">${this.formatMs(s.avg)}</span></td>
      <td class="mono">${this.formatMs(s.min)}</td>
      <td class="mono">${this.formatMs(s.max)}</td>
      <td class="mono">${this.formatMs(s.p50)}</td>
      <td class="mono">${this.formatMs(s.p95)}</td>
      <td><div class="bar-container"><div class="bar bar-${tier}" style="width:${barWidth}px"></div></div></td>
    </tr>`;
    }

    private renderTestSection(t: TestTimingData): string {
        const statusClass = `status-${t.status}`;
        const rows = t.entries
            .map(
                (e, i) =>
                    `<div class="timeline-row">
          <span class="timeline-idx">${i + 1}</span>
          <span class="timeline-action">${this.escapeHtml(e.action)}</span>
          <span class="timeline-duration"><span class="badge badge-${this.tier(e.durationMs)}">${this.formatMs(e.durationMs)}</span></span>
        </div>`,
            )
            .join('');

        const totalWait = t.entries.reduce((sum, e) => sum + e.durationMs, 0);

        return `<details>
  <summary>
    <span class="${statusClass}">●</span>
    ${this.escapeHtml(t.testTitle)}
    <span class="test-meta">${t.testFile} · total wait: ${this.formatMs(totalWait)} · test duration: ${this.formatMs(t.totalDuration)}</span>
  </summary>
  <div class="timeline">${rows}</div>
</details>`;
    }

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
