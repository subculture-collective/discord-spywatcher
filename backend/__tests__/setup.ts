// Test setup file
// This file runs before all tests

// Mock environment variables for tests
// Must meet validation requirements from src/utils/env.ts
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.JWT_SECRET = 'test-jwt-secret-key-minimum-32-chars';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-minimum-32-chars';
process.env.DISCORD_CLIENT_ID = 'test-client-id-min-ten-chars';
process.env.DISCORD_CLIENT_SECRET = 'test-client-secret-min-twenty';
process.env.DISCORD_REDIRECT_URI = 'http://localhost:3000/auth/callback';
process.env.DISCORD_BOT_TOKEN = 'test-bot-token-with-minimum-fifty-characters-needed-here';
process.env.DISCORD_GUILD_ID = 'test-guild-id';
process.env.ADMIN_DISCORD_IDS = '123456789,987654321';
process.env.BOT_GUILD_IDS = '123456789,987654321';
process.env.CORS_ORIGINS = 'http://localhost:5173';
process.env.ENABLE_RATE_LIMITING = 'true';
process.env.ENABLE_IP_BLOCKING = 'true';
process.env.LOG_LEVEL = 'info';
process.env.FRONTEND_URL = 'http://localhost:5173';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

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
