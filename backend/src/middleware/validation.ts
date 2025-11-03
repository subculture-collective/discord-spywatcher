import { NextFunction, Request, Response } from 'express';
import { z, ZodError, ZodSchema } from 'zod';

/**
 * Generic request validation middleware factory
 * Validates request body, query, and params against a Zod schema
 */
export const validateRequest = (schema: ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            schema.parse({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                res.status(400).json({
                    error: 'Invalid request data',
                    details: error.issues.map((err: z.ZodIssue) => ({
                        path: err.path.join('.'),
                        message: err.message,
                    })),
                });
                return;
            }
            res.status(400).json({ error: 'Invalid request data' });
        }
    };
};

/**
 * Validation schemas for authentication routes
 */
export const authSchemas = {
    discordCallback: z.object({
        query: z.object({
            code: z.string().min(1, 'Authorization code is required'),
        }),
    }),

    refreshToken: z.object({
        body: z
            .object({
                token: z.string().optional(),
            })
            .optional(),
    }),

    updateRole: z.object({
        params: z.object({
            discordId: z
                .string()
                .regex(/^\d+$/, 'Discord ID must be numeric')
                .min(17, 'Discord ID must be at least 17 characters')
                .max(19, 'Discord ID must be at most 19 characters'),
        }),
        body: z.object({
            role: z.enum(['USER', 'ADMIN', 'MODERATOR', 'BANNED']),
        }),
    }),

    debugUser: z.object({
        params: z.object({
            discordId: z
                .string()
                .regex(/^\d+$/, 'Discord ID must be numeric')
                .min(17, 'Discord ID must be at least 17 characters')
                .max(19, 'Discord ID must be at most 19 characters'),
        }),
    }),
};

/**
 * Sanitize string input to prevent XSS
 * Removes potentially dangerous characters
 */
export const sanitizeString = (input: string): string => {
    return input
        .replace(/[<>]/g, '') // Remove angle brackets
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+=/gi, '') // Remove event handlers
        .trim();
};

/**
 * Validate Discord ID format
 */
export const isValidDiscordId = (id: string): boolean => {
    return /^\d{17,19}$/.test(id);
};

/**
 * Validate Discord bot token format
 */
export const isValidDiscordToken = (token: string): boolean => {
    // Discord bot tokens follow a specific pattern
    return token.length >= 50 && /^[A-Za-z0-9._-]+$/.test(token);
};

/**
 * Validation schemas for privacy routes
 */
export const privacySchemas = {
    deleteRequest: z.object({
        body: z.object({
            reason: z
                .string()
                .max(500, 'Reason must be 500 characters or less')
                .optional(),
        }),
    }),

    updateProfile: z.object({
        body: z.object({
            email: z.string().email('Invalid email address').optional(),
            locale: z
                .string()
                .max(10, 'Locale must be 10 characters or less')
                .optional(),
        }),
    }),

    auditLogsQuery: z.object({
        query: z.object({
            limit: z.string().regex(/^\d+$/).optional(),
            offset: z.string().regex(/^\d+$/).optional(),
        }),
    }),

    updateRetentionPolicy: z.object({
        params: z.object({
            dataType: z.string().min(1, 'Data type is required'),
        }),
        body: z.object({
            retentionDays: z
                .number()
                .int()
                .min(1, 'Retention days must be at least 1'),
            enabled: z.boolean().optional(),
        }),
    }),
};
