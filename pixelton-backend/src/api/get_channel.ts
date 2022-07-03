import { UsersCollection } from "../models";
import {
  ResponseErrorBadAuth,
  ResponseErrorBadUserWallet,
  ResponseErrorNoCurrentContract,
} from "./errors";
import { BasicApiResponse } from "./types";
import { toNano } from "../ton/utils";
import { publicKeyB, walletB } from "../ton/walletB";
import { ContractsCollection } from "../models";
import BN from "bn.js";
import { tonweb } from "../ton/tonweb";
import { getContract } from "../ton/getContract";
import wallets from "../wallets";

export interface GetChannelResponse extends BasicApiResponse {
  data?: {
    channelInitState: any;
    channelConfig: any;
  };
}

export const get_channel = async (
  request: any,
  reply: any
): Promise<GetChannelResponse> => {
  const { body = {} } = request;

  const { telegram_id } = body;

  if (telegram_id === undefined || typeof telegram_id !== "string") {
    return ResponseErrorBadAuth;
  }

  const user = await UsersCollection.findOne({ telegram_id });
  if (user === null) {
    return ResponseErrorBadAuth;
  }

  const currentContractAdress = user.current_contract;

  if (currentContractAdress === undefined) {
    return ResponseErrorNoCurrentContract;
  }

  const contract = await ContractsCollection.findOne({
    address: currentContractAdress,
  });

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

  const seqno = 0;

  const channelInitState = {
    balanceA: toNano(new BN(contract.balanceA, 16)), // A's initial balance in Toncoins. Next A will need to make a top-up for this amount
    balanceB: toNano("0"), // B's initial balance in Toncoins. Next B will need to make a top-up for this amount
    seqnoA: new BN(seqno), // initially 0
    seqnoB: new BN(seqno), // initially 0
  };

  const channelConfig = {
    channelId: toNano(new BN(contract.balanceA, 10)), // Channel ID, for each new channel there must be a new ID
    addressA: walletAddressA, // A's funds will be withdrawn to this wallet address after the channel is closed
    addressB: walletAddressB, // B's funds will be withdrawn to this wallet address after the channel is closed
    initBalanceA: channelInitState.balanceA,
    initBalanceB: channelInitState.balanceB,
  };

  return {
    success: true,
    data: {
      channelInitState,
      channelConfig,
    },
  };
};
