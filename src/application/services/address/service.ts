import { Address, Prisma } from '@prisma/client';
import { AddressServiceInterface } from './interface';
import { AddressRepository } from '../../../application/repositories/address-repository';
import { PrismaAddressRepository } from '../../../persistence/repositories/address-repository';

class AddressServiceClass implements AddressServiceInterface {
    constructor(private addressRepository: AddressRepository) { }

    async createAddresses(addresses: Prisma.AddressUncheckedCreateInput[]): Promise<void> {
        await this.addressRepository.createMany({ data: addresses });
    }

    async findAddressesByWalletId(walletId: string): Promise<Address[]> {
        return await this.addressRepository.findByWalletId(walletId);
    }

    async updateAddress(id: string, data: Partial<Address>): Promise<Address | null> {
        return await this.addressRepository.update(id, data);
    }

    async deleteAddress(id: string): Promise<Address | null> {
        return await this.addressRepository.delete(id);
    }
}

const addressRepository = new PrismaAddressRepository();
export const AddressService = new AddressServiceClass(addressRepository);