/**
 * Pagination utilities for consistent pagination across API endpoints
 */

export interface PaginationParams {
    page?: number;
    limit?: number;
    cursor?: string;
}

export interface PaginationResult<T> {
    data: T[];
    pagination: {
        total?: number;
        page?: number;
        limit?: number;
        totalPages?: number;
        hasNextPage?: boolean;
        hasPreviousPage?: boolean;
        nextCursor?: string | null;
        prevCursor?: string | null;
    };
}

/**
 * Default pagination limits
 */
export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 100;

/**
 * Parse and validate pagination parameters from query string
 */
export function parsePaginationParams(query: {
    page?: string;
    limit?: string;
    cursor?: string;
}): PaginationParams {
    const page = query.page ? Math.max(1, parseInt(query.page, 10)) : 1;
    const limit = query.limit
        ? Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(query.limit, 10)))
        : DEFAULT_PAGE_SIZE;
    const cursor = query.cursor;

    return {
        page: isNaN(page) ? 1 : page,
        limit: isNaN(limit) ? DEFAULT_PAGE_SIZE : limit,
        cursor,
    };
}

/**
 * Calculate skip value for offset-based pagination
 */
export function calculateSkip(page: number, limit: number): number {
    return (page - 1) * limit;
}

/**
 * Build pagination metadata for offset-based pagination
 */
export function buildPaginationMetadata(
    total: number,
    page: number,
    limit: number
) {
    const totalPages = Math.ceil(total / limit);

    return {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
    };
}

/**
 * Build pagination result with metadata
 */
export function buildPaginationResult<T>(
    data: T[],
    total: number,
    page: number,
    limit: number
): PaginationResult<T> {
    return {
        data,
        pagination: buildPaginationMetadata(total, page, limit),
    };
}

/**
 * Build cursor-based pagination result
 * For cursor-based pagination, we don't need total count which can be expensive
 */
export function buildCursorPaginationResult<T>(
    data: T[],
    limit: number,
    getCursor: (item: T) => string
): PaginationResult<T> {
    const hasNextPage = data.length > limit;
    const items = hasNextPage ? data.slice(0, limit) : data;

    return {
        data: items,
        pagination: {
            limit,
            hasNextPage,
            nextCursor:
                hasNextPage && items.length > 0
                    ? getCursor(items[items.length - 1])
                    : null,
            prevCursor: null, // Can be implemented if needed
        },
    };
}

/**
 * Prisma pagination helper for offset-based pagination
 */
export function getPrismaPaginationArgs(page: number, limit: number) {
    return {
        skip: calculateSkip(page, limit),
        take: limit,
    };
}

/**
 * Prisma pagination helper for cursor-based pagination
 * Fetches limit + 1 to determine if there's a next page
 */
export function getPrismaCursorPaginationArgs(limit: number, cursor?: string) {
    return {
        take: limit + 1, // Fetch one extra to check for next page
        ...(cursor && {
            skip: 1, // Skip the cursor item itself
            cursor: { id: cursor },
        }),
    };
}
