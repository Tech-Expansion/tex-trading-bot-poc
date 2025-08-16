import { Address, Prisma, PrismaClient } from '@prisma/client';
import { DefaultArgs } from '@prisma/client/runtime/library';
import { AddressRepository } from '../../application/repositories/address-repository';
import { PrismaBaseRepository } from './_base.repository';

export class PrismaAddressRepository
	extends PrismaBaseRepository<Address, Prisma.AddressUncheckedCreateInput, Partial<Address>>
	implements AddressRepository {
	private readonly _prismaClient: Prisma.AddressDelegate<DefaultArgs, Prisma.PrismaClientOptions>;

	constructor() {
		const currPrisma = new PrismaClient().address;
		super(currPrisma);
		this._prismaClient = currPrisma;
	}

	async getPrimaryAddressByOrderId(orderId: string): Promise<string | null> {
		const result = await this._prismaClient.findFirst({
			where: {
				wallet: {
					orders: {
						some: {
							id: orderId,
						},
					},
				},
			},
			orderBy: {
				createdAt: 'asc',
			},
			select: {
				address: true,
			},
		});

		return result?.address ?? null;
	}

	async findByWalletId(walletId: string): Promise<Address[]> {
		return await this._prismaClient.findMany({
			where: { walletId },
		});
	}
}