/* eslint-disable @typescript-eslint/no-misused-promises, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any, @typescript-eslint/no-floating-promises */
import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';

import {
    getChannelDiversity,
    getChannelHeatmap,
    getGhostScores,
    getMultiClientLoginCounts,
    getSuspicionScores,
} from './analytics';
import { db } from './db';
import { cacheInvalidation } from './services/cacheInvalidation';
import { env } from './utils/env';
import { sanitizeForLog } from './utils/security';

dotenv.config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageTyping,
    ],
});

client.on('presenceUpdate', async (oldPresence, newPresence) => {
    const user = newPresence?.user;
    const clientStatus = newPresence?.clientStatus;
    const guildId = newPresence?.guild?.id;

    if (!user || !clientStatus || !guildId) return;

    const platforms = Object.keys(clientStatus); // desktop, mobile, web

    if (platforms.length > 1) {
        console.log(
            `[⚠️ MULTI-CLIENT] ${sanitizeForLog(user.username)} is online on: ${platforms
                .map(sanitizeForLog)
                .join(', ')}`
        );
        await db.presenceEvent.create({
            data: {
                userId: user.id,
                username: user.username,
                clients: platforms,
            },
        });

        // Emit WebSocket event for multi-client detection
        const { websocketService } = await import('./services/websocket');
        websocketService.emitMultiClientAlert(guildId, {
            userId: user.id,
            username: user.username,
            platforms,
            timestamp: new Date(),
        });
    }
});

