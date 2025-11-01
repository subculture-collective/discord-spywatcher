import { render } from '@testing-library/react';
import { Users } from 'lucide-react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';

import { StatCard } from '../../components/ui/StatCard';

describe('StatCard Accessibility', () => {
    it('should have no accessibility violations', async () => {
        const { container } = render(
            <StatCard
                title="Total Users"
                value={100}
                subtitle="Active users"
                icon={Users}
            />
        );
        const results = await axe(container);
        expect(results.violations).toEqual([]);
    });

    it('should have no violations with trend', async () => {
        const { container } = render(
            <StatCard
                title="Total Users"
                value={100}
                subtitle="Active users"
                icon={Users}
                trend="up"
                change={10}
            />
        );
        const results = await axe(container);
        expect(results.violations).toEqual([]);
    });

    it('should have aria-live region for value updates', () => {
        const { container } = render(
            <StatCard
                title="Total Users"
                value={100}
                subtitle="Active users"
                icon={Users}
            />
        );
        const liveRegion = container.querySelector('[aria-live="polite"]');
        expect(liveRegion).toBeInTheDocument();
    });

    it('should use article semantic element', () => {
        const { container } = render(
            <StatCard
                title="Total Users"
                value={100}
                subtitle="Active users"
                icon={Users}
            />
        );
        const article = container.querySelector('article');
        expect(article).toBeInTheDocument();
    });

    it('should have descriptive aria-label', () => {
        const { container } = render(
            <StatCard
                title="Total Users"
                value={100}
                subtitle="Active users"
                icon={Users}
            />
        );
        const article = container.querySelector('article');
        expect(article).toHaveAttribute('aria-label', 'Total Users: 100, Active users');
    });
});
