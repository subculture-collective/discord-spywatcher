interface SkeletonProps {
    className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
    return (
        <div className={`animate-pulse bg-gray-300 dark:bg-surface-light rounded ${className}`} />
    );
}

export function CardSkeleton() {
    return (
        <div className="bg-white dark:bg-surface rounded-lg p-6 shadow-lg border border-gray-200 dark:border-surface-light">
            <div className="flex items-start justify-between">
                <div className="flex-1 space-y-3">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-8 w-1/2" />
                    <Skeleton className="h-3 w-1/4" />
                </div>
                <Skeleton className="h-12 w-12 rounded-full" />
            </div>
        </div>
    );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
    return (
        <div className="space-y-2">
            {Array.from({ length: rows }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
            ))}
        </div>
    );
}

export function ChartSkeleton() {
    return (
        <div className="bg-white dark:bg-surface rounded-lg p-6 shadow-lg border border-gray-200 dark:border-surface-light">
            <Skeleton className="h-6 w-1/3 mb-4" />
            <Skeleton className="h-64 w-full" />
        </div>
    );
}
