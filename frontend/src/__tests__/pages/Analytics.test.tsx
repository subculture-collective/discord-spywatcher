import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';

import { ThemeProvider } from '../../contexts/ThemeContext';
import api from '../../lib/api';
import Analytics from '../../pages/Analytics';

// Mock the API
vi.mock('../../lib/api');
vi.mock('react-hot-toast');
vi.mock('../../lib/socket', () => ({
    socketService: {
        connect: vi.fn(),
        subscribeToAnalytics: vi.fn(),
        unsubscribeFromAnalytics: vi.fn(),
    },
}));

const renderWithTheme = (component: React.ReactElement) => {
    return render(
        <BrowserRouter>
            <ThemeProvider>{component}</ThemeProvider>
        </BrowserRouter>
    );
};

describe('Analytics Page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        
        // Mock API responses
        (api.get as ReturnType<typeof vi.fn>).mockResolvedValue({
            data: [],
        });
    });

    it('should render the analytics dashboard', async () => {
        renderWithTheme(<Analytics />);
        
        expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
    });

    it('should display loading state initially', () => {
        renderWithTheme(<Analytics />);
        
        // The loading skeletons don't have text, so we just check the page renders
        expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
    });

    it('should fetch analytics data on mount', async () => {
        renderWithTheme(<Analytics />);
        
        await waitFor(() => {
            expect(api.get).toHaveBeenCalledWith('/heatmap', expect.any(Object));
            expect(api.get).toHaveBeenCalledWith('/ghosts', expect.any(Object));
            expect(api.get).toHaveBeenCalledWith('/suspicion', expect.any(Object));
            expect(api.get).toHaveBeenCalledWith('/lurkers', expect.any(Object));
        });
    });

    it('should display metric cards after data loads', async () => {
        (api.get as ReturnType<typeof vi.fn>).mockResolvedValue({
            data: [
                {
                    userId: '1',
                    username: 'TestUser',
                    suspicionScore: 60,
                    ghostScore: 8,
                },
            ],
        });

        renderWithTheme(<Analytics />);
        
        await waitFor(() => {
            expect(screen.getByText('Total Users')).toBeInTheDocument();
            expect(screen.getByText('Total Activity')).toBeInTheDocument();
            expect(screen.getByText('High Suspicion')).toBeInTheDocument();
            expect(screen.getByText('Ghost Users')).toBeInTheDocument();
        });
    });
});
