import {
    generateSecureSecret,
    generateSecureToken,
    hashData,
    verifyHmacSignature,
    createHmacSignature,
    isStrongSecret,
    sanitizeForLog,
} from '../../../src/utils/security';

describe('Security Utilities', () => {
    describe('generateSecureSecret', () => {
        it('should generate a secret of default length (64 hex chars)', () => {
            const secret = generateSecureSecret();
            expect(secret).toHaveLength(64); // 32 bytes = 64 hex chars
            expect(secret).toMatch(/^[0-9a-f]+$/);
        });

        it('should generate a secret of custom length', () => {
            const secret = generateSecureSecret(16);
            expect(secret).toHaveLength(32); // 16 bytes = 32 hex chars
        });

        it('should generate unique secrets', () => {
            const secret1 = generateSecureSecret();
            const secret2 = generateSecureSecret();
            expect(secret1).not.toBe(secret2);
        });
    });

    describe('generateSecureToken', () => {
        it('should generate a base64url token', () => {
            const token = generateSecureToken();
            expect(token.length).toBeGreaterThan(0);
            expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
        });

        it('should generate unique tokens', () => {
            const token1 = generateSecureToken();
            const token2 = generateSecureToken();
            expect(token1).not.toBe(token2);
        });
    });

    describe('hashData', () => {
        it('should generate consistent SHA-256 hash', () => {
            const data = 'test-data';
            const hash1 = hashData(data);
            const hash2 = hashData(data);
            expect(hash1).toBe(hash2);
            expect(hash1).toHaveLength(64); // SHA-256 = 64 hex chars
        });

        it('should generate different hashes for different data', () => {
            const hash1 = hashData('data1');
            const hash2 = hashData('data2');
            expect(hash1).not.toBe(hash2);
        });
    });

    describe('HMAC signature verification', () => {
        const secret = 'test-secret-key';
        const payload = 'test-payload-data';

        it('should create and verify valid HMAC signature', () => {
            const signature = createHmacSignature(payload, secret);
            expect(signature).toHaveLength(64); // SHA-256 HMAC
            expect(verifyHmacSignature(payload, signature, secret)).toBe(true);
        });

        it('should reject invalid signature', () => {
            const signature = createHmacSignature(payload, secret);
            const invalidSignature = signature.slice(0, -2) + 'xx';
            expect(
                verifyHmacSignature(payload, invalidSignature, secret)
            ).toBe(false);
        });

        it('should reject signature with wrong secret', () => {
            const signature = createHmacSignature(payload, secret);
            expect(
                verifyHmacSignature(payload, signature, 'wrong-secret')
            ).toBe(false);
        });

        it('should reject signature with modified payload', () => {
            const signature = createHmacSignature(payload, secret);
            expect(
                verifyHmacSignature('modified-payload', signature, secret)
            ).toBe(false);
        });
    });

    describe('isStrongSecret', () => {
        it('should accept strong secrets', () => {
            expect(
                isStrongSecret('aB3!xYz9SecureSecret123456789!@#')
            ).toBe(true);
            expect(
                isStrongSecret('ThisIsAVeryLongAndSecureSecret123!@#')
            ).toBe(true);
        });

        it('should reject secrets that are too short', () => {
            expect(isStrongSecret('short')).toBe(false);
            expect(isStrongSecret('12345678901234567890')).toBe(false); // 20 chars
        });

        it('should reject secrets without enough complexity', () => {
            expect(isStrongSecret('a'.repeat(32))).toBe(false); // Only lowercase
            expect(isStrongSecret('1'.repeat(32))).toBe(false); // Only numbers
        });

        it('should accept secrets with 3+ character types', () => {
            expect(isStrongSecret('a'.repeat(20) + 'A'.repeat(10) + '123')).toBe(
                true
            ); // lowercase, uppercase, numbers
            expect(
                isStrongSecret('a'.repeat(20) + '1'.repeat(10) + '!!!')
            ).toBe(true); // lowercase, numbers, special
        });
    });

    describe('sanitizeForLog', () => {
        it('should handle normal strings without changes', () => {
            expect(sanitizeForLog('normal text')).toBe('normal text');
            expect(sanitizeForLog('IP: 192.168.1.1')).toBe('IP: 192.168.1.1');
        });

        it('should escape newline characters', () => {
            expect(sanitizeForLog('line1\nline2')).toBe('line1\\nline2');
            expect(sanitizeForLog('text\n\nmore')).toBe('text\\n\\nmore');
        });

        it('should escape carriage return characters', () => {
            expect(sanitizeForLog('line1\rline2')).toBe('line1\\rline2');
            expect(sanitizeForLog('text\r\nmore')).toBe('text\\r\\nmore');
        });

        it('should escape tab characters', () => {
            expect(sanitizeForLog('col1\tcol2')).toBe('col1\\tcol2');
        });

        it('should escape other control characters', () => {
            expect(sanitizeForLog('text\x00null')).toBe('text\\x00null');
            expect(sanitizeForLog('text\x1besc')).toBe('text\\x1besc');
            expect(sanitizeForLog('text\x7fdel')).toBe('text\\x7fdel');
        });

        it('should prevent log injection attacks', () => {
            const maliciousInput = 'innocent\n[ERROR] Fake log entry';
            expect(sanitizeForLog(maliciousInput)).toBe(
                'innocent\\n[ERROR] Fake log entry'
            );
        });

        it('should handle null and undefined', () => {
            expect(sanitizeForLog(null)).toBe('null');
            expect(sanitizeForLog(undefined)).toBe('undefined');
        });

        it('should convert non-string types to strings', () => {
            expect(sanitizeForLog(123)).toBe('123');
            expect(sanitizeForLog(true)).toBe('true');
            expect(sanitizeForLog(false)).toBe('false');
        });

        it('should handle objects by converting to string', () => {
            const obj = { key: 'value' };
            const result = sanitizeForLog(obj);
            expect(result).toContain('key');
            expect(result).not.toContain('\n');
        });
    });
});
