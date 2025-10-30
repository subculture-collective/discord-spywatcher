export interface SuspicionFactors {
    ghostScore: number; // 0-100
    lurkerScore: number; // 0-100
    multiClientFreq: number; // 0-100
    timingAnomalies: number; // 0-100
    accountAge: number; // days
    activityPattern: number; // 0-100
    contentSimilarity: number; // 0-100
}

export interface SuspicionResult {
    userId: string;
    username: string;
    totalScore: number;
    confidence: 'high' | 'medium' | 'low';
    factors: SuspicionFactors;
    reasons: string[];
    recommendedAction: string;
}
