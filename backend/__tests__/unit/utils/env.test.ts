// Mock environment variables before importing the module
const mockEnv = {
    NODE_ENV: 'test',
    PORT: '3001',
    DATABASE_URL: 'postgresql://user:password@localhost:5432/testdb',
    DISCORD_BOT_TOKEN: 'test-bot-token-with-minimum-fifty-characters-needed-here',
    DISCORD_CLIENT_ID: 'test-client-id-min-ten-chars',
    DISCORD_CLIENT_SECRET: 'test-client-secret-min-twenty',
    DISCORD_REDIRECT_URI: 'http://localhost:5173/auth/callback',
    JWT_SECRET: 'test-jwt-secret-key-minimum-32-chars',
    JWT_REFRESH_SECRET: 'test-jwt-refresh-secret-minimum-32-chars',
    CORS_ORIGINS: 'http://localhost:5173,http://127.0.0.1:5173',
    ENABLE_RATE_LIMITING: 'true',
    ENABLE_IP_BLOCKING: 'true',
    LOG_LEVEL: 'info',
};

describe('Environment Validation', () => {
    let originalEnv: NodeJS.ProcessEnv;

    beforeAll(() => {
        originalEnv = process.env;
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    beforeEach(() => {
        // Reset modules to allow re-importing with new env
        jest.resetModules();
        // Set clean environment
        process.env = { ...mockEnv };
    });

    describe('Valid Configuration', () => {
        it('should parse valid environment variables', () => {
            const { env } = require('../../../src/utils/env');

            expect(env.NODE_ENV).toBe('test');
            expect(env.PORT).toBe(3001);
            expect(env.DISCORD_BOT_TOKEN).toBe(mockEnv.DISCORD_BOT_TOKEN);
            expect(env.DISCORD_CLIENT_ID).toBe(mockEnv.DISCORD_CLIENT_ID);
            expect(env.JWT_SECRET).toBe(mockEnv.JWT_SECRET);
            expect(env.JWT_REFRESH_SECRET).toBe(mockEnv.JWT_REFRESH_SECRET);
        });

        it('should use default values for optional fields', () => {
            delete process.env.JWT_ACCESS_EXPIRES_IN;
            delete process.env.JWT_REFRESH_EXPIRES_IN;

            const { env } = require('../../../src/utils/env');

            expect(env.JWT_ACCESS_EXPIRES_IN).toBe('15m');
            expect(env.JWT_REFRESH_EXPIRES_IN).toBe('7d');
        });

        it('should transform comma-separated values into arrays', () => {
            process.env.BOT_GUILD_IDS = '123456789,987654321';
            process.env.ADMIN_DISCORD_IDS = 'admin1,admin2,admin3';

            const { env } = require('../../../src/utils/env');

            expect(env.BOT_GUILD_IDS).toEqual(['123456789', '987654321']);
            expect(env.ADMIN_DISCORD_IDS).toEqual(['admin1', 'admin2', 'admin3']);
        });

        it('should parse CORS_ORIGINS correctly', () => {
            const { env } = require('../../../src/utils/env');

            expect(env.CORS_ORIGINS).toEqual([
                'http://localhost:5173',
                'http://127.0.0.1:5173',
            ]);
        });

        it('should coerce boolean values', () => {
            // Set to false values
            process.env.ENABLE_RATE_LIMITING = 'false';
            process.env.ENABLE_IP_BLOCKING = 'false';
            
            // Reset modules to ensure fresh import
            jest.resetModules();

            const { env } = require('../../../src/utils/env');

            expect(env.ENABLE_RATE_LIMITING).toBe(false);
            expect(env.ENABLE_IP_BLOCKING).toBe(false);
            
            // Test true values
            jest.resetModules();
            process.env.ENABLE_RATE_LIMITING = 'true';
            process.env.ENABLE_IP_BLOCKING = 'true';
            
            const { env: env2 } = require('../../../src/utils/env');
            expect(env2.ENABLE_RATE_LIMITING).toBe(true);
            expect(env2.ENABLE_IP_BLOCKING).toBe(true);
        });

        it('should accept valid NODE_ENV values', () => {
            const validEnvs = ['development', 'staging', 'production', 'test'];

            validEnvs.forEach((nodeEnv) => {
                jest.resetModules();
                process.env = { ...mockEnv, NODE_ENV: nodeEnv };
                const { env } = require('../../../src/utils/env');
                expect(env.NODE_ENV).toBe(nodeEnv);
            });
        });

        it('should accept valid LOG_LEVEL values', () => {
            const validLevels = ['error', 'warn', 'info', 'debug'];

            validLevels.forEach((level) => {
                jest.resetModules();
                process.env = { ...mockEnv, LOG_LEVEL: level };
                const { env } = require('../../../src/utils/env');
                expect(env.LOG_LEVEL).toBe(level);
            });
        });
    });

    describe('Missing Required Variables', () => {
        it('should fail without DISCORD_BOT_TOKEN', () => {
            delete process.env.DISCORD_BOT_TOKEN;
            
            // Mock console.error and process.exit before requiring the module
            const consoleErrorSpy = jest
                .spyOn(console, 'error')
                .mockImplementation();
            const exitSpy = jest
                .spyOn(process, 'exit')
                .mockImplementation(() => {
                    throw new Error('process.exit called');
                });

            expect(() => require('../../../src/utils/env')).toThrow('process.exit called');
            expect(exitSpy).toHaveBeenCalledWith(1);
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                expect.stringContaining('Invalid environment configuration')
            );

            exitSpy.mockRestore();
            consoleErrorSpy.mockRestore();
        });

        it('should fail without JWT_SECRET', () => {
            delete process.env.JWT_SECRET;
            
            const consoleErrorSpy = jest
                .spyOn(console, 'error')
                .mockImplementation();
            const exitSpy = jest
                .spyOn(process, 'exit')
                .mockImplementation(() => {
                    throw new Error('process.exit called');
                });

            expect(() => require('../../../src/utils/env')).toThrow('process.exit called');
            expect(exitSpy).toHaveBeenCalledWith(1);
            
            exitSpy.mockRestore();
            consoleErrorSpy.mockRestore();
        });

        it('should fail without DISCORD_CLIENT_ID', () => {
            delete process.env.DISCORD_CLIENT_ID;
            
            const consoleErrorSpy = jest
                .spyOn(console, 'error')
                .mockImplementation();
            const exitSpy = jest
                .spyOn(process, 'exit')
                .mockImplementation(() => {
                    throw new Error('process.exit called');
                });

            expect(() => require('../../../src/utils/env')).toThrow('process.exit called');
            expect(exitSpy).toHaveBeenCalledWith(1);
            
            exitSpy.mockRestore();
            consoleErrorSpy.mockRestore();
        });
    });

    describe('Invalid Values', () => {
        it('should fail with invalid URL for DISCORD_REDIRECT_URI', () => {
            process.env.DISCORD_REDIRECT_URI = 'not-a-valid-url';
            
            const consoleErrorSpy = jest
                .spyOn(console, 'error')
                .mockImplementation();
            const exitSpy = jest
                .spyOn(process, 'exit')
                .mockImplementation(() => {
                    throw new Error('process.exit called');
                });

            expect(() => require('../../../src/utils/env')).toThrow('process.exit called');
            expect(exitSpy).toHaveBeenCalledWith(1);
            
            exitSpy.mockRestore();
            consoleErrorSpy.mockRestore();
        });

        it('should fail with short DISCORD_BOT_TOKEN', () => {
            process.env.DISCORD_BOT_TOKEN = 'too-short';
            
            const consoleErrorSpy = jest
                .spyOn(console, 'error')
                .mockImplementation();
            const exitSpy = jest
                .spyOn(process, 'exit')
                .mockImplementation(() => {
                    throw new Error('process.exit called');
                });

            expect(() => require('../../../src/utils/env')).toThrow('process.exit called');
            expect(exitSpy).toHaveBeenCalledWith(1);
            
            exitSpy.mockRestore();
            consoleErrorSpy.mockRestore();
        });

        it('should fail with short JWT_SECRET', () => {
            process.env.JWT_SECRET = 'too-short';
            
            const consoleErrorSpy = jest
                .spyOn(console, 'error')
                .mockImplementation();
            const exitSpy = jest
                .spyOn(process, 'exit')
                .mockImplementation(() => {
                    throw new Error('process.exit called');
                });

            expect(() => require('../../../src/utils/env')).toThrow('process.exit called');
            expect(exitSpy).toHaveBeenCalledWith(1);
            
            exitSpy.mockRestore();
            consoleErrorSpy.mockRestore();
        });

        it('should fail with invalid NODE_ENV', () => {
            process.env.NODE_ENV = 'invalid-env';
            
            const consoleErrorSpy = jest
                .spyOn(console, 'error')
                .mockImplementation();
            const exitSpy = jest
                .spyOn(process, 'exit')
                .mockImplementation(() => {
                    throw new Error('process.exit called');
                });

            expect(() => require('../../../src/utils/env')).toThrow('process.exit called');
            expect(exitSpy).toHaveBeenCalledWith(1);
            
            exitSpy.mockRestore();
            consoleErrorSpy.mockRestore();
        });

        it('should fail with invalid LOG_LEVEL', () => {
            process.env.LOG_LEVEL = 'invalid-level';
            
            const consoleErrorSpy = jest
                .spyOn(console, 'error')
                .mockImplementation();
            const exitSpy = jest
                .spyOn(process, 'exit')
                .mockImplementation(() => {
                    throw new Error('process.exit called');
                });

            expect(() => require('../../../src/utils/env')).toThrow('process.exit called');
            expect(exitSpy).toHaveBeenCalledWith(1);
            
            exitSpy.mockRestore();
            consoleErrorSpy.mockRestore();
        });

        it('should fail with negative PORT', () => {
            process.env.PORT = '-1';
            
            const consoleErrorSpy = jest
                .spyOn(console, 'error')
                .mockImplementation();
            const exitSpy = jest
                .spyOn(process, 'exit')
                .mockImplementation(() => {
                    throw new Error('process.exit called');
                });

            expect(() => require('../../../src/utils/env')).toThrow('process.exit called');
            expect(exitSpy).toHaveBeenCalledWith(1);
            
            exitSpy.mockRestore();
            consoleErrorSpy.mockRestore();
        });
    });

    describe('Type Safety', () => {
        it('should export Env type', () => {
            const { env } = require('../../../src/utils/env');

            // TypeScript should enforce these types at compile time
            expect(typeof env.NODE_ENV).toBe('string');
            expect(typeof env.PORT).toBe('number');
            expect(typeof env.DISCORD_BOT_TOKEN).toBe('string');
            expect(Array.isArray(env.BOT_GUILD_IDS)).toBe(true);
            expect(Array.isArray(env.ADMIN_DISCORD_IDS)).toBe(true);
            expect(Array.isArray(env.CORS_ORIGINS)).toBe(true);
            expect(typeof env.ENABLE_RATE_LIMITING).toBe('boolean');
            expect(typeof env.ENABLE_IP_BLOCKING).toBe('boolean');
        });
    });
});
