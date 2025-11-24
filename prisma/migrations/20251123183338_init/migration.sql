-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "telegramId" VARCHAR(64) NOT NULL,
    "username" VARCHAR(256),
    "allowAcceleratedSign" BOOLEAN NOT NULL DEFAULT true,
    "isDisabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wallet" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "stakeId" VARCHAR(256) NOT NULL,
    "hashedKey" VARCHAR(1024),
    "salt" VARCHAR(32),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Address" (
    "id" UUID NOT NULL,
    "walletId" UUID NOT NULL,
    "address" VARCHAR(256) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Token" (
    "id" UUID NOT NULL,
    "policyId" VARCHAR(256) NOT NULL,
    "tokenHexName" VARCHAR(256) NOT NULL,
    "tokenName" VARCHAR(256) NOT NULL,
    "isValidated" BOOLEAN NOT NULL DEFAULT false,
    "isDisabled" BOOLEAN NOT NULL DEFAULT false,
    "decimals" INTEGER,

    CONSTRAINT "Token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TokenPair" (
    "id" UUID NOT NULL,
    "tokenAId" UUID NOT NULL,
    "tokenBId" UUID NOT NULL,
    "isMainPair" BOOLEAN NOT NULL,
    "sequence" INTEGER NOT NULL,
    "poolId" VARCHAR(256) NOT NULL DEFAULT 'unknown',
    "isEnablePriceHistory" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "TokenPair_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TokenPairHistoryPrice" (
    "id" UUID NOT NULL,
    "tokenPairId" UUID NOT NULL,
    "price" DECIMAL(60,30) NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TokenPairHistoryPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" UUID NOT NULL,
    "orderCode" VARCHAR(32),
    "walletId" UUID NOT NULL,
    "tokenPairId" UUID NOT NULL,
    "orderType" INTEGER NOT NULL,
    "status" INTEGER NOT NULL,
    "amount" DECIMAL(60,30) NOT NULL,
    "marketPrice" DECIMAL(60,30),
    "limitPrice" DECIMAL(60,30),
    "stopPrice" DECIMAL(60,30),
    "slippage" DECIMAL(7,3),
    "expirationTime" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceAlert" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "tokenPairId" UUID NOT NULL,
    "alertPrice" DECIMAL(60,30) NOT NULL,
    "isHigher" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "PriceAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserTokenPairWatch" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "tokenPairId" UUID NOT NULL,
    "sequence" INTEGER NOT NULL,

    CONSTRAINT "UserTokenPairWatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_stakeId_key" ON "Wallet"("stakeId");

-- CreateIndex
CREATE UNIQUE INDEX "Address_address_key" ON "Address"("address");

-- CreateIndex
CREATE UNIQUE INDEX "Token_policyId_tokenHexName_key" ON "Token"("policyId", "tokenHexName");

-- CreateIndex
CREATE UNIQUE INDEX "TokenPair_tokenAId_tokenBId_poolId_key" ON "TokenPair"("tokenAId", "tokenBId", "poolId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderCode_key" ON "Order"("orderCode");

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TokenPair" ADD CONSTRAINT "TokenPair_tokenAId_fkey" FOREIGN KEY ("tokenAId") REFERENCES "Token"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TokenPair" ADD CONSTRAINT "TokenPair_tokenBId_fkey" FOREIGN KEY ("tokenBId") REFERENCES "Token"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TokenPairHistoryPrice" ADD CONSTRAINT "TokenPairHistoryPrice_tokenPairId_fkey" FOREIGN KEY ("tokenPairId") REFERENCES "TokenPair"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_tokenPairId_fkey" FOREIGN KEY ("tokenPairId") REFERENCES "TokenPair"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceAlert" ADD CONSTRAINT "PriceAlert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceAlert" ADD CONSTRAINT "PriceAlert_tokenPairId_fkey" FOREIGN KEY ("tokenPairId") REFERENCES "TokenPair"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTokenPairWatch" ADD CONSTRAINT "UserTokenPairWatch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTokenPairWatch" ADD CONSTRAINT "UserTokenPairWatch_tokenPairId_fkey" FOREIGN KEY ("tokenPairId") REFERENCES "TokenPair"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
