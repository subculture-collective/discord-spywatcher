import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';

import DrillDownPanel, { type DrillDownData } from '../../../components/analytics/DrillDownPanel';
import { ThemeProvider } from '../../../contexts/ThemeContext';

const renderWithTheme = (component: React.ReactElement) => {
    return render(<ThemeProvider>{component}</ThemeProvider>);
};

describe('DrillDownPanel', () => {
    it('should not render when data is null', () => {
        const { container } = renderWithTheme(
            <DrillDownPanel data={null} onClose={() => {}} />
        );
        expect(container.firstChild).toBeNull();
    });

    it('should render user drill-down panel with data', () => {
        const mockData: DrillDownData = {
            type: 'user',
            id: 'user123',
            name: 'TestUser',
            details: {
                suspicionScore: 75,
                ghostScore: 8,
                messageCount: 150,
                channelCount: 5,
                interactions: 200,
            },
        };

        renderWithTheme(<DrillDownPanel data={mockData} onClose={() => {}} />);
        
        expect(screen.getByText('TestUser')).toBeInTheDocument();
        expect(screen.getByText('User Details')).toBeInTheDocument();
        expect(screen.getByText('75')).toBeInTheDocument(); // Suspicion Score
        expect(screen.getByText('8')).toBeInTheDocument(); // Ghost Score
    });

    it('should render channel drill-down panel with data', () => {
        const mockData: DrillDownData = {
            type: 'channel',
            id: 'channel456',
            name: 'general',
            details: {
                messageCount: 500,
                interactions: 650,
            },
        };

        renderWithTheme(<DrillDownPanel data={mockData} onClose={() => {}} />);
        
        expect(screen.getByText('general')).toBeInTheDocument();
        expect(screen.getByText('Channel Details')).toBeInTheDocument();
        expect(screen.getByText('500')).toBeInTheDocument(); // Message count
    });

    it('should call onClose when close button is clicked', async () => {
        const user = userEvent.setup();
        const onCloseMock = vi.fn();
        
        const mockData: DrillDownData = {
            type: 'user',
            id: 'user123',
            name: 'TestUser',
            details: {
                suspicionScore: 50,
            },
        };

        renderWithTheme(<DrillDownPanel data={mockData} onClose={onCloseMock} />);
        
        const closeButton = screen.getByRole('button');
        await user.click(closeButton);
        
        expect(onCloseMock).toHaveBeenCalledTimes(1);
    });

    it('should display empty state when no recent activity', () => {
        const mockData: DrillDownData = {
            type: 'user',
            id: 'user123',
            name: 'TestUser',
            details: {
                suspicionScore: 30,
                recentActivity: [],
            },
        };

        renderWithTheme(<DrillDownPanel data={mockData} onClose={() => {}} />);
        
        expect(screen.getByText('No recent activity available')).toBeInTheDocument();
    });

    it('should display recent activity when provided', () => {
        const mockData: DrillDownData = {
            type: 'user',
            id: 'user123',
            name: 'TestUser',
            details: {
                suspicionScore: 60,
                recentActivity: [
                    {
                        timestamp: new Date('2025-01-01T12:00:00Z').toISOString(),
                        action: 'Sent message',
                        channel: 'general',
                    },
                    {
                        timestamp: new Date('2025-01-01T11:00:00Z').toISOString(),
                        action: 'Joined voice channel',
                    },
                ],
            },
        };

        renderWithTheme(<DrillDownPanel data={mockData} onClose={() => {}} />);
        
        expect(screen.getByText('Recent Activity')).toBeInTheDocument();
        expect(screen.getByText('Sent message')).toBeInTheDocument();
        expect(screen.getByText('Joined voice channel')).toBeInTheDocument();
        expect(screen.getByText('in #general')).toBeInTheDocument();
    });
});
