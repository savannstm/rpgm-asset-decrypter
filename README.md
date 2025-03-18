# rpgm-asset-decrypter

This project is a fork of [RPG-Maker-MV-Decrypter](https://gitlab.com/Petschko/RPG-Maker-MV-Decrypter) by the great Petschko.

It's purpose is to rewrite `RPG-Maker-MV-Decrypter` in TypeScript according to modern ES6 standards, and make it runtime-agnostic.

It allows you to decrypt audio and graphics of RPG Maker MV and MZ games.

## Installation

`npm i rpgm-asset-decrypter`

## Usage

Decrypt:

```js
import { Decrypter } from "rpgm-asset-decrypter";
import { readFileSync, writeFileSync } from "fs";

const decrypter = new Decrypter();
const file = "./picture.rpgmvp";
const buf = readFileSync(file, "binary");
const data = buf.buffer;

// For images, decrypter automatically determines the key.
// For audio, read `encryptionKey` property from `System.json` and pass it to `Decrypter` constructor.
const decrypted = decrypter.decrypt(data);
writeFileSync("./decrypted-picture.png", decrypted);
```

Encrypt:

```js
import { Decrypter } from "rpgm-asset-decrypter";
import { readFileSync, writeFileSync } from "fs";

// When encrypting, decrypter requires a key.
// It can be read from `encryptionKey` property in `System.json`.
const decrypter = new Decrypter("d41d8cd98f00b204e9800998ecf8427e");
const file = "./picture.png";
const buf = readFileSync(file, "binary");
const data = buf.buffer;

const encrypted = decrypter.encrypt(data);
writeFileSync("./encrypted-picture.rpgmvp", encrypted);
```

## License

Project is licensed under MIT.
