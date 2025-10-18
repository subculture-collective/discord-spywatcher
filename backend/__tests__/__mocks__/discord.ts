// Mock Discord API responses

export const mockDiscordUser = {
    id: '123456789',
    username: 'testuser',
    discriminator: '0001',
    avatar: 'avatar_hash',
    email: 'test@example.com',
    verified: true,
    locale: 'en-US',
};

export const mockDiscordGuilds = [
    {
        id: 'guild-123',
        name: 'Test Guild',
        icon: 'icon_hash',
        owner: true,
        permissions: '2147483647',
    },
    {
        id: 'guild-456',
        name: 'Another Guild',
        icon: null,
        owner: false,
        permissions: '0',
    },
];

export const mockDiscordTokenResponse = {
    access_token: 'mock_access_token',
    token_type: 'Bearer',
    expires_in: 604800,
    refresh_token: 'mock_refresh_token',
    scope: 'identify email guilds',
};

export const mockDiscordMember = {
    user: mockDiscordUser,
    nick: 'Test Nickname',
    roles: ['role-1', 'role-2'],
    joined_at: '2020-01-01T00:00:00.000Z',
    premium_since: null,
    deaf: false,
    mute: false,
};
