export class Decrypter {
    private key: string | null;
    private readonly keyArray: string[];

    private readonly headerLength: number;
    private readonly signature: string;
    private readonly version: string;
    private readonly remainder: string;

    private readonly defaultHeaderLength = 16;
    private readonly defaultSignature = "5250474d56000000";
    private readonly defaultVersion = "000301";
    private readonly defaultRemainder = "0000000000";

    private readonly pngHeaderBytes = "89 50 4E 47 0D 0A 1A 0A 00 00 00 0D 49 48 44 52";

    /**
     * @param {string} key Encryption key, that can be fetched from `System.json`'s `encryptionKey` field. Leave it `null` to auto-determine the key from input files. You can set it after constructing `Decrypter` using `Decrypter.setKey()`.
     */
    constructor(key: string | null = null) {
        this.key = key;
        this.keyArray = key ? this.splitEncryptionCode() : [];
        this.headerLength = this.defaultHeaderLength;
        this.signature = this.defaultSignature;
        this.version = this.defaultVersion;
        this.remainder = this.defaultRemainder;
    }

    private splitEncryptionCode(): string[] {
        const codeArr: string[] = [];

        if (!this.key) {
            return codeArr;
        }

        for (let i = 0; i < this.key.length; i += 2) {
            codeArr.push(this.key.slice(i, i + 2));
        }

        return codeArr;
    }

    private verifyFakeHeader(fileHeader: Uint8Array): boolean {
        const fakeHeader = this.buildFakeHeader();
        return fakeHeader.every((value, i) => fileHeader[i] === value);
    }

    private buildFakeHeader(): Uint8Array {
        const fakeHeader = new Uint8Array(this.headerLength);
        const headerStructure = this.signature + this.version + this.remainder;

        for (let i = 0; i < this.headerLength; i++) {
            fakeHeader[i] = Number.parseInt(headerStructure.slice(i * 2, i * 2 + 2), 16);
        }

        return fakeHeader;
    }

    private restorePNGHeader(arrayBuffer: ArrayBuffer): ArrayBuffer {
        const pngStartHeader = this.getPNGHeader(this.headerLength);
        const finalHeaderLength = pngStartHeader.length;

        const actualData = arrayBuffer.slice(finalHeaderLength * 2, arrayBuffer.byteLength);
        const tempArray = new Uint8Array(actualData.byteLength + finalHeaderLength);

        tempArray.set(pngStartHeader, 0);
        tempArray.set(new Uint8Array(actualData), finalHeaderLength);

        return tempArray.buffer;
    }

    private decrypt(arrayBuffer: ArrayBuffer): ArrayBuffer {
        const actualData = arrayBuffer.slice(this.headerLength, arrayBuffer.byteLength);
        return this.decryptBytes(actualData);
    }

    private encrypt(arrayBuffer: ArrayBuffer): ArrayBuffer {
        const encryptedBuffer = this.decryptBytes(arrayBuffer);
        const fakeHeader = this.buildFakeHeader();
        const tempArray = new Uint8Array(encryptedBuffer.byteLength + this.headerLength);

        tempArray.set(fakeHeader, 0);
        tempArray.set(new Uint8Array(encryptedBuffer), this.headerLength);

        if (!this.verifyFakeHeader(new Uint8Array(tempArray.buffer, 0, this.headerLength))) {
            throw new Error("Failed to create valid header");
        }

        return tempArray.buffer;
    }

    private decryptBytes(arrayBuffer: ArrayBuffer): ArrayBuffer {
        const decrypted = new Uint8Array(arrayBuffer);
        const limit = Math.min(this.headerLength, this.keyArray.length);

        for (let i = 0; i < limit; i++) {
            decrypted[i] ^= Number.parseInt(this.keyArray[i], 16);
        }

        return arrayBuffer;
    }

    private getPNGHeader(headerLen: number): Uint8Array {
        const headerParts = this.pngHeaderBytes.split(" ");
        const length = Math.min(headerLen, headerParts.length);
        const restoredHeader = new Uint8Array(length);

        for (let i = 0; i < length; i++) {
            restoredHeader[i] = Number.parseInt(headerParts[i], 16);
        }

        return restoredHeader;
    }

    private convertToHex(byte: number): string {
        return ("0" + (byte & 0xff).toString(16)).slice(-2);
    }

