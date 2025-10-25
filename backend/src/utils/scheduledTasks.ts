import { processPendingDeletions } from './accountDeletion';
import { cleanupOldData } from './dataRetention';

/**
 * Run all scheduled privacy-related tasks
 * This should be called periodically (e.g., daily)
 */
export async function runScheduledPrivacyTasks(): Promise<void> {
    console.log('Starting scheduled privacy tasks...');

    try {
        // Process pending account deletions
        console.log('Processing pending account deletions...');
        const deletionResults = await processPendingDeletions();
        console.log(
            `Processed ${deletionResults.processed} deletions with ${deletionResults.errors} errors`
        );

        // Cleanup old data based on retention policies
        console.log('Cleaning up old data based on retention policies...');
        const cleanupResults = await cleanupOldData();
        console.log('Cleanup results:', cleanupResults);

        console.log('Scheduled privacy tasks completed successfully');
    } catch (error) {
        console.error('Error running scheduled privacy tasks:', error);
        throw error;
    }
}

/**
 * Start scheduled privacy tasks (to be called on server startup)
 * Runs tasks daily at 2 AM
 */
export function startScheduledPrivacyTasks(): void {
    // Calculate time until next 2 AM
    const now = new Date();
    const next2AM = new Date(now);
    next2AM.setHours(2, 0, 0, 0);
    
    if (next2AM <= now) {
        // If it's already past 2 AM today, schedule for tomorrow
        next2AM.setDate(next2AM.getDate() + 1);
    }
    
    const msUntilNext2AM = next2AM.getTime() - now.getTime();
    
    console.log(`Scheduled privacy tasks will run at ${next2AM.toISOString()}`);
    
    // Schedule first run
    setTimeout(() => {
        runScheduledPrivacyTasks().catch((err) => {
            console.error('Scheduled privacy tasks failed:', err);
        });
        
        // Schedule recurring runs every 24 hours
        setInterval(() => {
            runScheduledPrivacyTasks().catch((err) => {
                console.error('Scheduled privacy tasks failed:', err);
            });
        }, 24 * 60 * 60 * 1000);
    }, msUntilNext2AM);
}
