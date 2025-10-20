import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

const permissions = [
    // Analytics permissions
    {
        name: 'analytics.view',
        description: 'View analytics data',
        category: 'analytics',
    },
    {
        name: 'analytics.export',
        description: 'Export analytics data',
        category: 'analytics',
    },
    // User management permissions
    {
        name: 'users.view',
        description: 'View user list',
        category: 'users',
    },
    {
        name: 'users.ban',
        description: 'Ban users',
        category: 'users',
    },
    {
        name: 'users.manage',
        description: 'Manage user roles and permissions',
        category: 'users',
    },
    // Guild permissions
    {
        name: 'guilds.view',
        description: 'View guild data',
        category: 'guilds',
    },
    {
        name: 'guilds.manage',
        description: 'Manage guild settings',
        category: 'guilds',
    },
    // Session management permissions
    {
        name: 'sessions.view.own',
        description: 'View own sessions',
        category: 'sessions',
    },
    {
        name: 'sessions.view.all',
        description: 'View all user sessions',
        category: 'sessions',
    },
    {
        name: 'sessions.revoke.own',
        description: 'Revoke own sessions',
        category: 'sessions',
    },
    {
        name: 'sessions.revoke.all',
        description: 'Revoke any user sessions',
        category: 'sessions',
    },
    // API key permissions
    {
        name: 'apikeys.create',
        description: 'Create API keys',
        category: 'apikeys',
    },
    {
        name: 'apikeys.view.own',
        description: 'View own API keys',
        category: 'apikeys',
    },
    {
        name: 'apikeys.revoke.own',
        description: 'Revoke own API keys',
        category: 'apikeys',
    },
    // System permissions
    {
        name: 'system.admin',
        description: 'Full system administration',
        category: 'system',
    },
];

const rolePermissions = {
    [Role.ADMIN]: [
        'analytics.view',
        'analytics.export',
        'users.view',
        'users.ban',
        'users.manage',
        'guilds.view',
        'guilds.manage',
        'sessions.view.own',
        'sessions.view.all',
        'sessions.revoke.own',
        'sessions.revoke.all',
        'apikeys.create',
        'apikeys.view.own',
        'apikeys.revoke.own',
        'system.admin',
    ],
    [Role.MODERATOR]: [
        'analytics.view',
        'users.view',
        'users.ban',
        'guilds.view',
        'sessions.view.own',
        'sessions.revoke.own',
        'apikeys.create',
        'apikeys.view.own',
        'apikeys.revoke.own',
    ],
    [Role.USER]: [
        'analytics.view',
        'guilds.view',
        'sessions.view.own',
        'sessions.revoke.own',
        'apikeys.create',
        'apikeys.view.own',
        'apikeys.revoke.own',
    ],
    [Role.BANNED]: [],
};

async function main() {
    console.log('🌱 Seeding permissions...');

    // Create permissions
    for (const permission of permissions) {
        await prisma.permission.upsert({
            where: { name: permission.name },
            update: permission,
            create: permission,
        });
    }

    console.log(
        `✅ Created/updated ${permissions.length} permissions`
    );

    // Assign permissions to roles
    for (const [role, permissionNames] of Object.entries(rolePermissions)) {
        for (const permissionName of permissionNames) {
            const permission = await prisma.permission.findUnique({
                where: { name: permissionName },
            });

            if (permission) {
                await prisma.rolePermission.upsert({
                    where: {
                        role_permissionId: {
                            role: role as Role,
                            permissionId: permission.id,
                        },
                    },
                    update: {},
                    create: {
                        role: role as Role,
                        permissionId: permission.id,
                    },
                });
            }
        }
    }

    console.log('✅ Assigned permissions to roles');
    console.log('🌱 Seeding complete!');
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
