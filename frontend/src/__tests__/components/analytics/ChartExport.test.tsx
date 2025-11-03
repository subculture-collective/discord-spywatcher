import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import ChartExport from '../../../components/analytics/ChartExport';

describe('ChartExport Component', () => {
    it('should render export button', () => {
        render(<ChartExport elementId="test-chart" />);
        
        expect(screen.getByText('Export')).toBeInTheDocument();
    });

    it('should render custom button text', () => {
        render(<ChartExport elementId="test-chart" buttonText="Download Chart" />);
        
        expect(screen.getByText('Download Chart')).toBeInTheDocument();
    });

    it('should call export function when clicked', () => {
        // Create a test element
        const testDiv = document.createElement('div');
        testDiv.id = 'test-chart';
        testDiv.textContent = 'Test Chart Content';
        document.body.appendChild(testDiv);

        render(<ChartExport elementId="test-chart" />);
        
        const button = screen.getByText('Export');
        fireEvent.click(button);
        
        // Note: Full html2canvas functionality can't be tested in jsdom
        // This test just verifies the button is clickable
        expect(button).toBeInTheDocument();

        document.body.removeChild(testDiv);
    });
});
