import { createAdapter } from '@socket.io/redis-adapter';
import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';

import { AuthPayload, verifyAccessToken } from '../utils/auth';
import { env } from '../utils/env';
import { getRedisClient } from '../utils/redis';
import { sanitizeForLog } from '../utils/security';

/**
 * Extended socket data interface
 */
interface SocketData {
    user: AuthPayload;
}

/**
 * WebSocket service for real-time analytics and notifications
 */
export class WebSocketService {
    private io: SocketServer | null = null;

    /**
     * Set up WebSocket server with authentication and Redis adapter
     */
    setupWebSocket(httpServer: HttpServer): SocketServer {
        const allowedOrigins =
            env.CORS_ORIGINS && env.CORS_ORIGINS.length > 0
                ? env.CORS_ORIGINS
                : ['http://localhost:5173', 'http://127.0.0.1:5173'];

        this.io = new SocketServer(httpServer, {
            cors: {
                origin: allowedOrigins,
                credentials: true,
                methods: ['GET', 'POST'],
            },
            transports: ['websocket', 'polling'],
            pingTimeout: 60000,
            pingInterval: 25000,
        });

        // Set up Redis adapter for horizontal scaling
        const redis = getRedisClient();
        if (redis) {
            try {
                const pubClient = redis.duplicate();
                const subClient = redis.duplicate();
                this.io.adapter(createAdapter(pubClient, subClient));
                console.log('✅ WebSocket Redis adapter configured');
            } catch (error) {
                console.error('Failed to configure Redis adapter:', error);
            }
        }

        // Authentication middleware
        this.io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth.token as string;

                if (!token) {
                    return next(new Error('Authentication required'));
                }

                const user = verifyAccessToken(token);
                (socket.data as SocketData).user = user;
                next();
            } catch (_err) {
                next(new Error('Invalid token'));
            }
        });

        // Connection handler
        this.io.on('connection', (socket: Socket) => {
            this.handleConnection(socket);
        });

        console.log('✅ WebSocket server initialized');
        return this.io;
    }

    /**
     * Handle new WebSocket connection
     */
    private handleConnection(socket: Socket): void {
        const user = (socket.data as SocketData).user;
        console.log(
            `[WebSocket] User connected: ${sanitizeForLog(user.discordId)}`
        );

        // Subscribe to analytics for a specific guild
        socket.on('subscribe:analytics', (guildId: string) => {
            if (typeof guildId !== 'string' || !guildId) {
                void socket.emit('error', { message: 'Invalid guild ID' });
                return;
            }

            void socket.join(`analytics:${guildId}`);
            console.log(
                `[WebSocket] User ${sanitizeForLog(user.discordId)} subscribed to analytics:${sanitizeForLog(guildId)}`
            );
        });

        // Unsubscribe from analytics
        socket.on('unsubscribe:analytics', (guildId: string) => {
            if (typeof guildId !== 'string' || !guildId) {
                return;
            }

            void socket.leave(`analytics:${guildId}`);
            console.log(
                `[WebSocket] User ${sanitizeForLog(user.discordId)} unsubscribed from analytics:${sanitizeForLog(guildId)}`
            );
        });

        // Subscribe to guild events
        socket.on('subscribe:guild', (guildId: string) => {
            if (typeof guildId !== 'string' || !guildId) {
                void socket.emit('error', { message: 'Invalid guild ID' });
                return;
            }

            void socket.join(`guild:${guildId}`);
            console.log(
                `[WebSocket] User ${sanitizeForLog(user.discordId)} subscribed to guild:${sanitizeForLog(guildId)}`
            );
        });

        // Unsubscribe from guild events
        socket.on('unsubscribe:guild', (guildId: string) => {
            if (typeof guildId !== 'string' || !guildId) {
                return;
            }

            void socket.leave(`guild:${guildId}`);
            console.log(
                `[WebSocket] User ${sanitizeForLog(user.discordId)} unsubscribed from guild:${sanitizeForLog(guildId)}`
            );
        });

        // Handle disconnection
        socket.on('disconnect', () => {
            console.log(
                `[WebSocket] User disconnected: ${sanitizeForLog(user.discordId)}`
            );
        });

        // Handle errors
        socket.on('error', (error: Error) => {
            console.error(
                `[WebSocket] Socket error for user ${sanitizeForLog(user.discordId)}:`,
                error
            );
        });
    }

    /**
     * Emit event to a specific room
     */
    emitToRoom(room: string, event: string, data: unknown): void {
        if (!this.io) {
            console.warn('WebSocket not initialized');
            return;
        }

        this.io.to(room).emit(event, data);
    }

    /**
     * Emit analytics update to guild
     */
    emitAnalyticsUpdate(guildId: string, data: unknown): void {
        this.emitToRoom(`analytics:${guildId}`, 'analytics:update', {
            guildId,
            data,
            timestamp: new Date().toISOString(),
        });
    }

    /**
     * Emit new message event to guild
     */
    emitNewMessage(
        guildId: string,
        message: {
            userId: string;
            username: string;
            channelId: string;
            channelName: string;
            timestamp: Date;
        }
    ): void {
        this.emitToRoom(`guild:${guildId}`, 'message:new', {
            ...message,
            timestamp: message.timestamp.toISOString(),
        });
    }

    /**
     * Emit multi-client detection alert
     */
    emitMultiClientAlert(
        guildId: string,
        alert: {
            userId: string;
            username: string;
            platforms: string[];
            timestamp: Date;
        }
    ): void {
        this.emitToRoom(`guild:${guildId}`, 'alert:multiClient', {
            ...alert,
            timestamp: alert.timestamp.toISOString(),
        });
    }

    /**
     * Emit presence update
     */
    emitPresenceUpdate(
        guildId: string,
        update: {
            userId: string;
            username: string;
            status: string;
            timestamp: Date;
        }
    ): void {
        this.emitToRoom(`guild:${guildId}`, 'presence:update', {
            ...update,
            timestamp: update.timestamp.toISOString(),
        });
    }

    /**
     * Emit role change notification
     */
    emitRoleChange(
        guildId: string,
        change: {
            userId: string;
            username: string;
            addedRoles: string[];
            timestamp: Date;
        }
    ): void {
        this.emitToRoom(`guild:${guildId}`, 'role:change', {
            ...change,
            timestamp: change.timestamp.toISOString(),
        });
    }

    /**
     * Emit user join event
     */
    emitUserJoin(
        guildId: string,
        event: {
            userId: string;
            username: string;
            accountAgeDays: number;
            timestamp: Date;
        }
    ): void {
        this.emitToRoom(`guild:${guildId}`, 'user:join', {
            ...event,
            timestamp: event.timestamp.toISOString(),
        });
    }

    /**
     * Get Socket.io server instance
     */
    getIO(): SocketServer | null {
        return this.io;
    }

    /**
     * Close WebSocket server
     */
    async close(): Promise<void> {
        if (this.io) {
            await new Promise<void>((resolve) => {
                this.io?.close(() => {
                    console.log('✅ WebSocket server closed');
                    resolve();
                });
            });
            this.io = null;
        }
    }
}

/**
 * Singleton instance of WebSocketService
 */
export const websocketService = new WebSocketService();
