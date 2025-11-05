import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

function SearchBar({ value, onChange, placeholder = 'Search events...' }: SearchBarProps) {
    const [localValue, setLocalValue] = useState(value);
    const onChangeRef = useRef(onChange);

    // Keep ref up to date
    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            onChangeRef.current(localValue);
        }, 300);

        return () => clearTimeout(timer);
    }, [localValue]);

    const handleClear = () => {
        setLocalValue('');
        onChange('');
    };

    return (
        <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
                type="text"
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
                placeholder={placeholder}
                className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
            {localValue && (
                <button
                    onClick={handleClear}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-700"
                >
                    <X className="h-5 w-5 text-gray-400" />
                </button>
            )}
        </div>
    );
}

export default SearchBar;
