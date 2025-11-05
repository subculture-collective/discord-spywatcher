import { Download } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

interface ExportButtonProps {
    events: Array<{
        id: string;
        type: string;
        userId: string;
        username: string;
        timestamp: string;
        metadata: Record<string, unknown>;
        isAnomalous?: boolean;
        anomalyReason?: string;
    }>;
    username: string;
    disabled?: boolean;
}

// Helper function to validate string arrays
const isStringArray = (arr: unknown): arr is string[] => {
    return Array.isArray(arr) && arr.every((item): item is string => typeof item === 'string');
};

function ExportButton({ events, username, disabled = false }: ExportButtonProps) {
    const [isExporting, setIsExporting] = useState(false);

    const exportToJSON = () => {
        try {
            setIsExporting(true);
            const dataStr = JSON.stringify(events, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `timeline-${username}-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            URL.revokeObjectURL(url);
            toast.success('Timeline exported successfully');
        } catch (error) {
            console.error('Export failed:', error);
            toast.error('Failed to export timeline');
        } finally {
            setIsExporting(false);
        }
    };

    const exportToCSV = () => {
        try {
            setIsExporting(true);
            const headers = ['Timestamp', 'Type', 'Username', 'Description', 'Anomalous'];
            const rows = events.map((event) => {
                let description = '';
                switch (event.type) {
                    case 'presence':
                        description = `Clients: ${
                            isStringArray(event.metadata.clients)
                                ? event.metadata.clients.join(', ')
                                : 'Unknown'
                        }`;
                        break;
                    case 'message':
                        description = `#${event.metadata.channel || 'unknown'}: ${event.metadata.content || ''}`;
                        break;
                    case 'typing':
                        description = `in #${event.metadata.channel || 'unknown'}`;
                        break;
                    case 'role':
                        description = `Added roles: ${
                            isStringArray(event.metadata.addedRoles)
                                ? event.metadata.addedRoles.join(', ')
                                : 'Unknown'
                        }`;
                        break;
                    case 'join':
                        description = `Account age: ${event.metadata.accountAgeDays || 'Unknown'} days`;
                        break;
                    case 'deleted_message':
                        description = `from #${event.metadata.channel || 'unknown'}`;
                        break;
                }

                return [
                    new Date(event.timestamp).toLocaleString(),
                    event.type,
                    event.username,
                    description.replace(/"/g, '""'), // Escape quotes
                    event.isAnomalous ? 'Yes' : 'No',
                ].map((field) => `"${field}"`).join(',');
            });

            const csv = [headers.join(','), ...rows].join('\n');
            const dataBlob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `timeline-${username}-${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
            URL.revokeObjectURL(url);
            toast.success('Timeline exported successfully');
        } catch (error) {
            console.error('Export failed:', error);
            toast.error('Failed to export timeline');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="relative group">
            <button
                disabled={disabled || isExporting || events.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
                <Download className="h-4 w-4" />
                <span>{isExporting ? 'Exporting...' : 'Export'}</span>
            </button>

            {/* Dropdown menu */}
            {!disabled && !isExporting && events.length > 0 && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
                    <button
                        onClick={exportToJSON}
                        className="block w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700 rounded-t-lg"
                    >
                        Export as JSON
                    </button>
                    <button
                        onClick={exportToCSV}
                        className="block w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700 rounded-b-lg"
                    >
                        Export as CSV
                    </button>
                </div>
            )}
        </div>
    );
}

export default ExportButton;
