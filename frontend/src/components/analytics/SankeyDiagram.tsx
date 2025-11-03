import * as d3 from 'd3';
import { sankey, sankeyLinkHorizontal } from 'd3-sankey';
import type { SankeyNode, SankeyLink } from 'd3-sankey';
import { useEffect, useRef } from 'react';

interface SankeyData {
    nodes: Array<{ name: string; category?: string }>;
    links: Array<{ source: number; target: number; value: number }>;
}

interface SankeyDiagramProps {
    data: {
        userId: string;
        username: string;
        channelId?: string;
        channel?: string;
        count?: number;
        suspicionScore?: number;
    }[];
    width?: number;
    height?: number;
}

function SankeyDiagram({ data, width = 800, height = 500 }: SankeyDiagramProps) {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (!svgRef.current || data.length === 0) return;

        // Clear previous content
        d3.select(svgRef.current).selectAll('*').remove();

        // Prepare Sankey data
        const nodes: Array<{ name: string; category?: string }> = [];
        const links: Array<{ source: number; target: number; value: number }> = [];
        const nodeMap = new Map<string, number>();

        // Create nodes for users and channels
        data.forEach((item) => {
            const userId = `user-${item.userId}`;
            const channelId = item.channelId ? `channel-${item.channelId}` : null;

            // Add user node
            if (!nodeMap.has(userId)) {
                nodeMap.set(userId, nodes.length);
                nodes.push({ name: item.username || 'Unknown', category: 'user' });
            }

            // Add channel node
            if (channelId && item.channel && !nodeMap.has(channelId)) {
                nodeMap.set(channelId, nodes.length);
                nodes.push({ name: item.channel, category: 'channel' });
            }

            // Add link
            if (channelId) {
                links.push({
                    source: nodeMap.get(userId)!,
                    target: nodeMap.get(channelId)!,
                    value: item.count || 1,
                });
            }
        });

        const sankeyData: SankeyData = { nodes, links };

        // Set up dimensions
        const margin = { top: 10, right: 10, bottom: 10, left: 10 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        // Create SVG
        const svg = d3
            .select(svgRef.current)
            .attr('width', width)
            .attr('height', height)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Create Sankey generator
        // eslint-disable-next-line @typescript-eslint/no-empty-object-type
        const sankeyGenerator = sankey<SankeyNode<{ name: string; category?: string }, {}>, SankeyLink<SankeyNode<{ name: string; category?: string }, {}>, {}>>()
            .nodeWidth(15)
            .nodePadding(10)
            .extent([
                [0, 0],
                [innerWidth, innerHeight],
            ]);

        // Generate Sankey layout
        const { nodes: sankeyNodes, links: sankeyLinks } = sankeyGenerator(
            sankeyData as Parameters<typeof sankeyGenerator>[0]
        );

        // Color scale
        const colorScale = d3.scaleOrdinal<string>()
            .domain(['user', 'channel'])
            .range(['#89b4fa', '#a6e3a1']);

        // Draw links
        svg.append('g')
            .attr('class', 'links')
            .selectAll('path')
            .data(sankeyLinks)
            .join('path')
            .attr('d', sankeyLinkHorizontal())
            .attr('stroke', (d: any) => colorScale((d.source as any).category || 'user'))
            .attr('stroke-width', (d: any) => Math.max(1, d.width))
            .attr('fill', 'none')
            .attr('opacity', 0.5)
            .append('title')
            .text((d: any) => `${(d.source as any).name} → ${(d.target as any).name}\n${d.value} interactions`);

        // Draw nodes
        const node = svg
            .append('g')
            .attr('class', 'nodes')
            .selectAll('rect')
            .data(sankeyNodes)
            .join('rect')
            .attr('x', (d: any) => d.x0)
            .attr('y', (d: any) => d.y0)
            .attr('height', (d: any) => d.y1 - d.y0)
            .attr('width', (d: any) => d.x1 - d.x0)
            .attr('fill', (d: any) => colorScale(d.category || 'user'))
            .attr('stroke', '#1e1e2e')
            .attr('stroke-width', 1);

        // Add node labels
        svg.append('g')
            .attr('class', 'labels')
            .selectAll('text')
            .data(sankeyNodes)
            .join('text')
            .attr('x', (d: any) => (d.x0 < innerWidth / 2 ? d.x1 + 6 : d.x0 - 6))
            .attr('y', (d: any) => (d.y1 + d.y0) / 2)
            .attr('dy', '0.35em')
            .attr('text-anchor', (d: any) => (d.x0 < innerWidth / 2 ? 'start' : 'end'))
            .attr('font-size', '10px')
            .attr('fill', '#cdd6f4')
            .text((d: any) => d.name.length > 15 ? d.name.substring(0, 15) + '...' : d.name);

        // Add tooltips
        node.append('title')
            .text((d: any) => `${d.name}\n${d.value} total interactions`);

    }, [data, width, height]);

    if (data.length === 0) {
        return (
            <div
                className="flex items-center justify-center bg-ctp-surface0 rounded-lg"
                style={{ width: `${width}px`, height: `${height}px` }}
            >
                <p className="text-ctp-subtext0">No flow data available</p>
            </div>
        );
    }

    return (
        <div className="overflow-auto bg-ctp-surface0 rounded-lg p-4">
            <svg ref={svgRef} />
        </div>
    );
}

export default SankeyDiagram;
