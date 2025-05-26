-- CreateTable
CREATE TABLE "ReactionTime" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "observerId" TEXT NOT NULL,
    "observerName" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "actorName" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "deltaMs" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
