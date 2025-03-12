import { Decrypter } from "../src";
import { expect, test } from "bun:test";
import { PNG } from "pngjs";

function isValidPng(buffer: ArrayBuffer): Promise<boolean> {
    return new Promise((resolve) => {
        const png = new PNG();

        png.parse(Buffer.from(buffer), (err) => {
            resolve(!err);
        });
    });
}

test("decryptMV", async () => {
    const trackPath = "./tests/mv_sprite.rpgmvp";

    const decrypter = new Decrypter("d41d8cd98f00b204e9800998ecf8427e");
    const decrypted = decrypter.decrypt(await Bun.file(trackPath).arrayBuffer());

    expect(await isValidPng(decrypted)).toBeTrue();
});

test("encryptMV", async () => {
    const trackPath = "./tests/mv_sprite.rpgmvp";

    const decrypter = new Decrypter("d41d8cd98f00b204e9800998ecf8427e");
    const decrypted = decrypter.decrypt(await Bun.file(trackPath).arrayBuffer());

    const encrypted = decrypter.encrypt(decrypted);
    const decryptedAgain = decrypter.decrypt(encrypted);

    expect(await isValidPng(decryptedAgain)).toBeTrue();
});

test("decryptMZ", async () => {
    const trackPath = "./tests/mz_sprite.png_";

    const decrypter = new Decrypter("d41d8cd98f00b204e9800998ecf8427e");
    const decrypted = decrypter.decrypt(await Bun.file(trackPath).arrayBuffer());

    expect(await isValidPng(decrypted)).toBeTrue();
});

test("encryptMZ", async () => {
    const trackPath = "./tests/mz_sprite.png_";

    const decrypter = new Decrypter("d41d8cd98f00b204e9800998ecf8427e");
    const decrypted = decrypter.decrypt(await Bun.file(trackPath).arrayBuffer());

    const encrypted = decrypter.encrypt(decrypted);
    const decryptedAgain = decrypter.decrypt(encrypted);

    expect(await isValidPng(decryptedAgain)).toBeTrue();
});
