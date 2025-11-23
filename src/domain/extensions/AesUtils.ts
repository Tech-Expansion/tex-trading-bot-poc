import * as crypto from 'crypto';

class AesUtils {
    private static instance: AesUtils | null = null;
    private encryptionKey!: Buffer;
    private iv: Buffer;

    private constructor() {
        this.iv = crypto.randomBytes(16);
    }

    public static getInstance(): AesUtils {
        if (!AesUtils.instance) {
            AesUtils.instance = new AesUtils();
        }
        return AesUtils.instance;
    }

    generateKey(password: string): void {
        this.encryptionKey = crypto.createHash('sha256').update(password).digest();
    }

    encrypt(input: string): string {
        if (!this.encryptionKey) {
            throw new Error('encryptionKey not generated.');
        }
        const cipher = crypto.createCipheriv('aes-256-cbc', this.encryptionKey, this.iv);
        let encrypted = cipher.update(input, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return this.iv.toString('hex') + ':' + encrypted;
    }

    decrypt(encryptedData: string): string {
        if (!this.encryptionKey) {
            throw new Error('encryptionKey not generated.');
        }

        const [ivHex, encrypted] = encryptedData.split(':');
        const iv = Buffer.from(ivHex, 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', this.encryptionKey, iv);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }

    encryptPrivateKey(
        privateKey: string,
        password: string = ''
    ): { encryptedKey: string; salt: string } {
        const aesUtils = AesUtils.getInstance();
        const salt = crypto.randomBytes(16).toString('hex');
        const saltedPassword = password + salt;
        aesUtils.generateKey(saltedPassword);
        const encryptedKey = aesUtils.encrypt(privateKey);
        return { encryptedKey, salt };
    }

    decryptPrivateKey(
        encryptedKey: string,
        salt: string,
        password: string = ''
    ): string {
        const aesUtils = AesUtils.getInstance();
        const saltedPassword = password + salt;
        aesUtils.generateKey(saltedPassword);
        return aesUtils.decrypt(encryptedKey);
    }
}

export default AesUtils;