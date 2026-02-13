export class LatencyTracker {
    private sessionStartTime: number;
    private responseStartTime: number | null = null;

    constructor() {
        this.sessionStartTime = Date.now();
    }

    startResponse() {
        this.responseStartTime = Date.now();
    }

    endResponse() {
        if (!this.responseStartTime) return { totalMs: 0 };
        const duration = Date.now() - this.responseStartTime;
        this.responseStartTime = null;
        return {
            totalMs: duration
        };
    }

    getSessionDuration() {
        return Date.now() - this.sessionStartTime;
    }
}
