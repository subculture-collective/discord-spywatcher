import { useEffect, useRef, useState } from 'react';
import { DataSet, Network } from 'vis-network/standalone';

interface NetworkNode {
    id: string;
    label: string;
    group?: string;
    value?: number;
    title?: string;
}

interface NetworkEdge {
    from: string;
    to: string;
    value?: number;
    title?: string;
}

interface NetworkGraphProps {
    data: {
        userId: string;
        username: string;
        channelId?: string;
        channel?: string;
        suspicionScore?: number;
        ghostScore?: number;
        interactions?: number;
    }[];
    height?: number;
}

function NetworkGraph({ data, height = 500 }: NetworkGraphProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const networkRef = useRef<Network | null>(null);
    const [selectedNode, setSelectedNode] = useState<string | null>(null);

    useEffect(() => {
        if (!containerRef.current || data.length === 0) return;

        // Create nodes and edges from data
        const nodes: NetworkNode[] = [];
        const edges: NetworkEdge[] = [];
        const processedUsers = new Set<string>();
        const processedChannels = new Set<string>();

        data.forEach((item) => {
            // Add user node
            if (!processedUsers.has(item.userId)) {
                nodes.push({
                    id: `user-${item.userId}`,
                    label: item.username || 'Unknown',
                    group: 'user',
                    value: (item.suspicionScore || 0) + (item.ghostScore || 0),
                    title: `${item.username}\nSuspicion: ${item.suspicionScore || 0}\nGhost: ${item.ghostScore || 0}`,
                });
                processedUsers.add(item.userId);
            }

            // Add channel node if present
            if (item.channelId && item.channel && !processedChannels.has(item.channelId)) {
                nodes.push({
                    id: `channel-${item.channelId}`,
                    label: item.channel.length > 20 ? item.channel.substring(0, 20) + '...' : item.channel,
                    group: 'channel',
                    value: 10,
                    title: item.channel,
                });
                processedChannels.add(item.channelId);
            }

            // Add edge between user and channel
            if (item.channelId) {
                edges.push({
                    from: `user-${item.userId}`,
                    to: `channel-${item.channelId}`,
                    value: item.interactions || 1,
                    title: `${item.interactions || 1} interactions`,
                });
            }
        });

        // Create datasets
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const nodesDataSet = new DataSet(nodes as any);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const edgesDataSet = new DataSet(edges as any);

        // Network options
        const options = {
            nodes: {
                shape: 'dot',
                scaling: {
                    min: 10,
                    max: 30,
                },
                font: {
                    size: 12,
                    color: '#cdd6f4',
                },
            },
            edges: {
                width: 0.15,
                color: { inherit: 'from' },
                smooth: {
                    enabled: true,
                    type: 'continuous',
                    roundness: 0.5,
                },
            },
            groups: {
                user: {
                    color: {
                        background: '#89b4fa',
                        border: '#74c7ec',
                        highlight: { background: '#74c7ec', border: '#89dceb' },
                    },
                },
                channel: {
                    color: {
                        background: '#a6e3a1',
                        border: '#94e2d5',
                        highlight: { background: '#94e2d5', border: '#89dceb' },
                    },
                },
            },
            physics: {
                stabilization: { iterations: 200 },
                barnesHut: {
                    gravitationalConstant: -2000,
                    springConstant: 0.001,
                    springLength: 200,
                },
            },
            interaction: {
                hover: true,
                tooltipDelay: 100,
            },
        };

        // Create network
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const network = new Network(
            containerRef.current,
            { nodes: nodesDataSet as any, edges: edgesDataSet as any },
            options
        );

        networkRef.current = network;

        // Add click listener
        network.on('click', (params) => {
            if (params.nodes.length > 0) {
                setSelectedNode(params.nodes[0]);
            } else {
                setSelectedNode(null);
            }
        });

        // Cleanup
        return () => {
            network.destroy();
        };
    }, [data]);

    if (data.length === 0) {
        return (
            <div
                className="flex items-center justify-center bg-ctp-surface0 rounded-lg"
                style={{ height: `${height}px` }}
            >
                <p className="text-ctp-subtext0">No network data available</p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <div
                ref={containerRef}
                className="bg-ctp-surface0 rounded-lg"
                style={{ height: `${height}px` }}
            />
            {selectedNode && (
                <div className="text-sm text-ctp-subtext0 p-2 bg-ctp-surface0 rounded">
                    Selected: {selectedNode}
                </div>
            )}
        </div>
    );
}

export default NetworkGraph;
