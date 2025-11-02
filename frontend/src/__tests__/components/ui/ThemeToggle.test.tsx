import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';

import { ThemeToggle } from '../../../components/ui/ThemeToggle';
import { ThemeProvider } from '../../../contexts/ThemeContext';

describe('ThemeToggle', () => {
    beforeEach(() => {
        localStorage.clear();
        document.documentElement.className = '';
        document.documentElement.style.colorScheme = '';
    });

    const renderWithTheme = () => {
        return render(
            <ThemeProvider>
                <ThemeToggle />
            </ThemeProvider>
        );
    };

    it('should render theme toggle button', () => {
        renderWithTheme();
        
        const button = screen.getByRole('button');
        expect(button).toBeInTheDocument();
    });

    it('should show system icon when theme is system', () => {
        renderWithTheme();
        
        const button = screen.getByRole('button');
        expect(button).toHaveAttribute('aria-label', expect.stringContaining('System'));
    });

    it('should toggle theme when clicked', () => {
        renderWithTheme();
        
        const button = screen.getByRole('button');
        
        // Click to cycle through themes
        fireEvent.click(button);
        expect(localStorage.getItem('theme')).toBeTruthy();
    });

    it('should handle keyboard shortcut Ctrl+Shift+T', async () => {
        renderWithTheme();
        
        // Trigger keyboard shortcut
        const event = new KeyboardEvent('keydown', {
            key: 'T',
            ctrlKey: true,
            shiftKey: true,
            bubbles: true,
        });
        
        window.dispatchEvent(event);
        
        // Wait for tooltip to appear
        await waitFor(() => {
            const tooltip = screen.queryByRole('status');
            expect(tooltip).toBeInTheDocument();
        });
    });

    it('should show tooltip when theme is toggled via keyboard', async () => {
        renderWithTheme();
        
        const event = new KeyboardEvent('keydown', {
            key: 'T',
            ctrlKey: true,
            shiftKey: true,
            bubbles: true,
        });
        
        window.dispatchEvent(event);
        
        await waitFor(() => {
            const tooltip = screen.queryByRole('status');
            expect(tooltip).toBeInTheDocument();
            expect(tooltip).toHaveTextContent('Switched to');
        });
    });

    it('should have proper accessibility attributes', () => {
        renderWithTheme();
        
        const button = screen.getByRole('button');
        expect(button).toHaveAttribute('aria-label');
        expect(button).toHaveAttribute('title');
    });

    it('should cycle through light, dark, and system themes', () => {
        localStorage.setItem('theme', 'light');
        renderWithTheme();
        
        const button = screen.getByRole('button');
        
        // Should be light initially
        expect(localStorage.getItem('theme')).toBe('light');
        
        // Click to go to dark
        fireEvent.click(button);
        expect(localStorage.getItem('theme')).toBe('dark');
        
        // Click to go to system
        fireEvent.click(button);
        expect(localStorage.getItem('theme')).toBe('system');
        
        // Click to go back to light
        fireEvent.click(button);
        expect(localStorage.getItem('theme')).toBe('light');
    });
});
