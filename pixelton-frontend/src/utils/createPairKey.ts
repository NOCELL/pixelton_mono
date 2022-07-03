const TonWeb = require("tonweb");
const tonMnemonic = require("tonweb-mnemonic");

export const createKeyPair = async () => {
  // 1. Use tonweb-mnemonic to generate random 24 words which determine the secret key.
  // These words will be compatible with TON wallet applications, i.e. using them you will be able to import your account into third-party applications.

  /** @type {string[]} */
  const words = await tonMnemonic.generateMnemonic();

  /** @type {Uint8Array} */
  const seed = await tonMnemonic.mnemonicToSeed(words);

  /** @type {nacl.SignKeyPair} */
  const keyPair = TonWeb.utils.nacl.sign.keyPair.fromSeed(seed);

  console.log("Public key", TonWeb.utils.bytesToHex(keyPair.publicKey));
  console.log("Secret key", TonWeb.utils.bytesToHex(keyPair.secretKey));

  return keyPair;
};
