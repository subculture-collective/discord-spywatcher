import { Calendar, X } from 'lucide-react';

interface DateRangeFilterProps {
    startDate: string;
    endDate: string;
    onStartDateChange: (date: string) => void;
    onEndDateChange: (date: string) => void;
    onClear: () => void;
}

function DateRangeFilter({
    startDate,
    endDate,
    onStartDateChange,
    onEndDateChange,
    onClear,
}: DateRangeFilterProps) {
    const hasDateFilter = startDate || endDate;

    return (
        <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-600" />
                    <h3 className="text-sm font-semibold text-gray-700">
                        Date Range
                    </h3>
                </div>
                {hasDateFilter && (
                    <button
                        onClick={onClear}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                    >
                        <X className="h-3 w-3" />
                        Clear
                    </button>
                )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                    <label
                        htmlFor="startDate"
                        className="block text-xs text-gray-600 mb-1"
                    >
                        Start Date
                    </label>
                    <input
                        type="date"
                        id="startDate"
                        value={startDate}
                        onChange={(e) => onStartDateChange(e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                </div>
                <div>
                    <label
                        htmlFor="endDate"
                        className="block text-xs text-gray-600 mb-1"
                    >
                        End Date
                    </label>
                    <input
                        type="date"
                        id="endDate"
                        value={endDate}
                        onChange={(e) => onEndDateChange(e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                </div>
            </div>
        </div>
    );
}

export default DateRangeFilter;
