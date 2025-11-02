import { Monitor, Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useTheme } from '../../contexts/ThemeContext';

import { Button } from './Button';

export function ThemeToggle() {
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
                return 'Light mode';
            case 'dark':
                return 'Dark mode';
            case 'system':
                return `System (${effectiveTheme})`;
            default:
                return 'Theme';
        }
    };

    const getNextThemeLabel = () => {
        switch (theme) {
            case 'light':
                return 'dark';
            case 'dark':
                return 'system';
            case 'system':
                return 'light';
            default:
                return 'theme';
        }
    };

    return (
        <div className="relative">
            <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="w-10 h-10 p-0 flex items-center justify-center"
                aria-label={`Current theme: ${getThemeLabel()}. Click to switch to ${getNextThemeLabel()} mode (Ctrl+Shift+T)`}
                title={`Current: ${getThemeLabel()}\nClick to cycle themes\nShortcut: Ctrl+Shift+T`}
            >
                {getIcon()}
            </Button>
            
            {showTooltip && (
                <div
                    role="status"
                    aria-live="polite"
                    className="absolute top-full mt-2 right-0 bg-ctp-surface0 text-ctp-text px-3 py-2 rounded-lg text-sm whitespace-nowrap shadow-lg border border-ctp-surface1 z-50 animate-fade-in"
                >
                    Switched to {getThemeLabel()}
                </div>
            )}
        </div>
    );
}
