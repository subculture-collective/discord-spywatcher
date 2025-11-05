import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import HeatmapChart from '../../../components/analytics/HeatmapChart';
import { ThemeProvider } from '../../../contexts/ThemeContext';

const renderWithTheme = (component: React.ReactElement) => {
    return render(<ThemeProvider>{component}</ThemeProvider>);
};

describe('HeatmapChart', () => {
    const mockData = [
        {
            userId: 'user1',
            username: 'User One',
            channelId: 'channel1',
            channel: 'general',
            count: 50,
        },
        {
            userId: 'user2',
            username: 'User Two',
            channelId: 'channel1',
            channel: 'general',
            count: 30,
        },
        {
            userId: 'user1',
            username: 'User One',
            channelId: 'channel2',
            channel: 'random',
            count: 20,
        },
    ];

    it('should render chart with data without errors', () => {
        const { container } = renderWithTheme(<HeatmapChart data={mockData} />);
        
        // Check that the ResponsiveContainer is rendered
        expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument();
    });

    it('should display empty state when no data', () => {
        renderWithTheme(<HeatmapChart data={[]} />);
        
        expect(screen.getByText('No data available')).toBeInTheDocument();
    });

    it('should accept onChannelClick callback prop', () => {
        const onChannelClick = vi.fn();
        
        const { container } = renderWithTheme(
            <HeatmapChart data={mockData} onChannelClick={onChannelClick} />
        );
        
        // Chart is rendered with callback prop
        expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument();
    });

    it('should render without onChannelClick callback', () => {
        const { container } = renderWithTheme(<HeatmapChart data={mockData} />);
        
        // Chart should still render even without callback
        expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument();
    });
});
