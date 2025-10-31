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
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-surface rounded-lg p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-surface-light"
        >
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 dark:text-foreground-muted">
                        {title}
                    </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-foreground mt-2">
                        {value}
                    </p>
                    {subtitle && (
                        <p className="text-sm text-gray-500 dark:text-foreground-subtle mt-1">
                            {subtitle}
                        </p>
                    )}
                    {change !== undefined && (
                        <p className={`text-sm mt-2 flex items-center gap-1 font-medium ${
                            trend === 'up' ? 'text-success' : 'text-error'
                        }`}>
                            {trend === 'up' ? '↑' : '↓'} {Math.abs(change)}%
                        </p>
                    )}
                </div>
                <div className="p-3 bg-primary-500/10 dark:bg-primary-500/20 rounded-full">
                    <Icon className="w-6 h-6 text-primary-500" />
                </div>
            </div>
        </motion.div>
    );
}
