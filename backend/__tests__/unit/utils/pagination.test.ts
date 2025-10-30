import {
    parsePaginationParams,
    calculateSkip,
    buildPaginationMetadata,
    buildPaginationResult,
    buildCursorPaginationResult,
    getPrismaPaginationArgs,
    getPrismaCursorPaginationArgs,
    DEFAULT_PAGE_SIZE,
    MAX_PAGE_SIZE,
} from '../../../src/utils/pagination';

describe('Pagination Utilities', () => {
    describe('parsePaginationParams', () => {
        it('should parse valid pagination parameters', () => {
            const result = parsePaginationParams({
                page: '2',
                limit: '25',
            });

            expect(result.page).toBe(2);
            expect(result.limit).toBe(25);
        });

        it('should use default values for missing parameters', () => {
            const result = parsePaginationParams({});

            expect(result.page).toBe(1);
            expect(result.limit).toBe(DEFAULT_PAGE_SIZE);
        });

        it('should enforce minimum page of 1', () => {
            const result = parsePaginationParams({ page: '0' });
            expect(result.page).toBe(1);

            const result2 = parsePaginationParams({ page: '-5' });
            expect(result2.page).toBe(1);
        });

        it('should enforce maximum limit', () => {
            const result = parsePaginationParams({ limit: '200' });
            expect(result.limit).toBe(MAX_PAGE_SIZE);
        });

        it('should enforce minimum limit of 1', () => {
            const result = parsePaginationParams({ limit: '0' });
            expect(result.limit).toBe(1);

            const result2 = parsePaginationParams({ limit: '-10' });
            expect(result2.limit).toBe(1);
        });

        it('should handle invalid numeric strings', () => {
            const result = parsePaginationParams({
                page: 'invalid',
                limit: 'bad',
            });

            expect(result.page).toBe(1);
            expect(result.limit).toBe(DEFAULT_PAGE_SIZE);
        });

        it('should parse cursor parameter', () => {
            const result = parsePaginationParams({
                cursor: 'abc123',
            });

            expect(result.cursor).toBe('abc123');
        });
    });

    describe('calculateSkip', () => {
        it('should calculate correct skip value', () => {
            expect(calculateSkip(1, 10)).toBe(0);
            expect(calculateSkip(2, 10)).toBe(10);
            expect(calculateSkip(3, 25)).toBe(50);
            expect(calculateSkip(5, 50)).toBe(200);
        });
    });

    describe('buildPaginationMetadata', () => {
        it('should build correct metadata for first page', () => {
            const metadata = buildPaginationMetadata(100, 1, 10);

            expect(metadata.total).toBe(100);
            expect(metadata.page).toBe(1);
            expect(metadata.limit).toBe(10);
            expect(metadata.totalPages).toBe(10);
            expect(metadata.hasNextPage).toBe(true);
            expect(metadata.hasPreviousPage).toBe(false);
        });

        it('should build correct metadata for middle page', () => {
            const metadata = buildPaginationMetadata(100, 5, 10);

            expect(metadata.hasNextPage).toBe(true);
            expect(metadata.hasPreviousPage).toBe(true);
        });

        it('should build correct metadata for last page', () => {
            const metadata = buildPaginationMetadata(100, 10, 10);

            expect(metadata.hasNextPage).toBe(false);
            expect(metadata.hasPreviousPage).toBe(true);
        });

        it('should handle non-exact division of total by limit', () => {
            const metadata = buildPaginationMetadata(95, 1, 10);

            expect(metadata.totalPages).toBe(10);
            expect(metadata.hasNextPage).toBe(true);
        });

        it('should handle single page of results', () => {
            const metadata = buildPaginationMetadata(5, 1, 10);

            expect(metadata.totalPages).toBe(1);
            expect(metadata.hasNextPage).toBe(false);
            expect(metadata.hasPreviousPage).toBe(false);
        });
    });

    describe('buildPaginationResult', () => {
        it('should build complete pagination result', () => {
            const data = [{ id: 1 }, { id: 2 }, { id: 3 }];
            const result = buildPaginationResult(data, 100, 1, 10);

            expect(result.data).toBe(data);
            expect(result.pagination.total).toBe(100);
            expect(result.pagination.page).toBe(1);
            expect(result.pagination.limit).toBe(10);
            expect(result.pagination.totalPages).toBe(10);
        });
    });

    describe('buildCursorPaginationResult', () => {
        const getCursor = (item: { id: string }) => item.id;

        it('should indicate next page when data exceeds limit', () => {
            const data = [
                { id: '1' },
                { id: '2' },
                { id: '3' },
                { id: '4' },
            ];
            const result = buildCursorPaginationResult(data, 3, getCursor);

            expect(result.data).toHaveLength(3);
            expect(result.pagination.hasNextPage).toBe(true);
            expect(result.pagination.nextCursor).toBe('3');
        });

        it('should indicate no next page when data equals limit', () => {
            const data = [{ id: '1' }, { id: '2' }, { id: '3' }];
            const result = buildCursorPaginationResult(data, 3, getCursor);

            expect(result.data).toHaveLength(3);
            expect(result.pagination.hasNextPage).toBe(false);
            expect(result.pagination.nextCursor).toBeNull();
        });

        it('should indicate no next page when data is less than limit', () => {
            const data = [{ id: '1' }, { id: '2' }];
            const result = buildCursorPaginationResult(data, 3, getCursor);

            expect(result.data).toHaveLength(2);
            expect(result.pagination.hasNextPage).toBe(false);
            expect(result.pagination.nextCursor).toBeNull();
        });

        it('should handle empty data', () => {
            const data: { id: string }[] = [];
            const result = buildCursorPaginationResult(data, 10, getCursor);

            expect(result.data).toHaveLength(0);
            expect(result.pagination.hasNextPage).toBe(false);
            expect(result.pagination.nextCursor).toBeNull();
        });
    });

    describe('getPrismaPaginationArgs', () => {
        it('should return correct Prisma pagination arguments', () => {
            const args = getPrismaPaginationArgs(1, 10);
            expect(args.skip).toBe(0);
            expect(args.take).toBe(10);

            const args2 = getPrismaPaginationArgs(3, 25);
            expect(args2.skip).toBe(50);
            expect(args2.take).toBe(25);
        });
    });

    describe('getPrismaCursorPaginationArgs', () => {
        it('should return args without cursor for first page', () => {
            const args = getPrismaCursorPaginationArgs(10);
            expect(args.take).toBe(11); // limit + 1
            expect(args.skip).toBeUndefined();
            expect(args.cursor).toBeUndefined();
        });

        it('should return args with cursor for subsequent pages', () => {
            const args = getPrismaCursorPaginationArgs(10, 'abc123');
            expect(args.take).toBe(11);
            expect(args.skip).toBe(1);
            expect(args.cursor).toEqual({ id: 'abc123' });
        });
    });
});
