/*
  Warnings:

  - Changed the type of `category` on the `ShopItem` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "PostType" AS ENUM ('NORMAL', 'HELP_REQUEST', 'PROJECT_UPDATE');

-- CreateEnum
CREATE TYPE "ShopItemCategory" AS ENUM ('THEME', 'DECORATION');

-- CreateEnum
CREATE TYPE "SquadType" AS ENUM ('FOTO', 'FITNESS', 'IDIOMAS', 'GENERAL');

-- CreateEnum
CREATE TYPE "SquadRole" AS ENUM ('MEMBER', 'ADMIN');

-- CreateEnum
CREATE TYPE "ProjectCategory" AS ENUM ('PERSONAL', 'CREATIVO', 'SALUD', 'ESTUDIO', 'OTRO');

-- CreateEnum
CREATE TYPE "ProjectVisibility" AS ENUM ('PUBLIC', 'FRIENDS', 'PRIVATE');

-- CreateEnum
CREATE TYPE "FeedbackStatus" AS ENUM ('NEW', 'REVIEWING', 'IN_PROGRESS', 'DONE');

-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "projectId" INTEGER,
ADD COLUMN     "squadId" INTEGER,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "type" "PostType" NOT NULL DEFAULT 'NORMAL';

-- AlterTable
ALTER TABLE "ShopItem" ALTER COLUMN "description" DROP NOT NULL,
DROP COLUMN "category",
ADD COLUMN     "category" "ShopItemCategory" NOT NULL,
ALTER COLUMN "assetData" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Theme" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "primaryColor" DROP NOT NULL,
ALTER COLUMN "secondaryColor" DROP NOT NULL,
ALTER COLUMN "backgroundGradient" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "interests" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "location" TEXT;

-- DropEnum
DROP TYPE "InterestTopic";

-- DropEnum
DROP TYPE "ShopCategory";

-- CreateTable
CREATE TABLE "Squad" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "type" "SquadType" NOT NULL DEFAULT 'GENERAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Squad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SquadMember" (
    "userId" INTEGER NOT NULL,
    "squadId" INTEGER NOT NULL,
    "role" "SquadRole" NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SquadMember_pkey" PRIMARY KEY ("userId","squadId")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" "ProjectCategory" NOT NULL DEFAULT 'OTRO',
    "targetDate" TIMESTAMP(3),
    "visibility" "ProjectVisibility" NOT NULL DEFAULT 'PUBLIC',
    "needsHelp" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Badge" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Badge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBadge" (
    "userId" INTEGER NOT NULL,
    "badgeId" INTEGER NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserBadge_pkey" PRIMARY KEY ("userId","badgeId")
);

-- CreateTable
CREATE TABLE "Feedback" (
    "id" SERIAL NOT NULL,
    "authorId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "votes" INTEGER NOT NULL DEFAULT 0,
    "status" "FeedbackStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedbackVote" (
    "userId" INTEGER NOT NULL,
    "feedbackId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeedbackVote_pkey" PRIMARY KEY ("userId","feedbackId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Squad_slug_key" ON "Squad"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Badge_code_key" ON "Badge"("code");

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_squadId_fkey" FOREIGN KEY ("squadId") REFERENCES "Squad"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SquadMember" ADD CONSTRAINT "SquadMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SquadMember" ADD CONSTRAINT "SquadMember_squadId_fkey" FOREIGN KEY ("squadId") REFERENCES "Squad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "Badge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedbackVote" ADD CONSTRAINT "FeedbackVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedbackVote" ADD CONSTRAINT "FeedbackVote_feedbackId_fkey" FOREIGN KEY ("feedbackId") REFERENCES "Feedback"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
