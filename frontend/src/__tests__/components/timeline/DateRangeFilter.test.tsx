import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import DateRangeFilter from '../../../components/timeline/DateRangeFilter';

describe('DateRangeFilter Component', () => {
    it('should render start and end date inputs', () => {
        const handleStartDateChange = vi.fn();
        const handleEndDateChange = vi.fn();
        const handleClear = vi.fn();
        
        render(
            <DateRangeFilter
                startDate=""
                endDate=""
                onStartDateChange={handleStartDateChange}
                onEndDateChange={handleEndDateChange}
                onClear={handleClear}
            />
        );
        
        expect(screen.getByLabelText('Start Date')).toBeInTheDocument();
        expect(screen.getByLabelText('End Date')).toBeInTheDocument();
    });

    it('should display initial date values', () => {
        const handleStartDateChange = vi.fn();
        const handleEndDateChange = vi.fn();
        const handleClear = vi.fn();
        
        render(
            <DateRangeFilter
                startDate="2024-01-01"
                endDate="2024-01-31"
                onStartDateChange={handleStartDateChange}
                onEndDateChange={handleEndDateChange}
                onClear={handleClear}
            />
        );
        
        const startInput = screen.getByLabelText('Start Date') as HTMLInputElement;
        const endInput = screen.getByLabelText('End Date') as HTMLInputElement;
        
        expect(startInput.value).toBe('2024-01-01');
        expect(endInput.value).toBe('2024-01-31');
    });

    it('should call onStartDateChange when start date is changed', () => {
        const handleStartDateChange = vi.fn();
        const handleEndDateChange = vi.fn();
        const handleClear = vi.fn();
        
        render(
            <DateRangeFilter
                startDate=""
                endDate=""
                onStartDateChange={handleStartDateChange}
                onEndDateChange={handleEndDateChange}
                onClear={handleClear}
            />
        );
        
        const startInput = screen.getByLabelText('Start Date');
        fireEvent.change(startInput, { target: { value: '2024-01-01' } });
        
        expect(handleStartDateChange).toHaveBeenCalledWith('2024-01-01');
    });

    it('should call onEndDateChange when end date is changed', () => {
        const handleStartDateChange = vi.fn();
        const handleEndDateChange = vi.fn();
        const handleClear = vi.fn();
        
        render(
            <DateRangeFilter
                startDate=""
                endDate=""
                onStartDateChange={handleStartDateChange}
                onEndDateChange={handleEndDateChange}
                onClear={handleClear}
            />
        );
        
        const endInput = screen.getByLabelText('End Date');
        fireEvent.change(endInput, { target: { value: '2024-01-31' } });
        
        expect(handleEndDateChange).toHaveBeenCalledWith('2024-01-31');
    });

    it('should show clear button when date filter is applied', () => {
        const handleStartDateChange = vi.fn();
        const handleEndDateChange = vi.fn();
        const handleClear = vi.fn();
        
        render(
            <DateRangeFilter
                startDate="2024-01-01"
                endDate=""
                onStartDateChange={handleStartDateChange}
                onEndDateChange={handleEndDateChange}
                onClear={handleClear}
            />
        );
        
        const clearButton = screen.getByText('Clear');
        expect(clearButton).toBeInTheDocument();
    });

    it('should not show clear button when no date filter is applied', () => {
        const handleStartDateChange = vi.fn();
        const handleEndDateChange = vi.fn();
        const handleClear = vi.fn();
        
        render(
            <DateRangeFilter
                startDate=""
                endDate=""
                onStartDateChange={handleStartDateChange}
                onEndDateChange={handleEndDateChange}
                onClear={handleClear}
            />
        );
        
        const clearButton = screen.queryByText('Clear');
        expect(clearButton).not.toBeInTheDocument();
    });

    it('should call onClear when clear button is clicked', () => {
        const handleStartDateChange = vi.fn();
        const handleEndDateChange = vi.fn();
        const handleClear = vi.fn();
        
        render(
            <DateRangeFilter
                startDate="2024-01-01"
                endDate="2024-01-31"
                onStartDateChange={handleStartDateChange}
                onEndDateChange={handleEndDateChange}
                onClear={handleClear}
            />
        );
        
        const clearButton = screen.getByText('Clear');
        fireEvent.click(clearButton);
        
        expect(handleClear).toHaveBeenCalledTimes(1);
    });

    it('should render Date Range header', () => {
        const handleStartDateChange = vi.fn();
        const handleEndDateChange = vi.fn();
        const handleClear = vi.fn();
        
        render(
            <DateRangeFilter
                startDate=""
                endDate=""
                onStartDateChange={handleStartDateChange}
                onEndDateChange={handleEndDateChange}
                onClear={handleClear}
            />
        );
        
        expect(screen.getByText('Date Range')).toBeInTheDocument();
    });
});
