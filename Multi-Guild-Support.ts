// // Patch: Add Multi-Guild Support to Spywatcher

// // === FILE: src/routes/analytics.ts ===
// // OLD (multiple lines like this):
// // let data = await getGhostScores(env.DISCORD_GUILD_ID, since);
// // NEW:
// const guildId = req.query.guildId as string || env.DISCORD_GUILD_ID;
// let data = await getGhostScores(guildId, since);

// // Repeat for:
// // getChannelHeatmap({ guildId, since })
// // getLurkerFlags(guildId, since)
// // getRoleDriftFlags(guildId, since)
// // getClientDriftFlags(guildId, since)
// // getBehaviorShiftFlags(guildId, since)

// // === FILE: src/routes/suspicion.ts ===
// const guildId = req.query.guildId as string || env.DISCORD_GUILD_ID;
// let data = await getSuspicionScores(guildId, since);

// // === FILE: src/index.ts ===
// // OLD:
// const guildId = env.DISCORD_GUILD_ID;
// // NEW: Remove hardcoding. Use newPresence.guild.id where needed
// const guildId = newPresence.guild?.id;
// if (!guildId) return;

// // === FILE: src/utils/env.ts ===
// // Keep as is (this supports multi-guild)
// BOT_GUILD_IDS: (process.env.BOT_GUILD_IDS || '').split(',').filter(Boolean),

// // === FILE: src/routes/auth.ts ===
// // Already supports filtering by BOT_GUILD_IDS — optional to expand to dynamic guild check.

// // === OPTIONAL: Add validation middleware ===
// // You may wish to validate `req.query.guildId` against `env.BOT_GUILD_IDS` to prevent abuse.
// // Example:
// if (env.BOT_GUILD_IDS.length && !env.BOT_GUILD_IDS.includes(guildId)) {
//   return res.status(403).json({ error: 'Guild not authorized' });
// }

// // === API USAGE CHANGE ===// Patch: Add Multi-Guild Support to Spywatcher

// // === FILE: src/routes/analytics.ts ===
// // OLD (multiple lines like this):
// // let data = await getGhostScores(env.DISCORD_GUILD_ID, since);
// // NEW:
// const guildId = req.query.guildId as string || env.DISCORD_GUILD_ID;
// let data = await getGhostScores(guildId, since);

// // Repeat for:
// // getChannelHeatmap({ guildId, since })
// // getLurkerFlags(guildId, since)
// // getRoleDriftFlags(guildId, since)
// // getClientDriftFlags(guildId, since)
// // getBehaviorShiftFlags(guildId, since)


// // === FILE: src/routes/suspicion.ts ===
// const guildId = req.query.guildId as string || env.DISCORD_GUILD_ID;
// let data = await getSuspicionScores(guildId, since);


// // === FILE: src/index.ts ===
// // OLD:
// const guildId = env.DISCORD_GUILD_ID;
// // NEW: Remove hardcoding. Use newPresence.guild.id where needed
// const guildId = newPresence.guild?.id;
// if (!guildId) return;


// // === FILE: src/utils/env.ts ===
// // Keep as is (this supports multi-guild)
// BOT_GUILD_IDS: (process.env.BOT_GUILD_IDS || '').split(',').filter(Boolean),


// // === FILE: src/routes/auth.ts ===
// // Already supports filtering by BOT_GUILD_IDS — optional to expand to dynamic guild check.


// // === OPTIONAL: Add validation middleware ===
// // You may wish to validate `req.query.guildId` against `env.BOT_GUILD_IDS` to prevent abuse.
// // Example:
// if (env.BOT_GUILD_IDS.length && !env.BOT_GUILD_IDS.includes(guildId)) {
//   return res.status(403).json({ error: 'Guild not authorized' });
// }


// // === API USAGE CHANGE ===
// // Users can now call:
// //   GET /ghosts?guildId=123456789012345678
// //   GET /suspicion?guildId=123456789012345678
// // etc.

// // If no guildId is passed, it defaults to DISCORD_GUILD_ID for backward compatibility.
