import { Request, Response, NextFunction } from 'express';

import {
    validateRequest,
    authSchemas,
    sanitizeString,
    isValidDiscordId,
    isValidDiscordToken,
} from '../../../src/middleware/validation';

describe('Validation Middleware', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
        mockReq = {
            body: {},
            query: {},
            params: {},
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
        mockNext = jest.fn();
    });

    describe('validateRequest', () => {
        it('should pass validation with valid data', () => {
            mockReq.query = { code: 'valid-auth-code' };

            const middleware = validateRequest(authSchemas.discordCallback);
            middleware(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
        });

        it('should reject invalid data', () => {
            mockReq.query = {}; // Missing required 'code'

            const middleware = validateRequest(authSchemas.discordCallback);
            middleware(mockReq as Request, mockRes as Response, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: 'Invalid request data',
                    details: expect.any(Array),
                })
            );
            expect(mockNext).not.toHaveBeenCalled();
        });
    });

    describe('authSchemas', () => {
        describe('updateRole', () => {
            it('should validate valid role update', () => {
                const data = {
                    params: { discordId: '12345678901234567' },
                    body: { role: 'ADMIN' },
                };

                const result = authSchemas.updateRole.safeParse(data);
                expect(result.success).toBe(true);
            });

            it('should reject invalid Discord ID', () => {
                const data = {
                    params: { discordId: 'invalid' },
                    body: { role: 'ADMIN' },
                };

                const result = authSchemas.updateRole.safeParse(data);
                expect(result.success).toBe(false);
            });

            it('should reject invalid role', () => {
                const data = {
                    params: { discordId: '12345678901234567' },
                    body: { role: 'INVALID_ROLE' },
                };

                const result = authSchemas.updateRole.safeParse(data);
                expect(result.success).toBe(false);
            });
        });
    });

    describe('sanitizeString', () => {
        it('should remove angle brackets', () => {
            expect(sanitizeString('<script>alert("xss")</script>')).toBe(
                'scriptalert("xss")/script'
            );
        });

        it('should remove javascript: protocol', () => {
            expect(sanitizeString('javascript:alert("xss")')).toBe(
                'alert("xss")'
            );
        });

        it('should remove event handlers', () => {
            expect(sanitizeString('onclick=alert("xss")')).toBe(
                'alert("xss")'
            );
        });

        it('should trim whitespace', () => {
            expect(sanitizeString('  hello  ')).toBe('hello');
        });
    });

    describe('isValidDiscordId', () => {
        it('should validate correct Discord IDs', () => {
            expect(isValidDiscordId('12345678901234567')).toBe(true); // 17 digits
            expect(isValidDiscordId('123456789012345678')).toBe(true); // 18 digits
            expect(isValidDiscordId('1234567890123456789')).toBe(true); // 19 digits
        });

        it('should reject invalid Discord IDs', () => {
            expect(isValidDiscordId('123')).toBe(false); // Too short
            expect(isValidDiscordId('12345678901234567890')).toBe(false); // Too long
            expect(isValidDiscordId('abc123')).toBe(false); // Contains letters
            expect(isValidDiscordId('')).toBe(false); // Empty
        });
    });

    describe('isValidDiscordToken', () => {
        it('should validate correct Discord token format', () => {
            const validToken = 'a'.repeat(50);
            expect(isValidDiscordToken(validToken)).toBe(true);
        });

        it('should reject invalid Discord tokens', () => {
            expect(isValidDiscordToken('short')).toBe(false); // Too short
            expect(isValidDiscordToken('a'.repeat(50) + '!')).toBe(false); // Invalid chars
        });
    });
});
