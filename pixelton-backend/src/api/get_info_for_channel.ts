import { UsersCollection } from "../models";
import {
  ResponseErrorBadAuth,
  ResponseErrorBadValueForTopup,
  ResponseErrorBadUserWallet,
} from "./errors";
import { BasicApiResponse } from "./types";
import { toNano } from "../ton/utils";
import { publicKeyB, walletB } from "../ton/walletB";
import BN from "bn.js";
import { tonweb } from "../ton/tonweb";

export interface GetInfoForChannelResponse extends BasicApiResponse {
  data?: {
    channelInitState: {
      balanceA: string;
      balanceB: string;
      seqnoA: string;
      seqnoB: string;
    };
    channelConfig: {
      channelId: string;
      addressA: string;
      addressB: string;
      initBalanceA: string;
      initBalanceB: string;
      hisPublicKey: string;
    };
  };
}

const get_info_for_channel = async (
  request: any,
  reply: any
): Promise<GetInfoForChannelResponse> => {
  const { body = {} } = request;

  const { telegram_id, current } = body;

  if (telegram_id === undefined || typeof telegram_id !== "string") {
    return ResponseErrorBadAuth;
  }

  let user = await UsersCollection.findOne({ telegram_id });
  if (user === null) {
    user = new UsersCollection({ telegram_id });
    await user.save();
  }

  const { value, publicKey } = body;

  const valueBN = new BN(value, 16);

  if (
    value === undefined ||
    typeof value !== "string" ||
    valueBN.lt(new BN("0"))
  ) {
    return ResponseErrorBadValueForTopup;
  }

  if (
    publicKey === undefined ||
    typeof publicKey !== "object" ||
    Array.isArray(publicKey) === false
  ) {
    return ResponseErrorBadUserWallet;
  }

  let walletA = null;
  try {
    walletA = tonweb.wallet.create({
      publicKey: new Uint8Array(publicKey),
    });
  } catch (e) {
    return ResponseErrorBadUserWallet;
  }

  const walletAddressA = await walletA.getAddress();
  const walletAddressB = await walletB.getAddress(); // address of this wallet in blockchain

  const seqno = 0;

  if (current !== true) {
    user.last_channel_id++;
    await user.save();
  }

  const channelInitState = {
    balanceA: valueBN, // A's initial balance in Toncoins. Next A will need to make a top-up for this amount
    balanceB: new BN("1"), // B's initial balance in Toncoins. Next B will need to make a top-up for this amount
    seqnoA: toNano(seqno.toString()), // initially 0
    seqnoB: toNano(seqno.toString()), // initially 0
  };

  const channelConfig = {
    channelId: new BN(user.last_channel_id.toString()), // Channel ID, for each new channel there must be a new ID
    addressA: walletAddressA, // A's funds will be withdrawn to this wallet address after the channel is closed
    addressB: walletAddressB, // B's funds will be withdrawn to this wallet address after the channel is closed
    initBalanceA: channelInitState.balanceA,
    initBalanceB: channelInitState.balanceB,
    hisPublicKey: Array.from(publicKeyB),
  };

  return {
    success: true,
    data: {
      //@ts-ignore
      channelInitState,
      //@ts-ignore
      channelConfig,
    },
  };
};

export { get_info_for_channel };
