import { Monitor, Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useTheme } from '../../contexts/ThemeContext';

import { Button } from './Button';

export function ThemeToggle() {
    const { t } = useTranslation();
    const { theme, toggleTheme, effectiveTheme } = useTheme();
    const [showTooltip, setShowTooltip] = useState(false);

    // Add keyboard shortcut (Ctrl/Cmd + Shift + T)
    useEffect(() => {
        let timeoutId: NodeJS.Timeout | null = null;

        const handleKeyPress = (event: KeyboardEvent) => {
            if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'T') {
                event.preventDefault();
                toggleTheme();
                
                // Show tooltip briefly when triggered by keyboard
                setShowTooltip(true);
                timeoutId = setTimeout(() => setShowTooltip(false), 2000);
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => {
            window.removeEventListener('keydown', handleKeyPress);
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [toggleTheme]);

    const getIcon = () => {
        if (theme === 'system') {
            return <Monitor className="h-5 w-5" aria-hidden="true" />;
        }
        return effectiveTheme === 'dark' ? (
            <Sun className="h-5 w-5" aria-hidden="true" />
        ) : (
            <Moon className="h-5 w-5" aria-hidden="true" />
        );
    };

    const getThemeLabel = () => {
        switch (theme) {
            case 'light':
                return t('theme.light');
            case 'dark':
                return t('theme.dark');
            case 'system':
                return `${t('theme.system')} (${effectiveTheme})`;
            default:
                return t('theme.toggle');
        }
    };

    return (
        <div className="relative">
            <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="w-10 h-10 p-0 flex items-center justify-center"
                aria-label={`${t('theme.toggle')}: ${getThemeLabel()}. ${t('theme.keyboardShortcut')}`}
                title={`${t('theme.toggle')}: ${getThemeLabel()}\n${t('theme.keyboardShortcut')}`}
            >
                {getIcon()}
            </Button>
            
            {showTooltip && (
                <div
                    role="status"
                    aria-live="polite"
                    className="absolute top-full mt-2 right-0 bg-ctp-surface0 text-ctp-text px-3 py-2 rounded-lg text-sm whitespace-nowrap shadow-lg border border-ctp-surface1 z-50 animate-fade-in"
                >
                    {t('theme.toggle')}: {getThemeLabel()}
                </div>
            )}
        </div>
    );
}
