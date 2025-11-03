import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';

import { LanguageSwitcher } from '../../../components/ui/LanguageSwitcher';
import i18n from '../../../config/i18n';

describe('LanguageSwitcher Component', () => {
    beforeEach(async () => {
        await i18n.changeLanguage('en');
    });

    it('should render the language switcher button', () => {
        render(<LanguageSwitcher />);
        
        const button = screen.getByRole('button', { name: /change language/i });
        expect(button).toBeInTheDocument();
        expect(button).toHaveTextContent('EN');
    });

    it('should show dropdown when clicked', async () => {
        const user = userEvent.setup();
        render(<LanguageSwitcher />);
        
        const button = screen.getByRole('button', { name: /change language/i });
        await user.click(button);

        await waitFor(() => {
            expect(screen.getByRole('menu')).toBeInTheDocument();
        });
    });

    it('should display all supported languages', async () => {
        const user = userEvent.setup();
        render(<LanguageSwitcher />);
        
        const button = screen.getByRole('button', { name: /change language/i });
        await user.click(button);

        await waitFor(() => {
            expect(screen.getAllByText('English').length).toBeGreaterThan(0);
            expect(screen.getByText('Español')).toBeInTheDocument();
            expect(screen.getByText('Français')).toBeInTheDocument();
            expect(screen.getByText('Deutsch')).toBeInTheDocument();
            expect(screen.getByText('日本語')).toBeInTheDocument();
        });
    });

    it('should highlight current language', async () => {
        const user = userEvent.setup();
        render(<LanguageSwitcher />);
        
        const button = screen.getByRole('button', { name: /change language/i });
        await user.click(button);

        await waitFor(() => {
            const englishOption = screen.getByRole('menuitem', { name: /switch to english/i });
            expect(englishOption).toHaveClass('text-ctp-blue');
        });
    });

    it('should change language when option is selected', async () => {
        const user = userEvent.setup();
        render(<LanguageSwitcher />);
        
        const button = screen.getByRole('button', { name: /change language/i });
        await user.click(button);

        await waitFor(() => {
            expect(screen.getByRole('menu')).toBeInTheDocument();
        });

        const spanishOption = screen.getByRole('menuitem', { name: /switch to spanish/i });
        await user.click(spanishOption);

        await waitFor(() => {
            expect(i18n.language).toBe('es');
        });
    });

    it('should close dropdown after selecting a language', async () => {
        const user = userEvent.setup();
        render(<LanguageSwitcher />);
        
        const button = screen.getByRole('button', { name: /change language/i });
        await user.click(button);

        await waitFor(() => {
            expect(screen.getByRole('menu')).toBeInTheDocument();
        });

        const frenchOption = screen.getByRole('menuitem', { name: /switch to french/i });
        await user.click(frenchOption);

        await waitFor(() => {
            expect(screen.queryByRole('menu')).not.toBeInTheDocument();
        });
    });

    it('should update button text after language change', async () => {
        const user = userEvent.setup();
        render(<LanguageSwitcher />);
        
        const button = screen.getByRole('button', { name: /change language/i });
        expect(button).toHaveTextContent('EN');
        
        await user.click(button);

        await waitFor(() => {
            expect(screen.getByRole('menu')).toBeInTheDocument();
        });

        const germanOption = screen.getByRole('menuitem', { name: /switch to german/i });
        await user.click(germanOption);

        await waitFor(() => {
            expect(button).toHaveTextContent('DE');
        });
    });

    it('should close dropdown when clicking outside', async () => {
        const user = userEvent.setup();
        render(
            <div>
                <LanguageSwitcher />
                <div data-testid="outside">Outside element</div>
            </div>
        );
        
        const button = screen.getByRole('button', { name: /change language/i });
        await user.click(button);

        await waitFor(() => {
            expect(screen.getByRole('menu')).toBeInTheDocument();
        });

        const outside = screen.getByTestId('outside');
        await user.click(outside);

        await waitFor(() => {
            expect(screen.queryByRole('menu')).not.toBeInTheDocument();
        });
    });

    it('should have proper accessibility attributes', () => {
        render(<LanguageSwitcher />);
        
        const button = screen.getByRole('button', { name: /change language/i });
        expect(button).toHaveAttribute('aria-expanded', 'false');
        expect(button).toHaveAttribute('aria-haspopup', 'true');
    });

    it('should update aria-expanded when dropdown is open', async () => {
        const user = userEvent.setup();
        render(<LanguageSwitcher />);
        
        const button = screen.getByRole('button', { name: /change language/i });
        expect(button).toHaveAttribute('aria-expanded', 'false');
        
        await user.click(button);

        await waitFor(() => {
            expect(button).toHaveAttribute('aria-expanded', 'true');
        });
    });
});
