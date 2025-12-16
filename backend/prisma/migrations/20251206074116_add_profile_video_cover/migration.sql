-- AlterTable
ALTER TABLE "User" ADD COLUMN     "coverImageUrl" TEXT,
ADD COLUMN     "profileVideoThumbnailUrl" TEXT,
ADD COLUMN     "profileVideoUrl" TEXT,
ADD COLUMN     "useVideoAvatar" BOOLEAN NOT NULL DEFAULT false;
