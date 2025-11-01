import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';

import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';

describe('Card Components Accessibility', () => {
    it('should have no accessibility violations', async () => {
        const { container } = render(
            <Card>
                <CardHeader>
                    <CardTitle>Test Card</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>Card content goes here</p>
                </CardContent>
            </Card>
        );
        const results = await axe(container);
        expect(results.violations).toEqual([]);
    });

    it('should support different heading levels', async () => {
        const { container } = render(
            <Card>
                <CardHeader>
                    <CardTitle as="h3">Level 3 Heading</CardTitle>
                </CardHeader>
                <CardContent>Content</CardContent>
            </Card>
        );
        const results = await axe(container);
        expect(results.violations).toEqual([]);
    });

    it('should have proper heading hierarchy', () => {
        const { container } = render(
            <Card>
                <CardHeader>
                    <CardTitle as="h2">Main Title</CardTitle>
                </CardHeader>
                <CardContent>Content</CardContent>
            </Card>
        );
        const heading = container.querySelector('h2');
        expect(heading).toBeInTheDocument();
        expect(heading?.textContent).toBe('Main Title');
    });

    it('should support id attribute for aria-labelledby', () => {
        const { container } = render(
            <Card>
                <CardHeader>
                    <CardTitle id="card-title">Title with ID</CardTitle>
                </CardHeader>
                <CardContent>Content</CardContent>
            </Card>
        );
        const heading = container.querySelector('#card-title');
        expect(heading).toBeInTheDocument();
    });
});
