import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import ExportButton from '../../../components/timeline/ExportButton';

// Mock toast
vi.mock('react-hot-toast', () => ({
    default: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

describe('ExportButton Component', () => {
    const mockEvents = [
        {
            id: '1',
            type: 'message',
            userId: 'user1',
            username: 'Test User',
            timestamp: '2024-01-01T12:00:00Z',
            metadata: {
                channel: 'general',
                content: 'Test message',
            },
        },
        {
            id: '2',
            type: 'presence',
            userId: 'user1',
            username: 'Test User',
            timestamp: '2024-01-01T13:00:00Z',
            metadata: {
                clients: ['web', 'mobile'],
            },
            isAnomalous: true,
            anomalyReason: 'Test reason',
        },
    ];

    it('should render export button with text', () => {
        const { container } = render(<ExportButton events={mockEvents} username="TestUser" />);
        
        expect(screen.getByText('Export')).toBeInTheDocument();
        expect(container.querySelector('button')).toBeInTheDocument();
    });

    it('should disable button when disabled prop is true', () => {
        const { container } = render(<ExportButton events={mockEvents} username="TestUser" disabled />);
        
        const button = container.querySelector('button');
        expect(button).toBeDisabled();
    });

    it('should disable button when events array is empty', () => {
        const { container } = render(<ExportButton events={[]} username="TestUser" />);
        
        const button = container.querySelector('button');
        expect(button).toBeDisabled();
    });

    it('should enable button when events are present and not disabled', () => {
        const { container } = render(<ExportButton events={mockEvents} username="TestUser" />);
        
        const button = container.querySelector('button');
        expect(button).not.toBeDisabled();
    });

    it('should show dropdown menu options when rendered', () => {
        render(<ExportButton events={mockEvents} username="TestUser" />);
        
        // Dropdown should contain export options
        const jsonButton = screen.getByText('Export as JSON');
        const csvButton = screen.getByText('Export as CSV');
        
        expect(jsonButton).toBeInTheDocument();
        expect(csvButton).toBeInTheDocument();
    });
});
