-- AlterTable
ALTER TABLE "BlogPost" ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "BlogPost_order_idx" ON "BlogPost"("order");
