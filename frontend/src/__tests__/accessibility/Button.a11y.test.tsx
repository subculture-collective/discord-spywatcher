import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';

import { Button } from '../../components/ui/Button';

describe('Button Accessibility', () => {
    it('should have no accessibility violations', async () => {
        const { container } = render(<Button>Click me</Button>);
        const results = await axe(container);
        expect(results.violations).toEqual([]);
    });

    it('should have no violations with icon', async () => {
        const { container } = render(
            <Button icon={<span>🔍</span>}>Search</Button>
        );
        const results = await axe(container);
        expect(results.violations).toEqual([]);
    });

    it('should have no violations when loading', async () => {
        const { container } = render(<Button isLoading>Loading</Button>);
        const results = await axe(container);
        expect(results.violations).toEqual([]);
    });

    it('should have no violations when disabled', async () => {
        const { container } = render(<Button disabled>Disabled</Button>);
        const results = await axe(container);
        expect(results.violations).toEqual([]);
    });

    it('should have no violations with aria-label', async () => {
        const { container } = render(
            <Button aria-label="Custom label">Button</Button>
        );
        const results = await axe(container);
        expect(results.violations).toEqual([]);
    });

    it('should have proper ARIA attributes when loading', () => {
        const { getByRole } = render(<Button isLoading>Loading</Button>);
        const button = getByRole('button');
        expect(button).toHaveAttribute('aria-busy', 'true');
        expect(button).toBeDisabled();
    });

    it('should have proper disabled attribute when disabled', () => {
        const { getByRole } = render(<Button disabled>Disabled</Button>);
        const button = getByRole('button');
        expect(button).toBeDisabled();
    });
});
