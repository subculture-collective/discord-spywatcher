import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Hash, Activity, AlertTriangle } from 'lucide-react';

interface DrillDownData {
    type: 'user' | 'channel';
    id: string;
    name: string;
    details: {
        suspicionScore?: number;
        ghostScore?: number;
        messageCount?: number;
        channelCount?: number;
        interactions?: number;
        recentActivity?: Array<{
            timestamp: string;
            action: string;
            channel?: string;
        }>;
    };
}

interface DrillDownPanelProps {
    data: DrillDownData | null;
    onClose: () => void;
}

function DrillDownPanel({ data, onClose }: DrillDownPanelProps) {
    if (!data) return null;

    const isUser = data.type === 'user';
    const Icon = isUser ? User : Hash;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-ctp-surface0 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="sticky top-0 bg-ctp-surface0 border-b border-ctp-surface1 p-4 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-ctp-surface1 rounded-lg">
                                <Icon className="w-6 h-6 text-ctp-blue" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-ctp-text">{data.name}</h2>
                                <p className="text-sm text-ctp-subtext0">
                                    {isUser ? 'User Details' : 'Channel Details'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-ctp-surface1 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-ctp-subtext0" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6">
                        {/* Metrics Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            {data.details.suspicionScore !== undefined && (
                                <div className="bg-ctp-surface1 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <AlertTriangle className="w-4 h-4 text-ctp-red" />
                                        <span className="text-sm text-ctp-subtext0">Suspicion Score</span>
                                    </div>
                                    <p className="text-2xl font-bold text-ctp-text">
                                        {data.details.suspicionScore}
                                    </p>
                                </div>
                            )}

                            {data.details.ghostScore !== undefined && (
                                <div className="bg-ctp-surface1 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <User className="w-4 h-4 text-ctp-mauve" />
                                        <span className="text-sm text-ctp-subtext0">Ghost Score</span>
                                    </div>
                                    <p className="text-2xl font-bold text-ctp-text">
                                        {data.details.ghostScore}
                                    </p>
                                </div>
                            )}

                            {data.details.messageCount !== undefined && (
                                <div className="bg-ctp-surface1 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Activity className="w-4 h-4 text-ctp-green" />
                                        <span className="text-sm text-ctp-subtext0">Messages</span>
                                    </div>
                                    <p className="text-2xl font-bold text-ctp-text">
                                        {data.details.messageCount}
                                    </p>
                                </div>
                            )}

                            {data.details.channelCount !== undefined && (
                                <div className="bg-ctp-surface1 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Hash className="w-4 h-4 text-ctp-blue" />
                                        <span className="text-sm text-ctp-subtext0">Channels</span>
                                    </div>
                                    <p className="text-2xl font-bold text-ctp-text">
                                        {data.details.channelCount}
                                    </p>
                                </div>
                            )}

                            {data.details.interactions !== undefined && (
                                <div className="bg-ctp-surface1 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Activity className="w-4 h-4 text-ctp-yellow" />
                                        <span className="text-sm text-ctp-subtext0">Interactions</span>
                                    </div>
                                    <p className="text-2xl font-bold text-ctp-text">
                                        {data.details.interactions}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Recent Activity */}
                        {data.details.recentActivity && data.details.recentActivity.length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold text-ctp-text mb-3">
                                    Recent Activity
                                </h3>
                                <div className="space-y-2">
                                    {data.details.recentActivity.map((activity, index) => (
                                        <div
                                            key={index}
                                            className="bg-ctp-surface1 rounded-lg p-3 flex justify-between items-center"
                                        >
                                            <div>
                                                <p className="text-sm text-ctp-text">{activity.action}</p>
                                                {activity.channel && (
                                                    <p className="text-xs text-ctp-subtext0 mt-1">
                                                        in #{activity.channel}
                                                    </p>
                                                )}
                                            </div>
                                            <p className="text-xs text-ctp-subtext0">
                                                {new Date(activity.timestamp).toLocaleString()}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Empty State */}
                        {(!data.details.recentActivity || data.details.recentActivity.length === 0) && (
                            <div className="text-center py-8 text-ctp-subtext0">
                                <p>No recent activity available</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

export default DrillDownPanel;
export type { DrillDownData };
