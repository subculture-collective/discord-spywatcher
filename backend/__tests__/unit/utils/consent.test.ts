import { db } from '../../../src/db';
import {
    logConsent,
    getUserConsentLogs,
    getLatestConsent,
    hasConsent,
    ConsentType,
} from '../../../src/utils/consent';

// Mock the database
jest.mock('../../../src/db', () => ({
    db: {
        consentLog: {
            create: jest.fn(),
            findMany: jest.fn(),
            findFirst: jest.fn(),
        },
    },
}));

describe('Consent Logging', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('logConsent', () => {
        it('should log user consent', async () => {
            const mockConsent = {
                id: 'consent-1',
                userId: 'user-123',
                consentType: ConsentType.PRIVACY_POLICY,
                granted: true,
                version: '1.0',
                createdAt: new Date(),
            };

            (db.consentLog.create as jest.Mock).mockResolvedValue(mockConsent);

            await logConsent({
                userId: 'user-123',
                consentType: ConsentType.PRIVACY_POLICY,
                granted: true,
                version: '1.0',
            });

            expect(db.consentLog.create).toHaveBeenCalledWith({
                data: {
                    userId: 'user-123',
                    consentType: ConsentType.PRIVACY_POLICY,
                    granted: true,
                    version: '1.0',
                },
            });
        });

        it('should throw on failure', async () => {
            (db.consentLog.create as jest.Mock).mockRejectedValue(
                new Error('DB error')
            );

            await expect(
                logConsent({
                    userId: 'user-123',
                    consentType: ConsentType.PRIVACY_POLICY,
                    granted: true,
                    version: '1.0',
                })
            ).rejects.toThrow('DB error');
        });
    });

    describe('getUserConsentLogs', () => {
        it('should return consent logs for a user', async () => {
            const mockLogs = [
                {
                    id: 'consent-1',
                    consentType: ConsentType.PRIVACY_POLICY,
                    granted: true,
                    version: '1.0',
                    createdAt: new Date(),
                },
            ];

            (db.consentLog.findMany as jest.Mock).mockResolvedValue(mockLogs);

            const logs = await getUserConsentLogs('user-123');

            expect(db.consentLog.findMany).toHaveBeenCalledWith({
                where: { userId: 'user-123' },
                orderBy: { createdAt: 'desc' },
            });
            expect(logs).toEqual(mockLogs);
        });
    });

    describe('getLatestConsent', () => {
        it('should return the latest consent for a type', async () => {
            const mockConsent = {
                id: 'consent-1',
                consentType: ConsentType.PRIVACY_POLICY,
                granted: true,
                version: '1.0',
                createdAt: new Date(),
            };

            (db.consentLog.findFirst as jest.Mock).mockResolvedValue(
                mockConsent
            );

            const consent = await getLatestConsent(
                'user-123',
                ConsentType.PRIVACY_POLICY
            );

            expect(db.consentLog.findFirst).toHaveBeenCalledWith({
                where: {
                    userId: 'user-123',
                    consentType: ConsentType.PRIVACY_POLICY,
                },
                orderBy: { createdAt: 'desc' },
            });
            expect(consent).toEqual(mockConsent);
        });

        it('should return null if no consent found', async () => {
            (db.consentLog.findFirst as jest.Mock).mockResolvedValue(null);

            const consent = await getLatestConsent(
                'user-123',
                ConsentType.PRIVACY_POLICY
            );

            expect(consent).toBeNull();
        });
    });

    describe('hasConsent', () => {
        it('should return true if user has granted consent', async () => {
            (db.consentLog.findFirst as jest.Mock).mockResolvedValue({
                granted: true,
            });

            const result = await hasConsent(
                'user-123',
                ConsentType.PRIVACY_POLICY
            );

            expect(result).toBe(true);
        });

        it('should return false if user has revoked consent', async () => {
            (db.consentLog.findFirst as jest.Mock).mockResolvedValue({
                granted: false,
            });

            const result = await hasConsent(
                'user-123',
                ConsentType.PRIVACY_POLICY
            );

            expect(result).toBe(false);
        });

        it('should return false if no consent found', async () => {
            (db.consentLog.findFirst as jest.Mock).mockResolvedValue(null);

            const result = await hasConsent(
                'user-123',
                ConsentType.PRIVACY_POLICY
            );

            expect(result).toBe(false);
        });
    });
});
