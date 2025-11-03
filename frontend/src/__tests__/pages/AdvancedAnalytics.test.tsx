import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import AdvancedAnalytics from '../../pages/AdvancedAnalytics';
import { ThemeProvider } from '../../contexts/ThemeContext';
import api from '../../lib/api';

vi.mock('../../lib/api');
vi.mock('../../hooks/useAnalytics', () => ({
    useAnalytics: () => ({
        trackFeatureUsage: vi.fn(),
    }),
}));

const renderWithProviders = (component: React.ReactElement) => {
    return render(
        <BrowserRouter>
            <ThemeProvider>
                {component}
            </ThemeProvider>
        </BrowserRouter>
    );
};

describe('AdvancedAnalytics Page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (api.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [] });
    });

    it('should render page title', async () => {
        renderWithProviders(<AdvancedAnalytics />);
        
        expect(screen.getByText('Advanced Analytics')).toBeInTheDocument();
        expect(screen.getByText('Interactive visualizations and deep insights')).toBeInTheDocument();
    });

    it('should render view toggle buttons', async () => {
        renderWithProviders(<AdvancedAnalytics />);
        
        expect(screen.getByText('Network Graph')).toBeInTheDocument();
        expect(screen.getByText('Sankey Flow')).toBeInTheDocument();
        expect(screen.getByText('Chord Diagram')).toBeInTheDocument();
    });

    it('should fetch data on mount', async () => {
        renderWithProviders(<AdvancedAnalytics />);
        
        await waitFor(() => {
            expect(api.get).toHaveBeenCalledWith('/heatmap', expect.any(Object));
            expect(api.get).toHaveBeenCalledWith('/suspicion', expect.any(Object));
        });
    });

    it('should display stats cards', async () => {
        renderWithProviders(<AdvancedAnalytics />);
        
        await waitFor(() => {
            expect(screen.getByText('Total Users')).toBeInTheDocument();
            expect(screen.getByText('Total Channels')).toBeInTheDocument();
            expect(screen.getByText('Interactions')).toBeInTheDocument();
            expect(screen.getByText('Filters Active')).toBeInTheDocument();
        });
    });
});
