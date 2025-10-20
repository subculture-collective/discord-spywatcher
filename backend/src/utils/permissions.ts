import { Role } from '@prisma/client';

import { db } from '../db';

/**
 * Check if a user has a specific permission
 */
export async function checkUserPermission(
    userId: string,
    permissionName: string
): Promise<boolean> {
    const user = await db.user.findUnique({
        where: { id: userId },
        select: { role: true },
    });

    if (!user) {
        return false;
    }

    // Banned users have no permissions
    if (user.role === 'BANNED') {
        return false;
    }

    // Check if the user's role has the permission
    const rolePermission = await db.rolePermission.findFirst({
        where: {
            role: user.role,
            permission: {
                name: permissionName,
            },
        },
    });

    return rolePermission !== null;
}

/**
 * Check if a user has any of the specified roles
 */
export function checkUserRole(userRole: Role, allowedRoles: Role[]): boolean {
    return allowedRoles.includes(userRole);
}

/**
 * Get all permissions for a role
 */
export async function getRolePermissions(role: Role): Promise<string[]> {
    const rolePermissions = await db.rolePermission.findMany({
        where: { role },
        include: { permission: true },
    });

    return rolePermissions.map((rp) => rp.permission.name);
}

/**
 * Get all permissions for a user
 */
export async function getUserPermissions(userId: string): Promise<string[]> {
    const user = await db.user.findUnique({
        where: { id: userId },
        select: { role: true },
    });

    if (!user || user.role === 'BANNED') {
        return [];
    }

    return getRolePermissions(user.role);
}

/**
 * Check if a user has access to a specific guild
 */
export async function checkGuildAccess(
    userId: string,
    guildId: string
): Promise<boolean> {
    const guild = await db.guild.findFirst({
        where: {
            guildId,
            userId,
        },
    });

    return guild !== null;
}
