/*
  Warnings:

  - Added the required column `accessTokenExpiresAt` to the `User` table without a default value. This is not possible if the table is not empty.

*/
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
    "lastSeenAt" DATETIME,
    "accessTokenExpiresAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("accessToken", "avatar", "discordId", "discriminator", "email", "id", "ipAddress", "lastSeenAt", "locale", "refreshToken", "userAgent", "username", "verified") SELECT "accessToken", "avatar", "discordId", "discriminator", "email", "id", "ipAddress", "lastSeenAt", "locale", "refreshToken", "userAgent", "username", "verified" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_discordId_key" ON "User"("discordId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
