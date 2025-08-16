import { Address, Prisma } from '@prisma/client';

export interface AddressServiceInterface {
    createAddresses(addresses: Prisma.AddressUncheckedCreateInput[]): Promise<void>;
    findAddressesByWalletId(walletId: string): Promise<Address[]>;
    updateAddress(id: string, data: Partial<Address>): Promise<Address | null>;
    deleteAddress(id: string): Promise<Address | null>;
}