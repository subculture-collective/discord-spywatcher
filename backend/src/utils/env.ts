import dotenv from 'dotenv';
dotenv.config();

const required = [
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'DISCORD_CLIENT_ID',
    'DISCORD_CLIENT_SECRET',
    'DISCORD_REDIRECT_URI',
    'DISCORD_BOT_TOKEN',
];

const missing = required.filter((key) => !process.env[key]);

if (missing.length > 0) {
    console.error('❌ Missing required environment variables:\n');
    missing.forEach((key) => console.error(`- ${key}`));
    console.error('\n💡 Check your .env file.');
    process.exit(1);
}

// Export validated and typed env values
export const env = {
    JWT_SECRET: process.env.JWT_SECRET!,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET!,
    DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID!,
    DISCORD_CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET!,
    DISCORD_REDIRECT_URI: process.env.DISCORD_REDIRECT_URI!,
    DISCORD_BOT_TOKEN: process.env.DISCORD_BOT_TOKEN!,
    DISCORD_GUILD_ID: process.env.DISCORD_GUILD_ID || '',
    ADMIN_DISCORD_IDS: (process.env.ADMIN_DISCORD_IDS || '')
        .split(',')
        .filter(Boolean),
    BOT_GUILD_IDS: (process.env.BOT_GUILD_IDS || '').split(',').filter(Boolean),
    PORT: parseInt(process.env.PORT || '3001', 10),
    NODE_ENV: process.env.NODE_ENV || 'development',
};