    private findKeyPNG(headerLength: number, fileContent: ArrayBuffer): string | null {
        if (!fileContent.byteLength || fileContent.byteLength < headerLength * 2) {
            return null;
        }

        const fileHeader = new Uint8Array(fileContent.slice(headerLength, headerLength * 2));
        const pngHeaderArray = this.getPNGHeader(headerLength);
        const keyParts: string[] = [];

        for (let i = 0; i < headerLength; i++) {
            const byte = pngHeaderArray[i] ^ fileHeader[i];
            keyParts.push(this.convertToHex(byte));
        }

        return keyParts.join("");
    }

    private findKey(fileContent: ArrayBuffer, headerLength: number): string | null {
        const key = this.findKeyPNG(headerLength, fileContent);

        if (key !== null) {
            return key;
        }

        const textContent = new TextDecoder().decode(new Uint8Array(fileContent));

        try {
            const fileContentJSON = JSON.parse(`[${textContent}]`);
            const key = fileContentJSON[0]?.encryptionKey;

            if (key) {
                return key;
            }
        } catch {
            try {
                const decompressed = Buffer.from(textContent, "base64").toString("utf-8");
                const fileContentJSON = JSON.parse(`[${decompressed}]`);
                const key = fileContentJSON[0]?.encryptionKey;

                if (key) {
                    return key;
                }
            } catch {
                // Silently continue
            }
        }

        return this.searchKey(textContent, false);
    }

    private searchKey(fileContent: string, isBase64: boolean): string | null {
        if (!fileContent) {
            return null;
        }

        const decoded = isBase64 ? Buffer.from(fileContent, "base64").toString("utf-8") : fileContent;
        const lines = decoded.split("\n");

        const matchedLine = lines.find((line) => {
            const newLine = line.trim().replace(/[\r\n\t]/g, "");
            return /^(.*)this\._encryptionKey ?= ?"(.*)"(.*);(.*)?$/.test(newLine);
        });

        if (matchedLine) {
            const matches = matchedLine
                .trim()
                .replace(/[\r\n\t]/g, "")
                .match(/^(.*)this\._encryptionKey ?= ?"(.*)"(.*);(.*)?$/);
            return matches?.[2] || null;
        }

        if (!isBase64) {
            return this.searchKey(fileContent, true);
        }

        return null;
    }

    /**
     * Sets the key of decrypter from encrypted `fileContent` data.
     * @param {ArrayBuffer} fileContent The data of RPG Maker file.
     * @param {boolean} isImage Whether passed data is related to image (`.rpgmvp`, `.png_`) or audio (`.rpgmvo`, `.ogg_`, `.m4a_).
     */
    public setKey(fileContent: ArrayBuffer, isImage: boolean) {
        if (!this.key) {
            if (!isImage) {
                throw new Error("Encryption key cannot be auto-determined from audio files.");
            }

            const encryptionKey = this.findKey(fileContent, this.headerLength);

            if (encryptionKey) {
                this.key = encryptionKey;
            } else {
                throw new Error(
                    "Couldn't determine encryption key from the data. Make sure that you pass your data in form of ArrayBuffer, and it's valid RPG Maker MV/MZ file."
                );
            }
        }
    }

    public restoreHeader(fileContent: ArrayBuffer, isImage: boolean): ArrayBuffer {
        this.setKey(fileContent, isImage);
        return this.restorePNGHeader(fileContent);
    }

    /**
     * @param {ArrayBuffer} fileContent The data of RPG Maker file.
     * @param {boolean} isImage Whether passed data is related to image (`.rpgmvp`, `.png_`) or audio (`.rpgmvo`, `.ogg_`).
     * @returns {ArrayBuffer} Decrypted data.
     */
    public decryptFile(fileContent: ArrayBuffer, isImage: boolean): ArrayBuffer {
        this.setKey(fileContent, isImage);
        return this.decrypt(fileContent);
    }

    /**
     * This function needs decrypter to have a key, which you can fetch from `System.json` file or by calling `Decrypter.setKey()` with the data from encrypted file.
     * @param {ArrayBuffer} fileContent The data of `.png` or `.ogg` file.
     * @returns {ArrayBuffer} Encrypted data.
     */
    public encryptFile(fileContent: ArrayBuffer): ArrayBuffer {
        return this.encrypt(fileContent);
    }
}
