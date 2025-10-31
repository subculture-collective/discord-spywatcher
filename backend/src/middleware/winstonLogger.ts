/* eslint-disable @typescript-eslint/restrict-template-expressions */
import path from 'path';

import { createLogger, format, transports } from 'winston';

import { env } from '../utils/env';

// Custom format for console output (human-readable)
const consoleFormat = format.printf(({ level, message, timestamp, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message} ${metaStr}`;
});

// JSON format for file output (structured logging for aggregation)
const jsonFormat = format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
);

const logger = createLogger({
    level: env.LOG_LEVEL || 'info',
    format: format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        format.splat()
    ),
    defaultMeta: { service: 'discord-spywatcher' },
    transports: [
        new transports.Console({
            format: format.combine(
                format.colorize(),
                consoleFormat
            ),
        }),
        new transports.File({
            filename: path.join('logs', 'error.log'),
            level: 'error',
            format: jsonFormat,
        }),
        new transports.File({
            filename: path.join('logs', 'combined.log'),
            format: jsonFormat,
        }),
    ],
    exceptionHandlers: [
        new transports.File({
            filename: path.join('logs', 'exceptions.log'),
            format: jsonFormat,
        }),
    ],
});

// Add request ID to log metadata if available
export function logWithRequestId(
    level: string,
    message: string,
    requestId?: string,
    meta?: Record<string, unknown>
): void {
    const logMeta = {
        ...meta,
        ...(requestId && { requestId }),
    };
    logger.log(level, message, logMeta);
}

export default logger;
