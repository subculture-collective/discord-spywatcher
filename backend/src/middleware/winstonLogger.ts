import path from 'path';
import { createLogger, format, transports } from 'winston';

const logFormat = format.printf(({ level, message, timestamp }) => {
    return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
});

const logger = createLogger({
    level: 'info',
    format: format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        format.splat(),
        logFormat
    ),
    transports: [
        new transports.Console(),
        new transports.File({
            filename: path.join('logs', 'error.log'),
            level: 'error',
        }),
        new transports.File({ filename: path.join('logs', 'combined.log') }),
    ],
    exceptionHandlers: [
        new transports.File({ filename: path.join('logs', 'exceptions.log') }),
    ],
});

export default logger;
