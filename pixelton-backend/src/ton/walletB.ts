import TonWeb from "tonweb";
import { tonweb } from "../ton/tonweb";
import wallets from "../wallets";

//@ts-ignore
const seedB = TonWeb.utils.base64ToBytes(wallets.seedB); // A's private (secret) key
//@ts-ignore
const keyPairB = tonweb.utils.keyPairFromSeed(seedB); // Obtain key pair (public key and private key)

const walletB = tonweb.wallet.create({
  publicKey: keyPairB.publicKey,
});

const publicKeyB = keyPairB.publicKey;

export { walletB, publicKeyB };
