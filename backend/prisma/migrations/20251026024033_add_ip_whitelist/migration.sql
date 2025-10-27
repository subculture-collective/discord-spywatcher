-- CreateTable
CREATE TABLE "WhitelistedIP" (
    "id" SERIAL NOT NULL,
    "ip" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhitelistedIP_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WhitelistedIP_ip_key" ON "WhitelistedIP"("ip");
