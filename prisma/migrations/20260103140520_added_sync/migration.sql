-- CreateTable
CREATE TABLE "follower_snapshot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "followers" JSONB NOT NULL,
    "following" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "follower_snapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "follower_snapshot_userId_key" ON "follower_snapshot"("userId");

-- AddForeignKey
ALTER TABLE "follower_snapshot" ADD CONSTRAINT "follower_snapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
