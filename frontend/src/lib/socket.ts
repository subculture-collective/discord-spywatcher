import { io, Socket } from 'socket.io-client';

import { config } from '../config/env';
import { useAuth } from '../store/auth';

/**
 * WebSocket event types
 */
export interface AnalyticsUpdateData {
    guildId: string;
    data: {
        ghosts: Array<{
            userId: string;
            username: string;
            ghostScore: number;
        }>;
        lurkers: Array<{
            userId: string;
            username: string;
            lurkerScore: number;
            channelCount: number;
        }>;
        channelDiversity: Array<{
            userId: string;
            username: string;
            channelCount: number;
        }>;
        timestamp: string;
    };
    timestamp: string;
}

export interface NewMessageData {
    userId: string;
    username: string;
    channelId: string;
    channelName: string;
    timestamp: string;
}

export interface MultiClientAlertData {
    userId: string;
    username: string;
    platforms: string[];
    timestamp: string;
}

export interface PresenceUpdateData {
    userId: string;
    username: string;
    status: string;
    timestamp: string;
}

export interface RoleChangeData {
    userId: string;
    username: string;
    addedRoles: string[];
    timestamp: string;
}

export interface UserJoinData {
    userId: string;
    username: string;
    accountAgeDays: number;
    timestamp: string;
}

/**
 * WebSocket service for real-time updates
 */
class SocketService {
    private socket: Socket | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private isConnecting = false;

    /**
     * Connect to WebSocket server
     */
    connect(): Socket {
        // Prevent multiple simultaneous connection attempts
        if (this.isConnecting) {
            if (this.socket) {
                return this.socket;
            }
            throw new Error('Connection attempt already in progress');
        }

        // Return existing connection if already connected
        if (this.socket && this.socket.connected) {
            return this.socket;
        }

        this.isConnecting = true;

        try {
            const token = useAuth.getState().accessToken;

            if (!token) {
                throw new Error('No authentication token available');
            }

            this.socket = io(config.apiUrl, {
                auth: { token },
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                reconnectionAttempts: this.maxReconnectAttempts,
                timeout: 20000,
            });

            this.socket.on('connect', () => {
                console.log('[WebSocket] Connected after', this.reconnectAttempts, 'attempts');
                this.reconnectAttempts = 0;
            });

            this.socket.on('disconnect', (reason) => {
                console.log('[WebSocket] Disconnected:', reason);
            });

            this.socket.on('connect_error', (error) => {
                console.error('[WebSocket] Connection error:', error.message);
                
                // Only disconnect on authentication errors, not general connection errors
                // Socket.io's built-in reconnection will handle transient failures
                if (error.message.includes('Invalid token') || 
                    error.message.includes('Authentication required')) {
                    console.error('[WebSocket] Authentication failed');
                    this.disconnect();
                }
            });

            this.socket.on('error', (error: { message: string }) => {
                console.error('[WebSocket] Socket error:', error.message);
            });

            return this.socket;
        } finally {
            this.isConnecting = false;
        }
    }

    /**
     * Disconnect from WebSocket server
     */
    disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        this.reconnectAttempts = 0;
        this.isConnecting = false;
    }

    /**
     * Check if socket is connected
     */
    isConnected(): boolean {
        return this.socket !== null && this.socket.connected;
    }

    /**
     * Subscribe to analytics updates for a guild
     */
    subscribeToAnalytics(
        guildId: string,
        callback: (data: AnalyticsUpdateData) => void
    ): void {
        if (!this.socket) {
            throw new Error('Socket not connected');
        }

        this.socket.emit('subscribe:analytics', guildId);
        this.socket.on('analytics:update', callback);
    }

    /**
     * Unsubscribe from analytics updates
     */
    unsubscribeFromAnalytics(
        guildId: string,
        callback: (data: AnalyticsUpdateData) => void
    ): void {
        if (!this.socket) {
            return;
        }

        this.socket.emit('unsubscribe:analytics', guildId);
        this.socket.off('analytics:update', callback);
    }

    /**
     * Subscribe to guild events
     */
    subscribeToGuild(guildId: string): void {
        if (!this.socket) {
            throw new Error('Socket not connected');
        }

        this.socket.emit('subscribe:guild', guildId);
    }

    /**
     * Unsubscribe from guild events
     */
    unsubscribeFromGuild(guildId: string): void {
        if (!this.socket) {
            return;
        }

        this.socket.emit('unsubscribe:guild', guildId);
    }

    /**
     * Listen for new messages
     */
    onNewMessage(callback: (data: NewMessageData) => void): void {
        if (!this.socket) {
            throw new Error('Socket not connected');
        }

        this.socket.on('message:new', callback);
    }

    /**
     * Remove new message listener
     */
    offNewMessage(callback: (data: NewMessageData) => void): void {
        if (!this.socket) {
            return;
        }

        this.socket.off('message:new', callback);
    }

    /**
     * Listen for multi-client alerts
     */
    onMultiClientAlert(callback: (data: MultiClientAlertData) => void): void {
        if (!this.socket) {
            throw new Error('Socket not connected');
        }

        this.socket.on('alert:multiClient', callback);
    }

    /**
     * Remove multi-client alert listener
     */
    offMultiClientAlert(callback: (data: MultiClientAlertData) => void): void {
        if (!this.socket) {
            return;
        }

        this.socket.off('alert:multiClient', callback);
    }

    /**
     * Listen for presence updates
     */
    onPresenceUpdate(callback: (data: PresenceUpdateData) => void): void {
        if (!this.socket) {
            throw new Error('Socket not connected');
        }

        this.socket.on('presence:update', callback);
    }

    /**
     * Remove presence update listener
     */
    offPresenceUpdate(callback: (data: PresenceUpdateData) => void): void {
        if (!this.socket) {
            return;
        }

        this.socket.off('presence:update', callback);
    }

    /**
     * Listen for role changes
     */
    onRoleChange(callback: (data: RoleChangeData) => void): void {
        if (!this.socket) {
            throw new Error('Socket not connected');
        }

        this.socket.on('role:change', callback);
    }

    /**
     * Remove role change listener
     */
    offRoleChange(callback: (data: RoleChangeData) => void): void {
        if (!this.socket) {
            return;
        }

        this.socket.off('role:change', callback);
    }

    /**
     * Listen for user joins
     */
    onUserJoin(callback: (data: UserJoinData) => void): void {
        if (!this.socket) {
            throw new Error('Socket not connected');
        }

        this.socket.on('user:join', callback);
    }

    /**
     * Remove user join listener
     */
    offUserJoin(callback: (data: UserJoinData) => void): void {
        if (!this.socket) {
            return;
        }

        this.socket.off('user:join', callback);
    }

    /**
     * Get socket instance (use with caution)
     */
    getSocket(): Socket | null {
        return this.socket;
    }
}

/**
 * Singleton instance of SocketService
 */
export const socketService = new SocketService();
