export interface TimingEntry {
    action: string;
    durationMs: number;
    timestamp: number;
}

export class PerformanceTracker {
    readonly entries: TimingEntry[] = [];

    async measure<T>(action: string, fn: () => Promise<T>): Promise<T> {
        const start = Date.now();
        try {
            return await fn();
        } finally {
            this.entries.push({
                action,
                durationMs: Date.now() - start,
                timestamp: start,
            });
        }
    }

    toJSON(): TimingEntry[] {
        return [...this.entries];
    }
}
