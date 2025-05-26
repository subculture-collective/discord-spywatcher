import morgan from 'morgan';
import logger from './winstonLogger';

morgan.token('user-id', (req: any) => req.user?.discordId || 'anonymous');

export const requestLogger = morgan(
    ':user-id :method :url :status - :response-time ms ":user-agent"',
    {
        stream: {
            write: (message: string) => logger.http(message.trim()),
        },
    }
);
