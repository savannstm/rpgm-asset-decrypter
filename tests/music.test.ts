import { Decrypter } from "../src";
import { expect, test } from "bun:test";

const oggSignature = "OggS";

test("decryptMV", async () => {
    const trackPath = "./tests/mv_audio.rpgmvo";

    const decrypter = new Decrypter("d41d8cd98f00b204e9800998ecf8427e");
    const decrypted = decrypter.decrypt(await Bun.file(trackPath).arrayBuffer(), false);

    const decryptedSignature = new TextDecoder("utf8").decode(decrypted.slice(0, 4));
    expect(decryptedSignature).toBe(oggSignature);
});

test("encryptMV", async () => {
    const trackPath = "./tests/mv_audio.rpgmvo";

    const decrypter = new Decrypter("d41d8cd98f00b204e9800998ecf8427e");
    const decrypted = decrypter.decrypt(await Bun.file(trackPath).arrayBuffer(), false);

    const encrypted = decrypter.encrypt(decrypted);
    const decryptedAgain = decrypter.decrypt(encrypted, false);

    const decryptedSignature = new TextDecoder("utf8").decode(decryptedAgain.slice(0, 4));
    expect(decryptedSignature).toBe(oggSignature);
});

test("decryptMZ", async () => {
    const trackPath = "./tests/mz_audio.ogg_";

    const decrypter = new Decrypter("d41d8cd98f00b204e9800998ecf8427e");
    const decrypted = decrypter.decrypt(await Bun.file(trackPath).arrayBuffer(), false);

    const decryptedSignature = new TextDecoder("utf8").decode(decrypted.slice(0, 4));
    expect(decryptedSignature).toBe(oggSignature);
});

test("encryptMZ", async () => {
    const trackPath = "./tests/mz_audio.ogg_";

    const decrypter = new Decrypter("d41d8cd98f00b204e9800998ecf8427e");
    const decrypted = decrypter.decrypt(await Bun.file(trackPath).arrayBuffer(), false);

    const encrypted = decrypter.encrypt(decrypted);
    const decryptedAgain = decrypter.decrypt(encrypted, false);

    const decryptedSignature = new TextDecoder("utf8").decode(decryptedAgain.slice(0, 4));
    expect(decryptedSignature).toBe(oggSignature);
});
