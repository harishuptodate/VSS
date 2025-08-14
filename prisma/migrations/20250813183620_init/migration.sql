-- CreateEnum
CREATE TYPE "public"."VideoStatus" AS ENUM ('UPLOADING', 'PROCESSING', 'READY');

-- CreateEnum
CREATE TYPE "public"."Visibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateTable
CREATE TABLE "public"."Video" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "title" TEXT,
    "objectPath" TEXT NOT NULL,
    "sizeBytes" BIGINT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "status" "public"."VideoStatus" NOT NULL DEFAULT 'UPLOADING',
    "durationSec" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Video_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Thumbnail" (
    "id" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "objectPath" TEXT NOT NULL,
    "timecodeSec" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Thumbnail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ShareLink" (
    "id" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "createdBy" UUID NOT NULL,
    "visibility" "public"."Visibility" NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "lastViewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShareLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ShareEmail" (
    "id" TEXT NOT NULL,
    "linkId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShareEmail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Thumbnail_videoId_idx" ON "public"."Thumbnail"("videoId");

-- CreateIndex
CREATE UNIQUE INDEX "ShareLink_token_key" ON "public"."ShareLink"("token");

-- CreateIndex
CREATE INDEX "ShareLink_videoId_idx" ON "public"."ShareLink"("videoId");

-- CreateIndex
CREATE INDEX "ShareLink_token_idx" ON "public"."ShareLink"("token");

-- CreateIndex
CREATE INDEX "ShareEmail_linkId_idx" ON "public"."ShareEmail"("linkId");

-- AddForeignKey
ALTER TABLE "public"."Thumbnail" ADD CONSTRAINT "Thumbnail_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "public"."Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ShareLink" ADD CONSTRAINT "ShareLink_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "public"."Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ShareEmail" ADD CONSTRAINT "ShareEmail_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "public"."ShareLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;
