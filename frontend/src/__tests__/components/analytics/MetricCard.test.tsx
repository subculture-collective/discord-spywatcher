import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import MetricCard from '../../../components/analytics/MetricCard';

describe('MetricCard Component', () => {
    it('should render title and value', () => {
        render(<MetricCard title="Total Users" value={150} />);
        
        expect(screen.getByText('Total Users')).toBeInTheDocument();
        expect(screen.getByText('150')).toBeInTheDocument();
    });

    it('should render subtitle when provided', () => {
        render(
            <MetricCard
                title="Total Users"
                value={150}
                subtitle="Active today"
            />
        );
        
        expect(screen.getByText('Active today')).toBeInTheDocument();
    });

    it('should render positive trend', () => {
        render(
            <MetricCard
                title="Total Users"
                value={150}
                trend={{ value: 15, isPositive: true }}
            />
        );
        
        expect(screen.getByText('↑ 15%')).toBeInTheDocument();
    });

    it('should render negative trend', () => {
        render(
            <MetricCard
                title="Total Users"
                value={150}
                trend={{ value: 10, isPositive: false }}
            />
        );
        
        expect(screen.getByText('↓ 10%')).toBeInTheDocument();
    });
});
