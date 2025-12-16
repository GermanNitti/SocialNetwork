-- CreateTable
CREATE TABLE "TermGlobal" (
    "id" SERIAL NOT NULL,
    "term" TEXT NOT NULL,
    "normalized" TEXT NOT NULL,
    "totalCount" INTEGER NOT NULL DEFAULT 0,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TermGlobal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TermTopicStats" (
    "id" SERIAL NOT NULL,
    "termNormalized" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TermTopicStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserTermStats" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "term" TEXT NOT NULL,
    "normalized" TEXT NOT NULL,
    "isProperName" BOOLEAN NOT NULL DEFAULT false,
    "count" INTEGER NOT NULL DEFAULT 0,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserTermStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRelation" (
    "id" SERIAL NOT NULL,
    "user1Id" INTEGER NOT NULL,
    "user2Id" INTEGER NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastInteractionAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserRelation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AmbiguousReference" (
    "id" SERIAL NOT NULL,
    "postId" INTEGER NOT NULL,
    "authorId" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "sentiment" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AmbiguousReference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AmbiguousReferenceCandidate" (
    "id" SERIAL NOT NULL,
    "referenceId" INTEGER NOT NULL,
    "targetUserId" INTEGER NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "AmbiguousReferenceCandidate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TermGlobal_normalized_key" ON "TermGlobal"("normalized");

-- CreateIndex
CREATE UNIQUE INDEX "TermTopicStats_termNormalized_tag_key" ON "TermTopicStats"("termNormalized", "tag");

-- CreateIndex
CREATE INDEX "UserTermStats_userId_normalized_idx" ON "UserTermStats"("userId", "normalized");

-- CreateIndex
CREATE UNIQUE INDEX "UserRelation_user1Id_user2Id_key" ON "UserRelation"("user1Id", "user2Id");

-- AddForeignKey
ALTER TABLE "UserTermStats" ADD CONSTRAINT "UserTermStats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRelation" ADD CONSTRAINT "UserRelation_user1Id_fkey" FOREIGN KEY ("user1Id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRelation" ADD CONSTRAINT "UserRelation_user2Id_fkey" FOREIGN KEY ("user2Id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AmbiguousReference" ADD CONSTRAINT "AmbiguousReference_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AmbiguousReference" ADD CONSTRAINT "AmbiguousReference_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AmbiguousReferenceCandidate" ADD CONSTRAINT "AmbiguousReferenceCandidate_referenceId_fkey" FOREIGN KEY ("referenceId") REFERENCES "AmbiguousReference"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AmbiguousReferenceCandidate" ADD CONSTRAINT "AmbiguousReferenceCandidate_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
