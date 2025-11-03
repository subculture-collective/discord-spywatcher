/**
 * Type definitions for vis-network components
 * These extend the base vis-network types with our specific data structures
 */

import { Node, Edge } from 'vis-network/standalone';

export interface NetworkNode extends Partial<Node> {
    id: string;
    label: string;
    group?: string;
    value?: number;
    title?: string;
}

export interface NetworkEdge extends Partial<Edge> {
    from: string;
    to: string;
    value?: number;
    title?: string;
}
