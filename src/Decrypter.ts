export class Decrypter {
    private readonly key: string | null;
    private readonly keyArray: string[];

    headerLength: number;
    signature: string;
    version: string;
    remainder: string;

    pngHeaderLength: number | null;

    readonly defaultHeaderLength = 16;
    readonly defaultSignature = "5250474d56000000";
    readonly defaultVersion = "000301";
    readonly defaultRemainder = "0000000000";
    static readonly pngHeaderBytes = "89 50 4E 47 0D 0A 1A 0A 00 00 00 0D 49 48 44 52";

    constructor(key: string | null) {
        if (key === null) {
            throw new Error(
                "Decrypting with automatically found encryption key is not yet supported.\nProvide a string argument, containing encrypthion key."
            );
        }

        this.key = key;
        this.keyArray = key ? this.splitEncryptionCode() : [];
        this.headerLength = this.defaultHeaderLength;
        this.signature = this.defaultSignature;
        this.version = this.defaultVersion;
        this.remainder = this.defaultRemainder;
        this.pngHeaderLength = null;
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
        const length = this.headerLength;
        const fakeHeader = new Uint8Array(length);
        const headerStructure = this.signature + this.version + this.remainder;

        for (let i = 0; i < length; i++) {
            fakeHeader[i] = Number.parseInt(headerStructure.slice(i * 2, i * 2 + 2), 16);
        }

        return fakeHeader;
    }

    modifyFile(fileContent: ArrayBuffer, modType: "restore" | "encrypt" | "decrypt"): ArrayBuffer {
        switch (modType) {
            case "restore":
                return this.restorePngHeader(fileContent);
            case "encrypt":
                return this.encrypt(fileContent);
            case "decrypt":
                return this.decrypt(fileContent);
            default:
                throw new Error("Invalid modification type");
        }
    }

    private restorePngHeader(arrayBuffer: ArrayBuffer): ArrayBuffer {
        if (!arrayBuffer.byteLength) {
            throw new Error("Empty array buffer");
        }

        const length = this.pngHeaderLength ?? this.headerLength;
        const pngStartHeader = Decrypter.getNormalPNGHeader(length);
        const finalHeaderLength = pngStartHeader.length;

        const slicedBuffer = arrayBuffer.slice(finalHeaderLength * 2, arrayBuffer.byteLength);
        const tempArray = new Uint8Array(slicedBuffer.byteLength + finalHeaderLength);

        tempArray.set(pngStartHeader, 0);
        tempArray.set(new Uint8Array(slicedBuffer), finalHeaderLength);

        return tempArray.buffer;
    }

    decrypt(arrayBuffer: ArrayBuffer): ArrayBuffer {
        if (!arrayBuffer.byteLength) {
            throw new Error("Empty array buffer");
        }

        const slicedBuffer = arrayBuffer.slice(this.headerLength, arrayBuffer.byteLength);
        return this.xOrBytes(slicedBuffer);
    }

    encrypt(arrayBuffer: ArrayBuffer): ArrayBuffer {
        if (!arrayBuffer.byteLength) {
            throw new Error("Empty array buffer");
        }

        const encryptedBuffer = this.xOrBytes(arrayBuffer);
        const fakeHeader = this.buildFakeHeader();
        const totalLength = encryptedBuffer.byteLength + this.headerLength;
        const tempArray = new Uint8Array(totalLength);

        tempArray.set(fakeHeader, 0);
        tempArray.set(new Uint8Array(encryptedBuffer), this.headerLength);

        if (!this.verifyFakeHeader(new Uint8Array(tempArray.buffer, 0, this.headerLength))) {
            throw new Error("Failed to create valid header");
        }

        return tempArray.buffer;
    }

    private xOrBytes(arrayBuffer: ArrayBuffer): ArrayBuffer {
        if (!arrayBuffer.byteLength) {
            throw new Error("Empty array buffer");
        }

        const byteArray = new Uint8Array(arrayBuffer);
        const limit = Math.min(this.headerLength, this.keyArray.length);

        for (let i = 0; i < limit; i++) {
            byteArray[i] ^= parseInt(this.keyArray[i], 16);
        }

        return arrayBuffer;
    }

    static getNormalPNGHeader(headerLen: number): Uint8Array {
        const headerParts = Decrypter.pngHeaderBytes.split(" ");
        const length = Math.min(headerLen, headerParts.length);
        const restoredHeader = new Uint8Array(length);

        for (let i = 0; i < length; i++) {
            restoredHeader[i] = parseInt(headerParts[i], 16);
        }

        return restoredHeader;
    }

    static getKeyFromPNG(headerLen: number, fileContent: ArrayBuffer): string | null {
        if (!fileContent.byteLength || fileContent.byteLength < headerLen * 2) {
            return null;
        }

        const fileHeader = new Uint8Array(fileContent.slice(headerLen, headerLen * 2));
        const pngHeaderArray = Decrypter.getNormalPNGHeader(headerLen);
        const keyParts: string[] = [];

        for (let i = 0; i < headerLen; i++) {
            const xorByte = pngHeaderArray[i] ^ fileHeader[i];
            keyParts.push(Decrypter.byteToHex(xorByte));
        }

        return keyParts.join("");
    }

    static byteToHex(byte: number): string {
        return ("0" + (byte & 0xff).toString(16)).slice(-2);
    }

    static checkHexChars(str: string): boolean {
        return /^[A-Fa-f0-9]+$/.test(str);
    }

    static helperShowBits(byte: number): string {
        if (isNaN(byte)) {
            byte = 0;
        }

        if (byte > 255 || byte < 0) {
            throw new Error("Byte value out of range (0-255)");
        }

        const bits = byte.toString(2);
        return "0".repeat(8 - bits.length) + bits;
    }

    restoreHeader(fileContent: ArrayBuffer): ArrayBuffer {
        return this.modifyFile(fileContent, "restore");
    }

    decryptFile(fileContent: ArrayBuffer): ArrayBuffer {
        return this.modifyFile(fileContent, "decrypt");
    }

    encryptFile(fileContent: ArrayBuffer): ArrayBuffer {
        return this.modifyFile(fileContent, "encrypt");
    }
}