client.on('typingStart', async (typing) => {
    const { user, channel, guild } = typing;
    if (!user || !channel || !guild || user.bot) return;

    if (!channel.isTextBased()) return;

    // Get the most recent message in this channel from a different user
    const lastMsg = await db.messageEvent.findFirst({
        where: {
            channelId: channel.id,
            guildId: guild.id,
            NOT: {
                userId: user.id, // ignore if same user
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
    });

    if (!lastMsg) return;

    const deltaMs = Date.now() - new Date(lastMsg.createdAt).getTime();

    if (deltaMs < 5000) {
        console.log(
            `[⏱️ DB CORRELATED] ${sanitizeForLog(user.username)} started typing ${deltaMs}ms after ${sanitizeForLog(
                lastMsg.username
            )} in #${sanitizeForLog('name' in channel ? channel.name : 'unknown')}`
        );

        // Save for long-term analysis
        await db.reactionTime.create({
            data: {
                observerId: user.id,
                observerName: user.username ?? user.id,
                actorId: lastMsg.userId,
                actorName: lastMsg.username,
                channelId: channel.id,
                guildId: guild.id,
                deltaMs,
            },
        });
    }
});

client.on('messageCreate', async (message) => {
    // Ignore bots and DMs
    if (message.author.bot || !message.guild) return;

    const channelName =
        'name' in message.channel && message.channel.name
            ? message.channel.name
            : 'unknown';

    await db.messageEvent.create({
        data: {
            userId: message.author.id,
            username: message.author.username ?? message.author.id,
            channelId: message.channel.id,
            channel: channelName,
            guildId: message.guild.id,
            content: message.content.slice(0, 1000), // limit content length for now
        },
    });

    // Invalidate analytics caches after message creation
    await cacheInvalidation.onMessageCreated(message.guild.id);

    // Emit WebSocket event for new message
    const { websocketService } = await import('./services/websocket');
    websocketService.emitNewMessage(message.guild.id, {
        userId: message.author.id,
        username: message.author.username ?? message.author.id,
        channelId: message.channel.id,
        channelName,
        timestamp: new Date(),
    });

    // Broadcast throttled analytics update
    const { analyticsBroadcaster } = await import(
        './services/analyticsBroadcaster'
    );
    analyticsBroadcaster.broadcastAnalyticsUpdate(message.guild.id);

    console.log(
        `[💬 MESSAGE] ${sanitizeForLog(message.author.username)} in #${sanitizeForLog(channelName)}: ${sanitizeForLog(message.content)}`
    );
});

client.on('guildMemberAdd', async (member) => {
    const accountCreated = member.user.createdAt.getTime();
    const now = Date.now();
    const accountAgeDays = Math.floor(
        (now - accountCreated) / (1000 * 60 * 60 * 24)
    );

    await db.joinEvent.create({
        data: {
            userId: member.user.id,
            username: member.user.username ?? member.user.id,
            guildId: member.guild.id,
            accountAgeDays,
        },
    });

    // Emit WebSocket event for user join
    const { websocketService } = await import('./services/websocket');
    websocketService.emitUserJoin(member.guild.id, {
        userId: member.user.id,
        username: member.user.username ?? member.user.id,
        accountAgeDays,
        timestamp: new Date(),
    });

    console.log(
        `[🟢 JOIN] ${sanitizeForLog(member.user.username)} (account age: ${accountAgeDays} days) joined ${sanitizeForLog(member.guild.name)}`
    );
});

client.on('messageDelete', async (message) => {
    if (!message.guild || message.author?.bot) return;

    const channelName =
        'name' in message.channel ? message.channel.name : 'unknown';

    await db.deletedMessageEvent.create({
        data: {
            userId: message.author?.id ?? 'unknown',
            username: message.author?.username ?? 'unknown',
            channelId: message.channel.id,
            channel: channelName,
            guildId: message.guild.id,
            createdAt: new Date(),
        },
    });
});

client.on('guildMemberUpdate', async (oldMember, newMember) => {
    const oldRoleIds = new Set(oldMember.roles.cache.map((r) => r.id));
    const newRoleIds = new Set(newMember.roles.cache.map((r) => r.id));

    const added = [...newRoleIds].filter((r) => !oldRoleIds.has(r));
    if (added.length === 0) return;

    const addedRoleNames = added
        .map((rid) => newMember.guild.roles.cache.get(rid)?.name)
        .filter(Boolean) as string[];

    await db.roleChangeEvent.create({
        data: {
            userId: newMember.id,
            username: newMember.user.username ?? newMember.id,
            guildId: newMember.guild.id,
            addedRoles: addedRoleNames,
        },
    });

    // Emit WebSocket event for role change
    const { websocketService } = await import('./services/websocket');
    websocketService.emitRoleChange(newMember.guild.id, {
        userId: newMember.id,
        username: newMember.user.username ?? newMember.id,
        addedRoles: addedRoleNames,
        timestamp: new Date(),
    });

    console.log(
        `[🕵️ ROLE DRIFT] ${sanitizeForLog(newMember.user.username)} gained roles: ${sanitizeForLog(addedRoleNames)}`
    );
});

client.once('ready', async () => {
    console.log(`✅ Logged in as ${sanitizeForLog(client.user?.username)}`);
    const guilds = client.guilds.cache.map((g) => g.id);
    const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7); // past 7d

    for (const guildId of guilds) {
        if (!env.BOT_GUILD_IDS.includes(guildId)) continue;

        const [heatmap, ghosts, logins, channelStats, scores] =
            await Promise.all([
                getChannelHeatmap({ guildId, since }),
                getGhostScores(guildId, since),
                getMultiClientLoginCounts(guildId, since),
                getChannelDiversity(guildId, since),
                getSuspicionScores(guildId, since),
            ]);

        console.log(`\n📊 Guild: ${sanitizeForLog(guildId)}`);
        console.log(`📅 Data since: ${since.toISOString()}`);
        console.log('----------------------------------------');

        console.log(`Total Users: ${heatmap.length}`);
        console.log('🌡️ Heatmap:');
        console.table(
            heatmap.map((h) => ({
                ...h,
                username: sanitizeForLog(h.username),
                channel: sanitizeForLog(h.channel),
            }))
        );

        console.log('👻 Top Ghost Users:');
        console.table(
            ghosts
                .slice(0, 10)
                .map((g) => ({ ...g, username: sanitizeForLog(g.username) }))
        );

        console.log('📱 Top Multi-Client Users:');
        console.table(
            logins
                .slice(0, 10)
                .map((l) => ({ ...l, username: sanitizeForLog(l.username) }))
        );

        console.log('🛰️ Most Channel-Diverse Users:');
        console.table(
            channelStats
                .slice(0, 10)
                .map((c) => ({ ...c, username: sanitizeForLog(c.username) }))
        );

        console.log('🔍 Suspicion Report (Top 10):');
        console.table(
            scores.slice(0, 10).map((s) => ({
                userId: s.userId,
                username: sanitizeForLog(s.username),
                ghostScore: s.ghostScore,
                multiClientCount: s.multiClientCount,
                channelCount: s.channelCount,
                accountAgeDays: s.accountAgeDays,
                suspicionScore: s.suspicionScore,
                avgReactionTime: (s as any).avgReactionTime?.toFixed(0),
                fastReactionCount: (s as any).fastReactionCount,
                lurkerScore: (s as any).lurkerScore,
                presenceCount: (s as any).presenceCount,
                roleChangeCount: (s as any).roleChangeCount,
                oldClients: s.oldClients?.map(sanitizeForLog).join(','),
                newClients: s.newClients?.map(sanitizeForLog).join(','),
            }))
        );
    }
});

console.log('🔑 Logging in bot...');
client.login(env.DISCORD_BOT_TOKEN);

client.on('error', (err) => {
    console.error('❌ Client error:', err);
});

client.on('shardError', (error) => {
    console.error('❌ A websocket connection encountered an error:', error);
});

// Initialize plugin system with Discord client once ready
client.once('ready', async () => {
    try {
        const path = await import('path');
        const { pluginManager } = await import('./plugins');
        const pluginDir = path.join(__dirname, '../plugins');
        const dataDir = path.join(__dirname, '../plugin-data');

        await pluginManager.initialize(
            {
                pluginDir,
                dataDir,
                autoStart: true,
            },
            client,
            undefined // Express app is set from server
        );
        console.log('✅ Plugin system initialized with Discord client');
    } catch (err) {
        console.error(
            '⚠️  Failed to initialize plugin system with Discord client:',
            err
        );
    }
});
