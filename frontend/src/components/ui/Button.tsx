import { motion } from 'framer-motion';
import { forwardRef } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface ButtonProps {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    icon?: ReactNode;
    className?: string;
    disabled?: boolean;
    onClick?: () => void;
    type?: 'button' | 'submit' | 'reset';
    title?: string;
    'aria-label'?: string;
    'aria-describedby'?: string;
    children: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ children, variant = 'primary', size = 'md', isLoading, icon, className = '', disabled, onClick, type, title, ...ariaProps }, ref) => {
        const { t } = useTranslation();
        const baseStyles = 'font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
        
        const variants = {
            primary: 'bg-ctp-blue hover:bg-ctp-blue/90 text-white focus:ring-ctp-blue',
            secondary: 'bg-gray-200 dark:bg-ctp-surface1 hover:bg-gray-300 dark:hover:bg-ctp-surface2 text-gray-900 dark:text-ctp-text focus:ring-gray-500',
            danger: 'bg-ctp-red hover:bg-ctp-red/90 text-white focus:ring-ctp-red',
            ghost: 'bg-transparent hover:bg-gray-100 dark:hover:bg-ctp-surface1 text-gray-900 dark:text-ctp-text focus:ring-gray-500',
        };

        const sizes = {
            sm: 'px-3 py-1.5 text-sm',
            md: 'px-4 py-2 text-base',
            lg: 'px-6 py-3 text-lg',
        };

        const isDisabled = disabled || isLoading;

        return (
            <motion.button
                ref={ref}
                whileHover={{ scale: isDisabled ? 1 : 1.02 }}
                whileTap={{ scale: isDisabled ? 1 : 0.98 }}
                className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
                disabled={isDisabled}
                onClick={onClick}
                type={type}
                title={title}
                aria-busy={isLoading}
                {...ariaProps}
            >
                {isLoading ? (
                    <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>{t('common.loadingPleaseWait')}</span>
                    </span>
                ) : (
                    <>
                        {icon && <span aria-hidden="true">{icon}</span>}
                        {children}
                    </>
                )}
            </motion.button>
        );
    }
);

Button.displayName = 'Button';
