/*
  Warnings:

  - You are about to drop the column `createdAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `loginAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `User` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "Guild" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "guildId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "owner" BOOLEAN NOT NULL,
    "permissions" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Guild_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "discordId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "discriminator" TEXT NOT NULL,
    "avatar" TEXT,
    "email" TEXT,
    "locale" TEXT,
    "verified" BOOLEAN,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "lastSeenAt" DATETIME
);
INSERT INTO "new_User" ("avatar", "discordId", "discriminator", "email", "id", "ipAddress", "lastSeenAt", "locale", "userAgent", "username", "verified") SELECT "avatar", "discordId", "discriminator", "email", "id", "ipAddress", "lastSeenAt", "locale", "userAgent", "username", "verified" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_discordId_key" ON "User"("discordId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Guild_guildId_key" ON "Guild"("guildId");
