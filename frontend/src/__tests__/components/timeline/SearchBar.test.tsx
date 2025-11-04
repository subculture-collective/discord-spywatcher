import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import SearchBar from '../../../components/timeline/SearchBar';

describe('SearchBar Component', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should render search input with placeholder', () => {
        const handleChange = vi.fn();
        render(<SearchBar value="" onChange={handleChange} />);
        
        const input = screen.getByPlaceholderText('Search events...');
        expect(input).toBeInTheDocument();
    });

    it('should render with custom placeholder', () => {
        const handleChange = vi.fn();
        render(
            <SearchBar
                value=""
                onChange={handleChange}
                placeholder="Custom placeholder"
            />
        );
        
        const input = screen.getByPlaceholderText('Custom placeholder');
        expect(input).toBeInTheDocument();
    });

    it('should display initial value', () => {
        const handleChange = vi.fn();
        render(<SearchBar value="test query" onChange={handleChange} />);
        
        const input = screen.getByDisplayValue('test query');
        expect(input).toBeInTheDocument();
    });

    it('should debounce onChange calls', async () => {
        const handleChange = vi.fn();
        render(<SearchBar value="" onChange={handleChange} />);
        
        const input = screen.getByPlaceholderText('Search events...');
        
        // Type multiple characters quickly
        fireEvent.change(input, { target: { value: 'test' } });
        
        // onChange should not be called immediately
        expect(handleChange).not.toHaveBeenCalled();
        
        // Fast-forward time by 300ms (debounce delay)
        await vi.advanceTimersByTimeAsync(300);
        
        // Now onChange should be called once
        expect(handleChange).toHaveBeenCalledTimes(1);
        expect(handleChange).toHaveBeenCalledWith('test');
    });

    it('should show clear button when value is not empty', () => {
        const handleChange = vi.fn();
        render(<SearchBar value="test" onChange={handleChange} />);
        
        const clearButton = screen.getByRole('button');
        expect(clearButton).toBeInTheDocument();
    });

    it('should not show clear button when value is empty', () => {
        const handleChange = vi.fn();
        render(<SearchBar value="" onChange={handleChange} />);
        
        const clearButton = screen.queryByRole('button');
        expect(clearButton).not.toBeInTheDocument();
    });

    it('should clear input when clear button is clicked', async () => {
        const handleChange = vi.fn();
        const { rerender } = render(<SearchBar value="test" onChange={handleChange} />);
        
        const clearButton = screen.getByRole('button');
        fireEvent.click(clearButton);
        
        // Verify onChange was called with empty string immediately (no debounce for clear)
        expect(handleChange).toHaveBeenCalledWith('');
        
        // Rerender with empty value
        rerender(<SearchBar value="" onChange={handleChange} />);
        
        const input = screen.getByPlaceholderText('Search events...');
        expect(input).toHaveValue('');
    });

    it('should update local value on input change', () => {
        const handleChange = vi.fn();
        render(<SearchBar value="" onChange={handleChange} />);
        
        const input = screen.getByPlaceholderText('Search events...') as HTMLInputElement;
        
        fireEvent.change(input, { target: { value: 'new value' } });
        
        expect(input.value).toBe('new value');
    });
});
