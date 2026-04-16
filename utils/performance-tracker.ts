export type TimingCategory = 'page-load' | 'dialog-close' | 'element-visible';

export const CATEGORY_LABELS: Record<TimingCategory, string> = {
    'page-load': 'Page Loads',
    'dialog-close': 'Dialog Dismissals',
    'element-visible': 'Element Visibility',
};

export const CATEGORY_ORDER: TimingCategory[] = [
    'page-load',
    'dialog-close',
    'element-visible',
];

export interface TimingEntry {
    action: string;
    category: TimingCategory;
    durationMs: number;
    timestamp: number;
}

export class PerformanceTracker {
    readonly entries: TimingEntry[] = [];

    async measure<T>(
        action: string,
        fn: () => Promise<T>,
        category: TimingCategory = 'element-visible',
    ): Promise<T> {
        const start = Date.now();
        try {
            return await fn();
        } finally {
            this.entries.push({
                action,
                category,
                durationMs: Date.now() - start,
                timestamp: start,
            });
        }
    }

    toJSON(): TimingEntry[] {
        return [...this.entries];
    }
}
