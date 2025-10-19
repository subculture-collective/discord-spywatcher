import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Environment Configuration', () => {
    // Store original env values
    const originalEnv = { ...import.meta.env };

    beforeEach(() => {
        // Reset to original values before each test
        Object.keys(import.meta.env).forEach(key => {
            delete import.meta.env[key];
        });
        Object.assign(import.meta.env, originalEnv);
        
        // Clear module cache to force re-import
        vi.resetModules();
    });

    describe('VITE_ENVIRONMENT Validation', () => {
        it('should accept valid environment values', async () => {
            const validValues = ['development', 'staging', 'production'];

            for (const value of validValues) {
                vi.resetModules();
                import.meta.env.VITE_ENVIRONMENT = value;
                import.meta.env.VITE_API_URL = 'http://localhost:3001/api';
                import.meta.env.VITE_DISCORD_CLIENT_ID = 'test-client-id';

                const { config } = await import('../../config/env');
                expect(config.environment).toBe(value);
            }
        });

        it('should reject invalid environment value "prod"', async () => {
            import.meta.env.VITE_ENVIRONMENT = 'prod';
            import.meta.env.VITE_API_URL = 'http://localhost:3001/api';
            import.meta.env.VITE_DISCORD_CLIENT_ID = 'test-client-id';

            await expect(async () => {
                await import('../../config/env');
            }).rejects.toThrow('Invalid value for VITE_ENVIRONMENT: "prod". Must be one of: development, staging, production');
        });

        it('should reject invalid environment value "dev"', async () => {
            import.meta.env.VITE_ENVIRONMENT = 'dev';
            import.meta.env.VITE_API_URL = 'http://localhost:3001/api';
            import.meta.env.VITE_DISCORD_CLIENT_ID = 'test-client-id';

            await expect(async () => {
                await import('../../config/env');
            }).rejects.toThrow('Invalid value for VITE_ENVIRONMENT: "dev". Must be one of: development, staging, production');
        });

        it('should reject invalid environment value "test"', async () => {
            import.meta.env.VITE_ENVIRONMENT = 'test';
            import.meta.env.VITE_API_URL = 'http://localhost:3001/api';
            import.meta.env.VITE_DISCORD_CLIENT_ID = 'test-client-id';

            await expect(async () => {
                await import('../../config/env');
            }).rejects.toThrow('Invalid value for VITE_ENVIRONMENT: "test". Must be one of: development, staging, production');
        });

        it('should reject random invalid environment value', async () => {
            import.meta.env.VITE_ENVIRONMENT = 'invalid-value';
            import.meta.env.VITE_API_URL = 'http://localhost:3001/api';
            import.meta.env.VITE_DISCORD_CLIENT_ID = 'test-client-id';

            await expect(async () => {
                await import('../../config/env');
            }).rejects.toThrow('Invalid value for VITE_ENVIRONMENT: "invalid-value". Must be one of: development, staging, production');
        });

        it('should use default value "development" when VITE_ENVIRONMENT is not set', async () => {
            delete import.meta.env.VITE_ENVIRONMENT;
            import.meta.env.VITE_API_URL = 'http://localhost:3001/api';
            import.meta.env.VITE_DISCORD_CLIENT_ID = 'test-client-id';

            const { config } = await import('../../config/env');
            expect(config.environment).toBe('development');
        });

        it('should set isDevelopment correctly for development environment', async () => {
            import.meta.env.VITE_ENVIRONMENT = 'development';
            import.meta.env.VITE_API_URL = 'http://localhost:3001/api';
            import.meta.env.VITE_DISCORD_CLIENT_ID = 'test-client-id';

            const { config } = await import('../../config/env');
            expect(config.isDevelopment).toBe(true);
            expect(config.isProduction).toBe(false);
        });

        it('should set isProduction correctly for production environment', async () => {
            import.meta.env.VITE_ENVIRONMENT = 'production';
            import.meta.env.VITE_API_URL = 'http://localhost:3001/api';
            import.meta.env.VITE_DISCORD_CLIENT_ID = 'test-client-id';

            const { config } = await import('../../config/env');
            expect(config.isProduction).toBe(true);
            expect(config.isDevelopment).toBe(false);
        });

        it('should set both flags to false for staging environment', async () => {
            import.meta.env.VITE_ENVIRONMENT = 'staging';
            import.meta.env.VITE_API_URL = 'http://localhost:3001/api';
            import.meta.env.VITE_DISCORD_CLIENT_ID = 'test-client-id';

            const { config } = await import('../../config/env');
            expect(config.isDevelopment).toBe(false);
            expect(config.isProduction).toBe(false);
        });
    });

    describe('Type Safety', () => {
        it('should have correct type for environment field', async () => {
            import.meta.env.VITE_ENVIRONMENT = 'development';
            import.meta.env.VITE_API_URL = 'http://localhost:3001/api';
            import.meta.env.VITE_DISCORD_CLIENT_ID = 'test-client-id';

            const { config } = await import('../../config/env');
            
            // Type assertion to ensure TypeScript enforces the correct type
            const env: 'development' | 'staging' | 'production' = config.environment;
            expect(env).toBe('development');
        });
    });
});
