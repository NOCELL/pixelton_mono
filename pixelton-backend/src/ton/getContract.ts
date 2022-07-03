import BN from "bn.js";
import { ContractsCollection } from "../models";
import wallets from "../wallets";
import { tonweb } from "./tonweb";
import { toNano } from "./utils";
import { walletB } from "./walletB";

export interface Contract {
  address: string;
  balanceA: BN; // A's initial balance in Toncoins. Next A will need to make a top-up for this amount
  balanceB: BN; // B's initial balance in Toncoins. Next B will need to make a top-up for this amount
  seqnoA: BN; // initially 0
  seqnoB: BN; // initially 0
  channelId: BN; // Channel ID, for each new channel there must be a new ID
  addressA: any; // A's funds will be withdrawn to this wallet address after the channel is closed
  addressB: any; // B's funds will be withdrawn to this wallet address after the channel is closed
  initBalanceA: BN;
  initBalanceB: BN;
}

export const getContract = async (
  address: string
): Promise<Contract | null> => {
  const contract = await ContractsCollection.findOne({ address: address });

  if (contract === null) {
    return null;
  }

  let walletA = null;
  try {
    walletA = tonweb.wallet.create({
      publicKey: new Uint8Array(contract.publicKeyA),
    });
  } catch (e) {
    return null;
  }

  const seedB = tonweb.utils.base64ToBytes(wallets.seedB); // A's private (secret) key
  //@ts-ignore
  const keyPairB = tonweb.utils.keyPairFromSeed(seedB); // Obtain key pair (public key and private key)

  const walletAddressA = await walletA.getAddress();
  const walletAddressB = await walletB.getAddress(); // address of this wallet in blockchain

  const channelInitState = {
    balanceA: new BN(new BN(contract.balanceA, 16).toJSON(), 16), // A's initial balance in Toncoins. Next A will need to make a top-up for this amount
    balanceB: new BN(toNano("0").toJSON(), 16).add(new BN("1")), // B's initial balance in Toncoins. Next B will need to make a top-up for this amount
  };

  const channelConfig = {
    channelId: new BN(contract.channelId, 10), // Channel ID, for each new channel there must be a new ID
    addressA: walletAddressA, // A's funds will be withdrawn to this wallet address after the channel is closed
    addressB: walletAddressB, // B's funds will be withdrawn to this wallet address after the channel is closed
    initBalanceA: new BN(channelInitState.balanceA, 16),
    initBalanceB: new BN(channelInitState.balanceB, 16),
  };

  //@ts-ignore
  const channelB = tonweb.payments.createChannel({
    ...channelConfig,
    isA: false,
    myKeyPair: keyPairB,
    hisPublicKey: new Uint8Array(contract.publicKeyA),
  });

  return channelB as Contract;
};
