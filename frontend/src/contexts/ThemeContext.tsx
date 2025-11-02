import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    effectiveTheme: 'light' | 'dark';
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Get initial theme preference before React renders to prevent flash
function getInitialTheme(): Theme {
    if (typeof window === 'undefined') return 'dark';
    
    const stored = localStorage.getItem('theme') as Theme;
    if (stored && ['light', 'dark', 'system'].includes(stored)) {
        return stored;
    }
    
    // Default to system preference
    return 'system';
}

// Resolve system preference
function resolveSystemTheme(): 'light' | 'dark' {
    if (typeof window === 'undefined') return 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<Theme>(getInitialTheme);
    const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>(() => {
        const initial = getInitialTheme();
        return initial === 'system' ? resolveSystemTheme() : initial;
    });

    useEffect(() => {
        let resolved: 'light' | 'dark';
        
        if (theme === 'system') {
            resolved = resolveSystemTheme();
        } else {
            resolved = theme;
        }

        setEffectiveTheme(resolved);

        // Apply theme to document
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(resolved);
        
        // Set color-scheme for browser UI
        root.style.colorScheme = resolved;
    }, [theme]);

    // Listen for system theme changes when using 'system' theme
    useEffect(() => {
        if (theme !== 'system') return;

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e: MediaQueryListEvent) => {
            const resolved = e.matches ? 'dark' : 'light';
            setEffectiveTheme(resolved);
            
            const root = window.document.documentElement;
            root.classList.remove('light', 'dark');
            root.classList.add(resolved);
            root.style.colorScheme = resolved;
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [theme]);

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
        localStorage.setItem('theme', newTheme);
    };

    const toggleTheme = () => {
        // Cycle through: light -> dark -> system -> light
        const themeOrder: Theme[] = ['light', 'dark', 'system'];
        const currentIndex = themeOrder.indexOf(theme);
        const nextTheme = themeOrder[(currentIndex + 1) % themeOrder.length];
        setTheme(nextTheme);
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme, effectiveTheme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
