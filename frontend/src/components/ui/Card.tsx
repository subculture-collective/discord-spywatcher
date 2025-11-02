import { motion } from 'framer-motion';
import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
    hover?: boolean;
}

export function Card({ children, hover = false, className = '' }: CardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`bg-white dark:bg-ctp-surface0 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-ctp-surface1 ${
                hover ? 'hover:shadow-xl transition-shadow duration-300' : ''
            } ${className}`}
        >
            {children}
        </motion.div>
    );
}

interface CardHeaderProps {
    children: ReactNode;
    className?: string;
}

export function CardHeader({ children, className = '' }: CardHeaderProps) {
    return (
        <div className={`mb-4 ${className}`}>
            {children}
        </div>
    );
}

interface CardTitleProps {
    children: ReactNode;
    className?: string;
    as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
    id?: string;
}

export function CardTitle({ children, className = '', as: Component = 'h2', id }: CardTitleProps) {
    return (
        <Component id={id} className={`text-xl font-semibold text-gray-900 dark:text-ctp-text ${className}`}>
            {children}
        </Component>
    );
}

interface CardContentProps {
    children: ReactNode;
    className?: string;
}

export function CardContent({ children, className = '' }: CardContentProps) {
    return (
        <div className={className}>
            {children}
        </div>
    );
}
