import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import InteractiveFilter from '../../../components/analytics/InteractiveFilter';

describe('InteractiveFilter Component', () => {
    it('should render filter button', () => {
        const handleFilterChange = vi.fn();
        render(<InteractiveFilter onFilterChange={handleFilterChange} />);
        
        expect(screen.getByText('Filters')).toBeInTheDocument();
    });

    it('should open filter panel when button is clicked', () => {
        const handleFilterChange = vi.fn();
        render(<InteractiveFilter onFilterChange={handleFilterChange} />);
        
        const button = screen.getByText('Filters');
        fireEvent.click(button);
        
        expect(screen.getByText('Filter Options')).toBeInTheDocument();
    });

    it('should call onFilterChange when suspicion range changes', () => {
        const handleFilterChange = vi.fn();
        render(<InteractiveFilter onFilterChange={handleFilterChange} />);
        
        // Open filter panel
        fireEvent.click(screen.getByText('Filters'));
        
        // Find and change suspicion min input
        const inputs = screen.getAllByRole('spinbutton');
        fireEvent.change(inputs[0], { target: { value: '10' } });
        
        expect(handleFilterChange).toHaveBeenCalled();
    });

    it('should reset filters when reset button is clicked', () => {
        const handleFilterChange = vi.fn();
        render(<InteractiveFilter onFilterChange={handleFilterChange} />);
        
        // Open filter panel
        fireEvent.click(screen.getByText('Filters'));
        
        // Change a filter value
        const inputs = screen.getAllByRole('spinbutton');
        fireEvent.change(inputs[0], { target: { value: '10' } });
        
        // Reset filters
        fireEvent.click(screen.getByText('Reset All Filters'));
        
        // Should call onFilterChange with default values
        expect(handleFilterChange).toHaveBeenCalledWith(
            expect.objectContaining({
                suspicionMin: 0,
                suspicionMax: 100,
                ghostMin: 0,
                ghostMax: 100,
            })
        );
    });

    it('should display active filter count', () => {
        const handleFilterChange = vi.fn();
        render(
            <InteractiveFilter
                onFilterChange={handleFilterChange}
                initialFilters={{ suspicionMin: 10 }}
            />
        );
        
        expect(screen.getByText('1')).toBeInTheDocument();
    });
});
