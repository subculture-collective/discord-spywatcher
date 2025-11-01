import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string | number;
    change?: number;
    icon: LucideIcon;
    trend?: 'up' | 'down';
    subtitle?: string;
}

export function StatCard({ title, value, change, icon: Icon, trend, subtitle }: StatCardProps) {
    return (
        <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-ctp-surface0 rounded-lg p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-ctp-surface1"
            aria-label={`${title}: ${value}${subtitle ? `, ${subtitle}` : ''}`}
        >
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 dark:text-ctp-subtext1">
                        {title}
                    </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-ctp-text mt-2" aria-live="polite">
                        {value}
                    </p>
                    {subtitle && (
                        <p className="text-sm text-gray-500 dark:text-ctp-subtext0 mt-1">
                            {subtitle}
                        </p>
                    )}
                    {change !== undefined && (
                        <p className={`text-sm mt-2 flex items-center gap-1 font-medium ${
                            trend === 'up' ? 'text-ctp-green' : 'text-ctp-red'
                        }`}
                        aria-label={`${trend === 'up' ? 'Increased' : 'Decreased'} by ${Math.abs(change)} percent`}
                        >
                            <span aria-hidden="true">{trend === 'up' ? '↑' : '↓'}</span> {Math.abs(change)}%
                        </p>
                    )}
                </div>
                <div className="p-3 bg-ctp-blue/10 dark:bg-ctp-blue/20 rounded-full" aria-hidden="true">
                    <Icon className="w-6 h-6 text-ctp-blue" />
                </div>
            </div>
        </motion.article>
    );
}
