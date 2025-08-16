
ALTER TABLE "Token" ADD CONSTRAINT unique_policy_token UNIQUE ("policyId", "tokenHexName");

-- CreateIndex
ALTER TABLE "TokenPair" ADD CONSTRAINT unique_token_pair UNIQUE ("tokenAId", "tokenBId", "poolId");
