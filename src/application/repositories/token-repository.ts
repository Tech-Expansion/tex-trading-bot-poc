import { Prisma, Token } from '@prisma/client';
import { BaseRepository } from './_base.repository';

export interface TokenRepository extends BaseRepository<Token, Prisma.TokenUncheckedCreateInput, Partial<Token>> {
}
