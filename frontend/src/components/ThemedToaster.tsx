import { Toaster } from 'react-hot-toast';

import { useTheme } from '../contexts/ThemeContext';

export function ThemedToaster() {
    const { effectiveTheme } = useTheme();
    
    const isDark = effectiveTheme === 'dark';
    
    return (
        <Toaster
            position="top-right"
            toastOptions={{
                style: {
                    background: isDark ? '#1e1e2e' : '#eff1f5',
                    color: isDark ? '#cdd6f4' : '#4c4f69',
                    border: isDark ? '1px solid #313244' : '1px solid #ccd0da',
                },
                success: {
                    iconTheme: {
                        primary: isDark ? '#a6e3a1' : '#40a02b',
                        secondary: isDark ? '#1e1e2e' : '#eff1f5',
                    },
                },
                error: {
                    iconTheme: {
                        primary: isDark ? '#f38ba8' : '#d20f39',
                        secondary: isDark ? '#1e1e2e' : '#eff1f5',
                    },
                },
            }}
        />
    );
}
