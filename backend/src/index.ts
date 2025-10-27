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

    if (!user || !clientStatus) return;

    const platforms = Object.keys(clientStatus); // desktop, mobile, web

    if (platforms.length > 1) {
        console.log(
            `[⚠️ MULTI-CLIENT] ${sanitizeForLog(user.tag)} is online on: ${platforms.map(sanitizeForLog).join(
                ', '
            )}`
        );
        await db.presenceEvent.create({
            data: {
                userId: user.id,
                username: user.tag,
                clients: platforms.join(','),
            },
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
            `[⏱️ DB CORRELATED] ${sanitizeForLog(user.tag)} started typing ${deltaMs}ms after ${sanitizeForLog(
                lastMsg.username
            )} in #${sanitizeForLog('name' in channel ? channel.name : 'unknown')}`
        );

        // Save for long-term analysis
        await db.reactionTime.create({
            data: {
                observerId: user.id,
                observerName: user.tag ?? user.id,
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
            username: message.author.tag ?? message.author.id,
            channelId: message.channel.id,
            channel: channelName,
            guildId: message.guild.id,
            content: message.content.slice(0, 1000), // limit content length for now
        },
    });

    console.log(
        `[💬 MESSAGE] ${sanitizeForLog(message.author.tag)} in #${sanitizeForLog(channelName)}: ${sanitizeForLog(message.content)}`
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
            username: member.user.tag ?? member.user.id,
            guildId: member.guild.id,
            accountAgeDays,
        },
    });

    console.log(
        `[🟢 JOIN] ${sanitizeForLog(member.user.tag)} (account age: ${accountAgeDays} days) joined ${sanitizeForLog(member.guild.name)}`
    );
});

client.on('messageDelete', async (message) => {
    if (!message.guild || message.author?.bot) return;

    const channelName =
        'name' in message.channel ? message.channel.name : 'unknown';

    await db.deletedMessageEvent.create({
        data: {
            userId: message.author?.id ?? 'unknown',
            username: message.author?.tag ?? 'unknown',
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
        .filter(Boolean)
        .join(',');

    await db.roleChangeEvent.create({
        data: {
            userId: newMember.id,
            username: newMember.user.tag ?? newMember.id,
            guildId: newMember.guild.id,
            addedRoles: addedRoleNames,
        },
    });

    console.log(
        `[🕵️ ROLE DRIFT] ${sanitizeForLog(newMember.user.tag)} gained roles: ${sanitizeForLog(addedRoleNames)}`
    );
});

client.once('ready', async () => {
    console.log(`✅ Logged in as ${sanitizeForLog(client.user?.tag)}`);
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
        console.table(heatmap.map(h => ({...h, username: sanitizeForLog(h.username), channel: sanitizeForLog(h.channel)})));

        console.log('👻 Top Ghost Users:');
        console.table(ghosts.slice(0, 10).map(g => ({...g, username: sanitizeForLog(g.username)})));

        console.log('📱 Top Multi-Client Users:');
        console.table(logins.slice(0, 10).map(l => ({...l, username: sanitizeForLog(l.username)})));

        console.log('🛰️ Most Channel-Diverse Users:');
        console.table(channelStats.slice(0, 10).map(c => ({...c, username: sanitizeForLog(c.username)})));

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
