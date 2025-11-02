import { act, renderHook } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { ThemeProvider, useTheme } from '../../contexts/ThemeContext';

describe('ThemeContext', () => {
    beforeEach(() => {
        localStorage.clear();
        // Reset document classes
        document.documentElement.className = '';
        document.documentElement.style.colorScheme = '';
    });

    describe('ThemeProvider', () => {
        it('should default to system theme when no preference is stored', () => {
            const { result } = renderHook(() => useTheme(), {
                wrapper: ThemeProvider,
            });

            expect(result.current.theme).toBe('system');
        });

        it('should use stored theme preference', () => {
            localStorage.setItem('theme', 'light');

            const { result } = renderHook(() => useTheme(), {
                wrapper: ThemeProvider,
            });

            expect(result.current.theme).toBe('light');
        });

        it('should apply dark class to document when dark theme is active', () => {
            localStorage.setItem('theme', 'dark');

            renderHook(() => useTheme(), {
                wrapper: ThemeProvider,
            });

            expect(document.documentElement.classList.contains('dark')).toBe(true);
            expect(document.documentElement.style.colorScheme).toBe('dark');
        });

        it('should apply light class to document when light theme is active', () => {
            localStorage.setItem('theme', 'light');

            renderHook(() => useTheme(), {
                wrapper: ThemeProvider,
            });

            expect(document.documentElement.classList.contains('light')).toBe(true);
            expect(document.documentElement.style.colorScheme).toBe('light');
        });
    });

    describe('setTheme', () => {
        it('should update theme and persist to localStorage', () => {
            const { result } = renderHook(() => useTheme(), {
                wrapper: ThemeProvider,
            });

            act(() => {
                result.current.setTheme('light');
            });

            expect(result.current.theme).toBe('light');
            expect(localStorage.getItem('theme')).toBe('light');
        });

        it('should update document classes when theme changes', () => {
            const { result } = renderHook(() => useTheme(), {
                wrapper: ThemeProvider,
            });

            act(() => {
                result.current.setTheme('dark');
            });

            expect(document.documentElement.classList.contains('dark')).toBe(true);
            expect(document.documentElement.classList.contains('light')).toBe(false);

            act(() => {
                result.current.setTheme('light');
            });

            expect(document.documentElement.classList.contains('light')).toBe(true);
            expect(document.documentElement.classList.contains('dark')).toBe(false);
        });
    });

    describe('toggleTheme', () => {
        it('should cycle through themes: light -> dark -> system -> light', () => {
            localStorage.setItem('theme', 'light');

            const { result } = renderHook(() => useTheme(), {
                wrapper: ThemeProvider,
            });

            expect(result.current.theme).toBe('light');

            act(() => {
                result.current.toggleTheme();
            });
            expect(result.current.theme).toBe('dark');

            act(() => {
                result.current.toggleTheme();
            });
            expect(result.current.theme).toBe('system');

            act(() => {
                result.current.toggleTheme();
            });
            expect(result.current.theme).toBe('light');
        });
    });

    describe('effectiveTheme', () => {
        it('should return actual theme when not using system preference', () => {
            localStorage.setItem('theme', 'dark');

            const { result } = renderHook(() => useTheme(), {
                wrapper: ThemeProvider,
            });

            expect(result.current.effectiveTheme).toBe('dark');
        });

        it('should resolve system preference when theme is system', () => {
            localStorage.setItem('theme', 'system');

            // Mock matchMedia for dark preference
            Object.defineProperty(window, 'matchMedia', {
                writable: true,
                value: vi.fn().mockImplementation((query) => ({
                    matches: query === '(prefers-color-scheme: dark)',
                    media: query,
                    onchange: null,
                    addListener: vi.fn(),
                    removeListener: vi.fn(),
                    addEventListener: vi.fn(),
                    removeEventListener: vi.fn(),
                    dispatchEvent: vi.fn(),
                })),
            });

            const { result } = renderHook(() => useTheme(), {
                wrapper: ThemeProvider,
            });

            expect(result.current.theme).toBe('system');
            expect(result.current.effectiveTheme).toBe('dark');
        });
    });

    describe('useTheme hook', () => {
        it('should throw error when used outside ThemeProvider', () => {
            // Suppress console.error for this test
            const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

            expect(() => {
                renderHook(() => useTheme());
            }).toThrow('useTheme must be used within a ThemeProvider');

            consoleError.mockRestore();
        });
    });
});
