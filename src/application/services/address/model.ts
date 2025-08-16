import { Prisma } from "@prisma/client";
import { CryptoExtension } from "../../../domain/extensions/crypto";

export class CreateAddressModel implements Prisma.AddressUncheckedCreateInput {
    id: string;
    walletId: string;
    address: string;

    constructor(walletId: string, address: string) {
        this.id = CryptoExtension.uuid();
        this.walletId = walletId;
        this.address = address;
    }
}