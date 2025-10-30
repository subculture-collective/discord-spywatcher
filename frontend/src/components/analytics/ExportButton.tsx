interface ExportButtonProps {
    data: unknown[];
    filename: string;
    label?: string;
}

function ExportButton({ data, filename, label = 'Export CSV' }: ExportButtonProps) {
    const handleExport = () => {
        if (!data || data.length === 0) {
            alert('No data to export');
            return;
        }

        // Convert data to CSV
        const headers = Object.keys(data[0] as object);
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
