// Test setup file
// This file runs before all tests

// Mock environment variables for tests
process.env.JWT_SECRET = 'test-jwt-secret-key-12345678';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-key-12345678';
process.env.DISCORD_CLIENT_ID = 'test-client-id';
process.env.DISCORD_CLIENT_SECRET = 'test-client-secret';
process.env.DISCORD_REDIRECT_URI = 'http://localhost:3000/auth/callback';
process.env.DISCORD_BOT_TOKEN = 'test-bot-token';
process.env.DISCORD_GUILD_ID = 'test-guild-id';
process.env.ADMIN_DISCORD_IDS = '123456789,987654321';
process.env.FRONTEND_URL = 'http://localhost:5173';

// Increase timeout for integration tests
jest.setTimeout(10000);

// Mock console methods to reduce noise in tests
global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
};
