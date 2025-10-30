import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import { socketService } from '../lib/socket';
import type {
    AnalyticsUpdateData,
    NewMessageData,
    MultiClientAlertData,
    UserJoinData,
} from '../lib/socket';
import { useAuth } from '../store/auth';

interface LiveAnalyticsProps {
    guildId: string;
}

export function LiveAnalytics({ guildId }: LiveAnalyticsProps) {
    const { accessToken } = useAuth();
    const [analytics, setAnalytics] = useState<AnalyticsUpdateData | null>(
        null
    );
    const [recentMessages, setRecentMessages] = useState<NewMessageData[]>([]);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (!accessToken) {
            return undefined;
        }

        let socket;
        let handleAnalyticsUpdate: ((data: AnalyticsUpdateData) => void) | null =
            null;
        let handleNewMessage: ((message: NewMessageData) => void) | null =
            null;
        let handleMultiClientAlert:
            | ((alert: MultiClientAlertData) => void)
            | null = null;
        let handleUserJoin: ((event: UserJoinData) => void) | null = null;

        try {
            // Connect to WebSocket
            socket = socketService.connect();

            // Set up connection status listeners
            socket.on('connect', () => {
                setIsConnected(true);
                toast.success('Live updates connected');
            });

            socket.on('disconnect', () => {
                setIsConnected(false);
                toast.error('Live updates disconnected');
            });

            // Subscribe to analytics updates
            handleAnalyticsUpdate = (data: AnalyticsUpdateData) => {
                setAnalytics(data);
            };
            socketService.subscribeToAnalytics(guildId, handleAnalyticsUpdate);

            // Subscribe to guild events
            socketService.subscribeToGuild(guildId);

            // Listen for new messages
            handleNewMessage = (message: NewMessageData) => {
                setRecentMessages((prev) => [message, ...prev].slice(0, 20));
            };
            socketService.onNewMessage(handleNewMessage);

            // Listen for multi-client alerts
            handleMultiClientAlert = (alert: MultiClientAlertData) => {
                toast(
                    `🚨 Multi-client: ${alert.username} on ${alert.platforms.join(', ')}`,
                    {
                        duration: 5000,
                        icon: '⚠️',
                    }
                );
            };
            socketService.onMultiClientAlert(handleMultiClientAlert);

            // Listen for user joins
            handleUserJoin = (event: UserJoinData) => {
                const message =
                    event.accountAgeDays < 7
                        ? `⚠️ New user: ${event.username} (${event.accountAgeDays}d old account)`
                        : `👋 New user: ${event.username}`;

                toast(message, {
                    duration: 4000,
                    icon: event.accountAgeDays < 7 ? '⚠️' : '👋',
                });
            };
            socketService.onUserJoin(handleUserJoin);
        } catch (error) {
            console.error('Failed to connect to WebSocket:', error);
            toast.error('Failed to connect to live updates');
        }

        // Cleanup
        return () => {
            if (handleAnalyticsUpdate) {
                socketService.unsubscribeFromAnalytics(
                    guildId,
                    handleAnalyticsUpdate
                );
            }
            socketService.unsubscribeFromGuild(guildId);
            if (handleNewMessage) {
                socketService.offNewMessage(handleNewMessage);
            }
            if (handleMultiClientAlert) {
                socketService.offMultiClientAlert(handleMultiClientAlert);
            }
            if (handleUserJoin) {
                socketService.offUserJoin(handleUserJoin);
            }
            socketService.disconnect();
        };
    }, [guildId, accessToken]);

    return (
        <div className="space-y-6">
            {/* Connection Status */}
            <div className="flex items-center gap-2">
                <div
                    className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}
                />
                <span className="text-sm">
                    {isConnected
                        ? 'Live updates active'
                        : 'Connecting to live updates...'}
                </span>
            </div>

            {/* Live Analytics */}
            {analytics && (
                <div className="bg-surface0 rounded-lg p-6">
                    <h2 className="text-xl font-semibold mb-4">
                        Live Analytics
                    </h2>
                    <p className="text-sm text-subtext0 mb-4">
                        Last updated:{' '}
                        {new Date(analytics.timestamp).toLocaleTimeString()}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Top Ghost Users */}
                        <div>
                            <h3 className="text-lg font-medium mb-3 text-mauve">
                                👻 Top Ghost Users
                            </h3>
                            <div className="space-y-2">
                                {analytics.data.ghosts
                                    .slice(0, 5)
                                    .map((ghost) => (
                                        <div
                                            key={ghost.userId}
                                            className="flex justify-between items-center bg-surface1 rounded px-3 py-2"
                                        >
                                            <span className="text-sm truncate">
                                                {ghost.username}
                                            </span>
                                            <span className="text-sm font-semibold text-mauve">
                                                {ghost.ghostScore.toFixed(1)}
                                            </span>
                                        </div>
                                    ))}
                            </div>
                        </div>

                        {/* Top Lurkers */}
                        <div>
                            <h3 className="text-lg font-medium mb-3 text-peach">
                                👀 Top Lurkers
                            </h3>
                            <div className="space-y-2">
                                {analytics.data.lurkers
                                    .slice(0, 5)
                                    .map((lurker) => (
                                        <div
                                            key={lurker.userId}
                                            className="flex justify-between items-center bg-surface1 rounded px-3 py-2"
                                        >
                                            <span className="text-sm truncate">
                                                {lurker.username}
                                            </span>
                                            <span className="text-sm font-semibold text-peach">
                                                {lurker.lurkerScore.toFixed(1)}
                                            </span>
                                        </div>
                                    ))}
                            </div>
                        </div>

                        {/* Channel Diversity */}
                        <div>
                            <h3 className="text-lg font-medium mb-3 text-teal">
                                🛰️ Channel Diversity
                            </h3>
                            <div className="space-y-2">
                                {analytics.data.channelDiversity
                                    .slice(0, 5)
                                    .map((user) => (
                                        <div
                                            key={user.userId}
                                            className="flex justify-between items-center bg-surface1 rounded px-3 py-2"
                                        >
                                            <span className="text-sm truncate">
                                                {user.username}
                                            </span>
                                            <span className="text-sm font-semibold text-teal">
                                                {user.channelCount} channels
                                            </span>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Recent Activity Feed */}
            <div className="bg-surface0 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">
                    💬 Recent Activity
                </h2>
                {recentMessages.length === 0 ? (
                    <p className="text-sm text-subtext0">
                        Waiting for new messages...
                    </p>
                ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {recentMessages.map((msg, index) => (
                            <div
                                key={`${msg.userId}-${msg.timestamp}-${index}`}
                                className="flex items-start gap-3 bg-surface1 rounded px-3 py-2"
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-sm truncate">
                                            {msg.username}
                                        </span>
                                        <span className="text-xs text-subtext0">
                                            in #{msg.channelName}
                                        </span>
                                    </div>
                                    <span className="text-xs text-subtext1">
                                        {new Date(
                                            msg.timestamp
                                        ).toLocaleTimeString()}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
