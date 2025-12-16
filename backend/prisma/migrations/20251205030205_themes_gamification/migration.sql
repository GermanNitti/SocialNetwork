-- CreateEnum
CREATE TYPE "InterestTopic" AS ENUM ('NATURE', 'RACING', 'MUSIC', 'TECH', 'ART', 'GENERIC');

-- CreateEnum
CREATE TYPE "InteractionType" AS ENUM ('REGISTER', 'LOGIN', 'POST_CREATED', 'COMMENT_CREATED', 'LIKE_GIVEN');

-- CreateEnum
CREATE TYPE "ShopCategory" AS ENUM ('THEME', 'DECORATION');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "customThemeSettings" JSONB,
ADD COLUMN     "lastLoginAt" TIMESTAMP(3),
ADD COLUMN     "loginStreak" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "points" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "themeId" INTEGER,
ADD COLUMN     "totalPointsEarned" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Theme" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "primaryColor" TEXT NOT NULL,
    "secondaryColor" TEXT NOT NULL,
    "backgroundGradient" TEXT NOT NULL,
    "decorations" JSONB,

    CONSTRAINT "Theme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShopItem" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "ShopCategory" NOT NULL,
    "pricePoints" INTEGER NOT NULL,
    "assetData" JSONB NOT NULL,
    "themeKey" TEXT,

    CONSTRAINT "ShopItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserItem" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "itemId" INTEGER NOT NULL,
    "acquiredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "equipped" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "UserItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserInteraction" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" "InteractionType" NOT NULL,
    "weight" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Theme_key_key" ON "Theme"("key");

-- CreateIndex
CREATE UNIQUE INDEX "ShopItem_key_key" ON "ShopItem"("key");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES "Theme"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopItem" ADD CONSTRAINT "ShopItem_themeKey_fkey" FOREIGN KEY ("themeKey") REFERENCES "Theme"("key") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserItem" ADD CONSTRAINT "UserItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserItem" ADD CONSTRAINT "UserItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "ShopItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserInteraction" ADD CONSTRAINT "UserInteraction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
