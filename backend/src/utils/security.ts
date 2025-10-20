import crypto from 'crypto';

/**
 * Generate a cryptographically secure random secret
 * Used for JWT secrets, API keys, etc.
 *
 * @param length - Length in bytes (default: 32 bytes = 64 hex characters)
 * @returns Hex-encoded random string
 */
export const generateSecureSecret = (length: number = 32): string => {
    return crypto.randomBytes(length).toString('hex');
};

/**
 * Generate a cryptographically secure random token
 * Used for session tokens, CSRF tokens, etc.
 *
 * @param length - Length in bytes (default: 32)
 * @returns Base64-encoded random string
 */
export const generateSecureToken = (length: number = 32): string => {
    return crypto.randomBytes(length).toString('base64url');
};

/**
 * Hash a password or sensitive data using SHA-256
 * Note: For password hashing, use bcrypt or argon2 instead
 *
 * @param data - Data to hash
 * @returns SHA-256 hash
 */
export const hashData = (data: string): string => {
    return crypto.createHash('sha256').update(data).digest('hex');
};

/**
 * Verify HMAC signature for webhook validation
 *
 * @param payload - The payload to verify
 * @param signature - The signature to check against
 * @param secret - The secret key
 * @returns Whether the signature is valid
 */
export const verifyHmacSignature = (
    payload: string,
    signature: string,
    secret: string
): boolean => {
    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

    return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
    );
};

/**
 * Create HMAC signature for webhook validation
 *
 * @param payload - The payload to sign
 * @param secret - The secret key
 * @returns HMAC signature
 */
export const createHmacSignature = (
    payload: string,
    secret: string
): string => {
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
};

/**
 * Validate JWT secret strength
 * Ensures the secret meets minimum security requirements
 *
 * @param secret - The JWT secret to validate
 * @returns Whether the secret is strong enough
 */
export const isStrongSecret = (secret: string): boolean => {
    // Minimum 32 characters
    if (secret.length < 32) {
        return false;
    }

    // Check for complexity (mix of characters)
    const hasLowerCase = /[a-z]/.test(secret);
    const hasUpperCase = /[A-Z]/.test(secret);
    const hasNumbers = /\d/.test(secret);
    const hasSpecialChars = /[^a-zA-Z0-9]/.test(secret);

    // At least 3 of the 4 types
    const complexityCount =
        [hasLowerCase, hasUpperCase, hasNumbers, hasSpecialChars].filter(
            Boolean
        ).length;

    return complexityCount >= 3;
};
