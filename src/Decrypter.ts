export class Decrypter {
    private key: string | null;
    private keyArray: string[] = [];
    private readonly headerLength = 16;

    /**
     * @param {string} key Encryption key, that can be fetched from `System.json`'s `encryptionKey` field. Leave it `null` to auto-determine the key from input files. You can set it after constructing `Decrypter` using `Decrypter.setKeyFromImage()` or `Decrypter.setKey()`.
     */
    constructor(key: string | null = null) {
        this.key = key;

        if (key) {
            this.keyArray = this.splitEncryptionCode();
        }
    }

    private splitEncryptionCode(): string[] {
        if (!this.key) {
            return [];
        }

        const codeArr: string[] = [];

        for (let i = 0; i < this.key.length; i += 2) {
            codeArr.push(this.key.slice(i, i + 2));
        }

        return codeArr;
    }

    private processBuffer(buffer: ArrayBuffer): ArrayBuffer {
        const decrypted = new Uint8Array(buffer);
        const limit = Math.min(this.headerLength, this.keyArray.length);

        for (let i = 0; i < limit; i++) {
            decrypted[i] ^= Number.parseInt(this.keyArray[i], 16);
        }

        return buffer;
    }

    /**
     * @param key {string} Sets the key of decrypter to provided string.
     */
    public setKeyString(key: string) {
        this.key = key;
    }

    /**
     * Sets the key of decrypter from encrypted `fileContent` image data.
     * @param {ArrayBuffer} fileContent The data of RPG Maker file.
     */
    public setKeyFromImage(fileContent: ArrayBuffer) {
        const header = new Uint8Array(fileContent.slice(this.headerLength, this.headerLength * 2));
        const pngHeader = [
            0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
        ];

        this.key = Array.from({ length: this.headerLength }, (_, i) =>
            (pngHeader[i] ^ header[i]).toString(16).padStart(2, "0").slice(-2),
        ).join("");
        this.keyArray = this.splitEncryptionCode();
    }

    /**
     * The function will return wrong data, when used with audio (`rpgmvo`, `rpgmvm`, `ogg_`, `m4a_`) file without an explicitly set key.
     * @param {ArrayBuffer} fileContent The data of RPG Maker file.
     * @returns {ArrayBuffer} Decrypted data.
     */
    public decrypt(fileContent: ArrayBuffer): ArrayBuffer {
        if (!this.key) {
            this.setKeyFromImage(fileContent);
        }

        return this.processBuffer(fileContent.slice(this.headerLength, fileContent.byteLength));
    }

    /**
     * This function needs decrypter to have a key, which you can fetch from `System.json` file or by calling `Decrypter.setKeyFromImage()`/`Decrypter.setKeyString()`.
     * @param {ArrayBuffer} fileContent The data of `.png`, `.ogg` or `.m4a` file.
     * @returns {ArrayBuffer} Encrypted data.
     */
    public encrypt(fileContent: ArrayBuffer): ArrayBuffer {
        if (!this.key) {
            throw new Error("Encryption key is not set.");
        }

        const encryptedBuffer = this.processBuffer(fileContent);
        const result = new Uint8Array(encryptedBuffer.byteLength + this.headerLength);

        result.set([0x52, 0x50, 0x47, 0x4d, 0x56, 0x00, 0x00, 0x00, 0x00, 0x03, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00], 0);
        result.set(new Uint8Array(encryptedBuffer), this.headerLength);

        return result.buffer;
    }
}
