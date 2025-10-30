import toast from 'react-hot-toast';

interface ExportButtonProps {
    data: unknown[];
    filename: string;
    label?: string;
}

function ExportButton({ data, filename, label = 'Export CSV' }: ExportButtonProps) {
    const handleExport = () => {
        if (!data || data.length === 0) {
            toast.error('No data to export');
            return;
        }

        // Convert data to CSV
        // Collect all unique keys from all objects in data
        const headerSet = new Set<string>();
        data.forEach((row) => {
            Object.keys(row as object).forEach((key) => headerSet.add(key));
        });
        const headers = Array.from(headerSet);
        const csvContent = [
            headers.join(','),
            ...data.map((row) =>
                headers
                    .map((header) => {
                        const value = (row as Record<string, unknown>)[header];
                        // Escape values that contain commas or quotes
                        const stringValue = String(value ?? '');
                        if (stringValue.includes(',') || stringValue.includes('"')) {
                            return `"${stringValue.replace(/"/g, '""')}"`;
                        }
                        return stringValue;
                    })
                    .join(',')
            ),
        ].join('\n');

        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up the URL object to prevent memory leaks
        URL.revokeObjectURL(url);
        
        toast.success('Data exported successfully');
    };

    return (
        <button
            onClick={handleExport}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
            {label}
        </button>
    );
}

export default ExportButton;
