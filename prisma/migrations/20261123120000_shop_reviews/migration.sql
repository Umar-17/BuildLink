-- AlterTable
ALTER TABLE "Shop" ADD COLUMN     "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "ratingCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "ShopReview" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShopReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShopReview_orderId_key" ON "ShopReview"("orderId");

-- CreateIndex
CREATE INDEX "ShopReview_shopId_createdAt_idx" ON "ShopReview"("shopId", "createdAt");

-- AddForeignKey
ALTER TABLE "ShopReview" ADD CONSTRAINT "ShopReview_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopReview" ADD CONSTRAINT "ShopReview_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopReview" ADD CONSTRAINT "ShopReview_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
