import { useMemo } from 'react';

interface TimelineEventProps {
    event: {
        id: string;
        type: 'presence' | 'message' | 'typing' | 'role' | 'join' | 'deleted_message';
        userId: string;
        username: string;
        timestamp: string;
        metadata: Record<string, unknown>;
        isAnomalous?: boolean;
        anomalyReason?: string;
    };
}

function TimelineEvent({ event }: TimelineEventProps) {
    const formattedTime = useMemo(() => {
        const date = new Date(event.timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    }, [event.timestamp]);

    const fullTime = useMemo(() => {
        return new Date(event.timestamp).toLocaleString();
    }, [event.timestamp]);

    const { icon, color, title, description } = useMemo(() => {
        switch (event.type) {
            case 'presence':
                return {
                    icon: (
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z"
                            />
                        </svg>
                    ),
                    color: 'bg-purple-500',
                    title: 'Presence Change',
                    description: `Clients: ${Array.isArray(event.metadata.clients) ? (event.metadata.clients as string[]).join(', ') : 'Unknown'}`,
                };
            case 'message':
                return {
                    icon: (
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                            />
                        </svg>
                    ),
                    color: 'bg-blue-500',
                    title: 'Message',
                    description: `#${event.metadata.channel || 'unknown'}: ${
                        typeof event.metadata.content === 'string'
                            ? event.metadata.content.substring(0, 100)
                            : ''
                    }${typeof event.metadata.content === 'string' && event.metadata.content.length > 100 ? '...' : ''}`,
                };
            case 'typing':
                return {
                    icon: (
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                        </svg>
                    ),
                    color: 'bg-yellow-500',
                    title: 'Typing',
                    description: `in #${event.metadata.channel || 'unknown'}`,
                };
            case 'role':
                return {
                    icon: (
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                            />
                        </svg>
                    ),
                    color: 'bg-green-500',
                    title: 'Role Change',
                    description: `Added roles: ${Array.isArray(event.metadata.addedRoles) ? (event.metadata.addedRoles as string[]).join(', ') : 'Unknown'}`,
                };
            case 'join':
                return {
                    icon: (
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                            />
                        </svg>
                    ),
                    color: 'bg-pink-500',
                    title: 'Joined Server',
                    description: `Account age: ${event.metadata.accountAgeDays || 'Unknown'} days`,
                };
            case 'deleted_message':
                return {
                    icon: (
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                        </svg>
                    ),
                    color: 'bg-red-500',
                    title: 'Message Deleted',
                    description: `from #${event.metadata.channel || 'unknown'}`,
                };
            default:
                return {
                    icon: null,
                    color: 'bg-gray-500',
                    title: 'Unknown Event',
                    description: '',
                };
        }
    }, [event.type, event.metadata]);

    return (
        <div
            className={`bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow ${
                event.isAnomalous ? 'ring-2 ring-orange-400' : ''
            }`}
        >
            <div className="flex items-start gap-3">
                {/* Icon */}
                <div className={`${color} rounded-full p-2 text-white flex-shrink-0`}>
                    {icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 text-sm">
                                {title}
                            </h3>
                            <p className="text-gray-600 text-sm mt-1 break-words">
                                {description}
                            </p>
                        </div>
                        <span
                            className="text-xs text-gray-500 whitespace-nowrap flex-shrink-0"
                            title={fullTime}
                        >
                            {formattedTime}
                        </span>
                    </div>

                    {/* Anomaly indicator */}
                    {event.isAnomalous && (
                        <div className="mt-2 flex items-center gap-1 text-orange-600 text-xs">
                            <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                />
                            </svg>
                            <span className="font-medium">
                                {event.anomalyReason || 'Unusual pattern detected'}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default TimelineEvent;
