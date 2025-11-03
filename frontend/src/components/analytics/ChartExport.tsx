import html2canvas from 'html2canvas';
import { Download } from 'lucide-react';
import toast from 'react-hot-toast';

import { Button } from '../ui/Button';

interface ChartExportProps {
    elementId: string;
    filename?: string;
    buttonText?: string;
}

function ChartExport({ elementId, filename = 'chart', buttonText = 'Export' }: ChartExportProps) {
    const handleExport = async () => {
        const element = document.getElementById(elementId);
        
        if (!element) {
            toast.error('Chart element not found');
            return;
        }

        try {
            // Create canvas from element
            const canvas = await html2canvas(element, {
                backgroundColor: '#1e1e2e',
                scale: 2, // Higher quality
                logging: false,
            });

            // Convert to blob and download
            canvas.toBlob((blob) => {
                if (!blob) {
                    toast.error('Failed to generate image');
                    return;
                }

                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `${filename}-${new Date().toISOString().split('T')[0]}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);

                toast.success('Chart exported successfully');
            });
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Failed to export chart');
        }
    };

    return (
        <Button onClick={handleExport} variant="secondary" size="sm">
            <Download className="w-4 h-4 mr-2" />
            {buttonText}
        </Button>
    );
}

export default ChartExport;
