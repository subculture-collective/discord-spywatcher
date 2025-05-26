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
    "verified" BOOLEAN NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "refreshTokenIssuedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accessTokenExpiresAt" DATETIME NOT NULL,
    "lastSeenAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER'
);
INSERT INTO "new_User" ("accessToken", "accessTokenExpiresAt", "avatar", "createdAt", "discordId", "discriminator", "email", "id", "ipAddress", "lastSeenAt", "locale", "refreshToken", "role", "updatedAt", "userAgent", "username", "verified") SELECT "accessToken", "accessTokenExpiresAt", "avatar", "createdAt", "discordId", "discriminator", "email", "id", "ipAddress", "lastSeenAt", "locale", "refreshToken", "role", "updatedAt", "userAgent", "username", "verified" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_discordId_key" ON "User"("discordId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
