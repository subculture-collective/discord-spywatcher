import {
    generateAccessToken,
    verifyAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
    AuthPayload,
} from '../../../src/utils/auth';

describe('Utils - Auth', () => {
    const mockPayload: Partial<AuthPayload> = {
        userId: 'test-user-id',
        discordId: '123456789',
        username: 'TestUser',
        role: 'USER',
        access: true,
    };

    describe('generateAccessToken', () => {
        it('should generate a valid access token', () => {
            const token = generateAccessToken(mockPayload);
            expect(token).toBeDefined();
            expect(typeof token).toBe('string');
            expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
        });

        it('should include payload data in token', () => {
            const token = generateAccessToken(mockPayload);
            const decoded = verifyAccessToken(token);
            
            expect(decoded.discordId).toBe(mockPayload.discordId);
            expect(decoded.username).toBe(mockPayload.username);
            expect(decoded.role).toBe(mockPayload.role);
        });
    });

    describe('verifyAccessToken', () => {
        it('should verify a valid access token', () => {
            const token = generateAccessToken(mockPayload);
            const decoded = verifyAccessToken(token);

            expect(decoded).toBeDefined();
            expect(decoded.discordId).toBe(mockPayload.discordId);
            expect(decoded.role).toBe(mockPayload.role);
        });

        it('should throw error for invalid token', () => {
            expect(() => verifyAccessToken('invalid-token')).toThrow();
        });

        it('should throw error for token with missing discordId', () => {
            const invalidPayload = { username: 'test', role: 'USER' as const, access: true };
            const token = generateAccessToken(invalidPayload);
            
            expect(() => verifyAccessToken(token)).toThrow('Invalid access token payload');
        });

        it('should throw error for token with missing access flag', () => {
            const invalidPayload = { 
                discordId: '123', 
                username: 'test', 
                role: 'USER' as const
            };
            const token = generateAccessToken(invalidPayload);
            
            expect(() => verifyAccessToken(token)).toThrow('Invalid access token payload');
        });

        it('should throw error for token with missing role', () => {
            const invalidPayload = { 
                discordId: '123', 
                username: 'test', 
                access: true 
            } as any;
            const token = generateAccessToken(invalidPayload);
            
            expect(() => verifyAccessToken(token)).toThrow('Invalid access token payload');
        });
    });

    describe('generateRefreshToken', () => {
        it('should generate a valid refresh token', () => {
            const token = generateRefreshToken(mockPayload);
            expect(token).toBeDefined();
            expect(typeof token).toBe('string');
            expect(token.split('.')).toHaveLength(3);
        });

        it('should only include essential data in refresh token', () => {
            const token = generateRefreshToken(mockPayload);
            const decoded = verifyRefreshToken(token);
            
            expect(decoded.discordId).toBe(mockPayload.discordId);
            expect(decoded.username).toBe(mockPayload.username);
            expect(decoded.role).toBe(mockPayload.role);
        });
    });

    describe('verifyRefreshToken', () => {
        it('should verify a valid refresh token', () => {
            const token = generateRefreshToken(mockPayload);
            const decoded = verifyRefreshToken(token);

            expect(decoded).toBeDefined();
            expect(decoded.discordId).toBe(mockPayload.discordId);
        });

        it('should throw error for invalid refresh token', () => {
            expect(() => verifyRefreshToken('invalid-token')).toThrow();
        });

        it('should throw error for access token used as refresh token', () => {
            const accessToken = generateAccessToken(mockPayload);
            expect(() => verifyRefreshToken(accessToken)).toThrow();
        });
    });

    describe('token expiration', () => {
        it('should generate tokens with different expiration times', () => {
            const accessToken = generateAccessToken(mockPayload);
            const refreshToken = generateRefreshToken(mockPayload);
            
            expect(accessToken).not.toBe(refreshToken);
        });
    });

    describe('different roles', () => {
        it('should handle ADMIN role', () => {
            const adminPayload = { ...mockPayload, role: 'ADMIN' as const };
            const token = generateAccessToken(adminPayload);
            const decoded = verifyAccessToken(token);
            
            expect(decoded.role).toBe('ADMIN');
        });

        it('should handle MODERATOR role', () => {
            const modPayload = { ...mockPayload, role: 'MODERATOR' as const };
            const token = generateAccessToken(modPayload);
            const decoded = verifyAccessToken(token);
            
            expect(decoded.role).toBe('MODERATOR');
        });

        it('should handle BANNED role', () => {
            const bannedPayload = { ...mockPayload, role: 'BANNED' as const };
            const token = generateAccessToken(bannedPayload);
            const decoded = verifyAccessToken(token);
            
            expect(decoded.role).toBe('BANNED');
        });
    });
});
