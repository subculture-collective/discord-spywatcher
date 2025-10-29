import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

// Define the schema for environment variables
const envSchema = z.object({
    // Environment
    NODE_ENV: z
        .enum(['development', 'staging', 'production', 'test'])
        .default('development'),

    // Server
    PORT: z.coerce.number().int().positive().default(3001),

    // Database
    DATABASE_URL: z.string().url().optional(),

    // Redis
    REDIS_URL: z.string().url().optional(),

    // Discord
    DISCORD_BOT_TOKEN: z
        .string()
        .min(50, 'Discord bot token must be at least 50 characters'),
    DISCORD_CLIENT_ID: z
        .string()
        .min(10, 'Discord client ID must be at least 10 characters'),
    DISCORD_CLIENT_SECRET: z
        .string()
        .min(20, 'Discord client secret must be at least 20 characters'),
    DISCORD_GUILD_ID: z.string().optional(),
    DISCORD_REDIRECT_URI: z
        .string()
        .url('Discord redirect URI must be a valid URL'),
    BOT_GUILD_IDS: z
        .string()
        .default('')
        .transform((s: string) => s.split(',').filter(Boolean)),
    ADMIN_DISCORD_IDS: z
        .string()
        .default('')
        .transform((s: string) => s.split(',').filter(Boolean)),

    // JWT
    JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),
    JWT_REFRESH_SECRET: z
        .string()
        .min(32, 'JWT refresh secret must be at least 32 characters'),
    JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
    JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

    // CORS
    CORS_ORIGINS: z
        .string()
        .default('http://localhost:5173')
        .transform((s: string) =>
            s.split(',').map((origin: string) => origin.trim())
        ),

    // Features
    ENABLE_RATE_LIMITING: z
        .string()
        .default('true')
        .transform((val: string) => val === 'true' || val === '1'),
    ENABLE_IP_BLOCKING: z
        .string()
        .default('true')
        .transform((val: string) => val === 'true' || val === '1'),
    ENABLE_REDIS_RATE_LIMITING: z
        .string()
        .default('true')
        .transform((val: string) => val === 'true' || val === '1'),
    ENABLE_LOAD_SHEDDING: z
        .string()
        .default('true')
        .transform((val: string) => val === 'true' || val === '1'),
    LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),

    // Security
    MAX_REQUEST_SIZE_MB: z.coerce.number().int().positive().default(10),

    // Optional Frontend URL
    FRONTEND_URL: z.string().url().optional(),

    // Alert Webhooks (optional)
    DISCORD_ALERT_WEBHOOK: z.string().url().optional(),
    SLACK_ALERT_WEBHOOK: z.string().url().optional(),
});

// Export the inferred type
export type Env = z.infer<typeof envSchema>;

// Parse and validate environment variables
let env: Env;

try {
    env = envSchema.parse(process.env);
} catch (error) {
    if (error instanceof z.ZodError) {
         
        console.error('❌ Invalid environment configuration:\n');
        error.issues.forEach((err: z.ZodIssue) => {
             
            console.error(`  - ${err.path.join('.')}: ${err.message}`);
        });
         
        console.error(
            '\n💡 Check your .env file and ensure all required variables are set correctly.'
        );
        process.exit(1);
    }
    throw error;
}

export { env };
