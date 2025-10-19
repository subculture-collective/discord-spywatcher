/**
 * Environment configuration for the frontend application.
 * Uses Vite's environment variable system (import.meta.env).
 * 
 * All environment variables must be prefixed with VITE_ to be exposed to the client.
 */

/**
 * Get an environment variable with validation
 * @param key - The environment variable key (with VITE_ prefix)
 * @param defaultValue - Optional default value
 * @returns The environment variable value
 * @throws Error if the variable is required and not found
 */
const getEnvVar = (key: string, defaultValue?: string): string => {
    const value = import.meta.env[key] || defaultValue;
    if (!value) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
};

/**
 * Get a boolean environment variable
 * @param key - The environment variable key
 * @param defaultValue - Default boolean value
 * @returns Boolean value
 */
const getBooleanEnvVar = (key: string, defaultValue: boolean): boolean => {
    const value = import.meta.env[key];
    if (value === undefined) {
        return defaultValue;
    }
    return value === 'true' || value === '1';
};

/**
 * Get an enum environment variable with validation
 * @param key - The environment variable key
 * @param allowedValues - Array of allowed values
 * @param defaultValue - Default value (must be one of allowedValues)
 * @returns The validated environment variable value
 * @throws Error if the value is not in allowedValues
 */
const getEnumEnvVar = <T extends string>(
    key: string,
    allowedValues: readonly T[],
    defaultValue: T
): T => {
    const value = import.meta.env[key] || defaultValue;
    if (!allowedValues.includes(value as T)) {
        throw new Error(
            `Invalid value for ${key}: "${value}". Must be one of: ${allowedValues.join(', ')}`
        );
    }
    return value as T;
};

/**
 * Application configuration object
 * All values are validated and type-safe
 */
export const config = {
    // API Configuration
    apiUrl: getEnvVar('VITE_API_URL', 'http://localhost:3001/api'),

    // Discord Configuration
    discordClientId: getEnvVar('VITE_DISCORD_CLIENT_ID'),

    // Environment
    environment: getEnumEnvVar(
        'VITE_ENVIRONMENT',
        ['development', 'staging', 'production'] as const,
        'development'
    ),
    isDevelopment: getEnumEnvVar(
        'VITE_ENVIRONMENT',
        ['development', 'staging', 'production'] as const,
        'development'
    ) === 'development',
    isProduction: getEnumEnvVar(
        'VITE_ENVIRONMENT',
        ['development', 'staging', 'production'] as const,
        'development'
    ) === 'production',

    // Feature Flags
    enableAnalytics: getBooleanEnvVar('VITE_ENABLE_ANALYTICS', false),

    // Optional Analytics
    analyticsTrackingId: import.meta.env.VITE_ANALYTICS_TRACKING_ID || '',
} as const;

// Type export for use in other files
export type Config = typeof config;

// Validate configuration on module load (only in development)
if (config.isDevelopment) {
    console.log('🔧 Frontend Configuration:', {
        apiUrl: config.apiUrl,
        environment: config.environment,
        discordClientId: config.discordClientId ? '✓ Set' : '✗ Missing',
        enableAnalytics: config.enableAnalytics,
    });
}
