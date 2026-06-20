/*
  Warnings:

  - You are about to drop the `_PostToZone` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_PostToZone" DROP CONSTRAINT "_PostToZone_A_fkey";

-- DropForeignKey
ALTER TABLE "_PostToZone" DROP CONSTRAINT "_PostToZone_B_fkey";

-- DropTable
DROP TABLE "_PostToZone";

-- CreateTable
CREATE TABLE "ZonePost" (
    "id" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "postId" INTEGER NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ZonePost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ZonePost_zoneId_position_idx" ON "ZonePost"("zoneId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "ZonePost_zoneId_postId_key" ON "ZonePost"("zoneId", "postId");

-- AddForeignKey
ALTER TABLE "ZonePost" ADD CONSTRAINT "ZonePost_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ZonePost" ADD CONSTRAINT "ZonePost_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
