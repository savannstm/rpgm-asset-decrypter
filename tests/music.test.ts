import { Decrypter } from "../src";
import { expect, test } from "bun:test";

test("decryptMV", async () => {
    const trackPath = String.raw`C:\Program Files (x86)\Steam\steamapps\common\Fear & Hunger 2 Termina\www\audio\bgm\all_work_no_play.rpgmvo`;
    const decrypter = new Decrypter("d41d8cd98f00b204e9800998ecf8427e");
    const decrypted = decrypter.decryptFile(await Bun.file(trackPath).arrayBuffer(), false);

    const oggSignature = "OggS";
    const decryptedSignature = new TextDecoder("utf8").decode(decrypted.slice(0, 4));

    expect(decryptedSignature).toBe(oggSignature);
});

test("encryptMV", async () => {
    const trackPath = String.raw`C:\Program Files (x86)\Steam\steamapps\common\Fear & Hunger 2 Termina\www\audio\bgm\all_work_no_play.rpgmvo`;
    const decrypter = new Decrypter("d41d8cd98f00b204e9800998ecf8427e");
    const decrypted = decrypter.decryptFile(await Bun.file(trackPath).arrayBuffer(), false);

    const encrypted = decrypter.encryptFile(decrypted);

    // decrypting again to validate the file
    const decryptedAgain = decrypter.decryptFile(encrypted, false);

    const oggSignature = "OggS";
    const decryptedSignature = new TextDecoder("utf8").decode(decryptedAgain.slice(0, 4));
    expect(decryptedSignature).toBe(oggSignature);
});

test("decryptMZ", () => {});

test("encryptMZ", () => {});
