/*
  Warnings:

  - A unique constraint covering the columns `[orderCode]` on the table `Order` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "orderCode" VARCHAR(32);

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderCode_key" ON "Order"("orderCode");

-- RenameIndex
ALTER INDEX "unique_policy_token" RENAME TO "Token_policyId_tokenHexName_key";

-- RenameIndex
ALTER INDEX "unique_token_pair" RENAME TO "TokenPair_tokenAId_tokenBId_poolId_key";
