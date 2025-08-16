import { Address, Prisma } from "@prisma/client";
import { BaseRepository } from "./_base.repository";

export interface AddressRepository
  extends BaseRepository<Address, Prisma.AddressUncheckedCreateInput, Partial<Address>> {
  getPrimaryAddressByOrderId(orderId: string): Promise<string | null>;
  findByWalletId(walletId: string): Promise<Address[]>;
}