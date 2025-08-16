import { Prisma } from "@prisma/client";

export interface TokenServiceInterface {
  createToken(policyId: string, tokenHexName: string): Promise<Prisma.TokenUncheckedCreateInput>;
}