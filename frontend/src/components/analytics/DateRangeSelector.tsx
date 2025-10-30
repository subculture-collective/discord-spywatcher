import { useState, useEffect } from 'react';

interface DateRangeSelectorProps {
    onRangeChange: (range: { start: Date; end: Date } | null) => void;
}

function DateRangeSelector({ onRangeChange }: DateRangeSelectorProps) {
    const [selectedRange, setSelectedRange] = useState<string>('7d');

    const handleRangeChange = (range: string) => {
        setSelectedRange(range);
        
        if (range === 'all') {
            onRangeChange(null);
            return;
        }

        const end = new Date();
        const start = new Date();

        switch (range) {
            case '24h':
                start.setHours(start.getHours() - 24);
                break;
            case '7d':
                start.setDate(start.getDate() - 7);
                break;
            case '30d':
                start.setDate(start.getDate() - 30);
                break;
            case '90d':
                start.setDate(start.getDate() - 90);
                break;
        }

        onRangeChange({ start, end });
    };

    // Initialize with default range on mount
    useEffect(() => {
        handleRangeChange('7d');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const ranges = [
        { value: '24h', label: 'Last 24 Hours' },
        { value: '7d', label: 'Last 7 Days' },
        { value: '30d', label: 'Last 30 Days' },
        { value: '90d', label: 'Last 90 Days' },
        { value: 'all', label: 'All Time' },
    ];

    return (
        <div className="flex flex-wrap gap-2">
            {ranges.map((range) => (
                <button
                    key={range.value}
                    onClick={() => handleRangeChange(range.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedRange === range.value
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                >
                    {range.label}
                </button>
            ))}
        </div>
    );
}

export default DateRangeSelector;
