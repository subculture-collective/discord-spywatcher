import * as d3 from 'd3';
import { useEffect, useRef } from 'react';

interface ChordDiagramProps {
    data: {
        userId: string;
        username: string;
        channelId?: string;
        channel?: string;
        count?: number;
    }[];
    width?: number;
    height?: number;
}

function ChordDiagram({ data, width = 600, height = 600 }: ChordDiagramProps) {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (!svgRef.current || data.length === 0) return;

        // Clear previous content
        d3.select(svgRef.current).selectAll('*').remove();

        // Prepare data - create interaction matrix
        const entities = new Map<string, number>();
        const entityNames: string[] = [];

        // Collect all unique entities (users and channels)
        data.forEach((item) => {
            const userKey = `${item.username}`;
            const channelKey = item.channel ? `#${item.channel}` : null;

            if (!entities.has(userKey)) {
                entities.set(userKey, entityNames.length);
                entityNames.push(userKey);
            }
            if (channelKey && !entities.has(channelKey)) {
                entities.set(channelKey, entityNames.length);
                entityNames.push(channelKey);
            }
        });

        // Create matrix
        const matrix: number[][] = Array(entityNames.length)
            .fill(0)
            .map(() => Array(entityNames.length).fill(0));

        // Fill matrix with interaction counts
        data.forEach((item) => {
            const userIdx = entities.get(`${item.username}`)!;
            const channelIdx = item.channel ? entities.get(`#${item.channel}`) : null;

            if (channelIdx !== null && channelIdx !== undefined) {
                matrix[userIdx][channelIdx] += item.count || 1;
                matrix[channelIdx][userIdx] += item.count || 1;
            }
        });

        // Set up dimensions
        const outerRadius = Math.min(width, height) * 0.5 - 60;
        const innerRadius = outerRadius - 20;

        // Create SVG
        const svg = d3
            .select(svgRef.current)
            .attr('width', width)
            .attr('height', height)
            .append('g')
            .attr('transform', `translate(${width / 2},${height / 2})`);

        // Create chord layout
        const chord = d3.chord()
            .padAngle(0.05)
            .sortSubgroups(d3.descending);

        const chords = chord(matrix);

        // Color scale
        const color = d3.scaleOrdinal()
            .domain(d3.range(entityNames.length).map(String))
            .range([
                '#89b4fa', '#74c7ec', '#89dceb', '#94e2d5', '#a6e3a1',
                '#f9e2af', '#fab387', '#eba0ac', '#f38ba8', '#cba6f7'
            ]);

        // Draw the outer arc (groups)
        const group = svg
            .append('g')
            .selectAll('g')
            .data(chords.groups)
            .join('g');

        group
            .append('path')
            .attr('fill', (d) => color(d.index.toString()) as string)
            .attr('stroke', '#1e1e2e')
            .attr('d', d3.arc<d3.ChordGroup>()
                .innerRadius(innerRadius)
                .outerRadius(outerRadius)
            );

        // Add labels
        group
            .append('text')
            .each((d: d3.ChordGroup & { angle?: number }) => { d.angle = (d.startAngle + d.endAngle) / 2; })
            .attr('dy', '.35em')
            .attr('transform', (d: d3.ChordGroup & { angle?: number }) => `
                rotate(${((d.angle || 0) * 180 / Math.PI - 90)})
                translate(${outerRadius + 10})
                ${(d.angle || 0) > Math.PI ? 'rotate(180)' : ''}
            `)
            .attr('text-anchor', (d: d3.ChordGroup & { angle?: number }) => (d.angle || 0) > Math.PI ? 'end' : 'start')
            .attr('font-size', '10px')
            .attr('fill', '#cdd6f4')
            .text((d) => {
                const name = entityNames[d.index];
                return name.length > 12 ? name.substring(0, 12) + '...' : name;
            });

        // Draw the chords (ribbons)
        const ribbon = d3.ribbon<d3.Chord, d3.ChordSubgroup>()
            .radius(innerRadius);

        svg
            .append('g')
            .attr('fill-opacity', 0.67)
            .selectAll('path')
            .data(chords)
            .join('path')
            .attr('d', ribbon)
            .attr('fill', (d) => color(d.source.index.toString()) as string)
            .attr('stroke', '#1e1e2e')
            .style('mix-blend-mode', 'multiply')
            .append('title')
            .text((d) => 
                `${entityNames[d.source.index]} ↔ ${entityNames[d.target.index]}\n${d.source.value} interactions`
            );

    }, [data, width, height]);

    if (data.length === 0) {
        return (
            <div
                className="flex items-center justify-center bg-ctp-surface0 rounded-lg"
                style={{ width: `${width}px`, height: `${height}px` }}
            >
                <p className="text-ctp-subtext0">No interaction data available</p>
            </div>
        );
    }

    return (
        <div className="flex justify-center bg-ctp-surface0 rounded-lg p-4">
            <svg ref={svgRef} />
        </div>
    );
}

export default ChordDiagram;
