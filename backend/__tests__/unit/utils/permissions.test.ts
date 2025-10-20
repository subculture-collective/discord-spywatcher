import { Role } from '@prisma/client';

import { db } from '../../../src/db';
import {
    checkUserPermission,
    checkUserRole,
    getRolePermissions,
    getUserPermissions,
    checkGuildAccess,
} from '../../../src/utils/permissions';

jest.mock('../../../src/db', () => ({
    db: {
        user: {
            findUnique: jest.fn(),
        },
        rolePermission: {
            findFirst: jest.fn(),
            findMany: jest.fn(),
        },
        guild: {
            findFirst: jest.fn(),
        },
    },
}));

describe('Permissions Utils', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('checkUserPermission', () => {
        it('should return true if user has the permission', async () => {
            (db.user.findUnique as jest.Mock).mockResolvedValue({
                role: Role.ADMIN,
            });

            (db.rolePermission.findFirst as jest.Mock).mockResolvedValue({
                role: Role.ADMIN,
                permissionId: 'perm-1',
            });

            const result = await checkUserPermission(
                'user-1',
                'analytics.view'
            );
            expect(result).toBe(true);
        });

        it('should return false if user does not have the permission', async () => {
            (db.user.findUnique as jest.Mock).mockResolvedValue({
                role: Role.USER,
            });

            (db.rolePermission.findFirst as jest.Mock).mockResolvedValue(null);

            const result = await checkUserPermission(
                'user-1',
                'users.ban'
            );
            expect(result).toBe(false);
        });

        it('should return false if user is banned', async () => {
            (db.user.findUnique as jest.Mock).mockResolvedValue({
                role: Role.BANNED,
            });

            const result = await checkUserPermission(
                'user-1',
                'analytics.view'
            );
            expect(result).toBe(false);
        });

        it('should return false if user not found', async () => {
            (db.user.findUnique as jest.Mock).mockResolvedValue(null);

            const result = await checkUserPermission(
                'user-1',
                'analytics.view'
            );
            expect(result).toBe(false);
        });
    });

    describe('checkUserRole', () => {
        it('should return true if user has allowed role', () => {
            const result = checkUserRole(Role.ADMIN, [
                Role.ADMIN,
                Role.MODERATOR,
            ]);
            expect(result).toBe(true);
        });

        it('should return false if user does not have allowed role', () => {
            const result = checkUserRole(Role.USER, [
                Role.ADMIN,
                Role.MODERATOR,
            ]);
            expect(result).toBe(false);
        });
    });

    describe('getRolePermissions', () => {
        it('should return permissions for a role', async () => {
            (db.rolePermission.findMany as jest.Mock).mockResolvedValue([
                { permission: { name: 'analytics.view' } },
                { permission: { name: 'users.view' } },
            ]);

            const result = await getRolePermissions(Role.ADMIN);
            expect(result).toEqual(['analytics.view', 'users.view']);
        });
    });

    describe('getUserPermissions', () => {
        it('should return permissions for a user', async () => {
            (db.user.findUnique as jest.Mock).mockResolvedValue({
                role: Role.MODERATOR,
            });

            (db.rolePermission.findMany as jest.Mock).mockResolvedValue([
                { permission: { name: 'analytics.view' } },
                { permission: { name: 'users.ban' } },
            ]);

            const result = await getUserPermissions('user-1');
            expect(result).toEqual(['analytics.view', 'users.ban']);
        });

        it('should return empty array for banned user', async () => {
            (db.user.findUnique as jest.Mock).mockResolvedValue({
                role: Role.BANNED,
            });

            const result = await getUserPermissions('user-1');
            expect(result).toEqual([]);
        });
    });

    describe('checkGuildAccess', () => {
        it('should return true if user has access to guild', async () => {
            (db.guild.findFirst as jest.Mock).mockResolvedValue({
                id: 'guild-1',
                guildId: '123',
                userId: 'user-1',
            });

            const result = await checkGuildAccess('user-1', '123');
            expect(result).toBe(true);
        });

        it('should return false if user does not have access to guild', async () => {
            (db.guild.findFirst as jest.Mock).mockResolvedValue(null);

            const result = await checkGuildAccess('user-1', '123');
            expect(result).toBe(false);
        });
    });
});
