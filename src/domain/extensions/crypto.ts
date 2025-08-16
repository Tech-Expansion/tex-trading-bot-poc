import { randomUUID } from "crypto";

class CryptoExtensionClass {
  uuid() {
    return randomUUID();
  }
}

export const CryptoExtension = new CryptoExtensionClass();