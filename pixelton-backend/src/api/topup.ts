import { ContractsCollection, UsersCollection } from "../models";
import {
  ResponseErrorBadAuth,
  ResponseErrorBadValueForTopup,
  ResponseErrorBadUserWallet,
  ResponseErrorBadChannelAddress,
  ResponseErrorNoContractDeposit,
} from "./errors";
import { BasicApiError, BasicApiResponse } from "./types";
import { tonweb } from "../ton/tonweb";
import TonWeb from "tonweb";
import { toNano } from "../ton/utils";
import { walletB } from "../ton/walletB";
import BN from "bn.js";
import wallets from "../wallets";
import { NETWORK_FEE } from "../ton/const";
import { retryAsyncFunction } from "../utils";

export interface TopupResponse extends BasicApiResponse {
  data?: {
    newBalance: string;
  };
}

const topup = async (request: any, reply: any): Promise<TopupResponse> => {
  const { body = {} } = request;

  const { telegram_id, channelAddress } = body;

  if (channelAddress === undefined || typeof channelAddress !== "string") {
    return ResponseErrorBadChannelAddress;
  }

  if (telegram_id === undefined || typeof telegram_id !== "string") {
    return ResponseErrorBadAuth;
  }

  let user = await UsersCollection.findOne({ telegram_id });
  if (user === null) {
    user = new UsersCollection({ telegram_id });
    await user.save();
  }

  const { value, publicKey } = body;

  if (value === undefined || typeof value !== "string") {
    return ResponseErrorBadValueForTopup;
  }

  const valueBN = new BN(value, 16);

  if (valueBN.lt(new BN("0"))) {
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

  const seedB = tonweb.utils.base64ToBytes(wallets.seedB); // A's private (secret) key
  //@ts-ignore
  const keyPairB = tonweb.utils.keyPairFromSeed(seedB); // Obtain key pair (public key and private key)

  const walletAddressA = await walletA.getAddress();
  const walletAddressB = await walletB.getAddress(); // address of this wallet in blockchain

  const seqno = 0;

  const channelInitState = {
    balanceA: valueBN, // A's initial balance in Toncoins. Next A will need to make a top-up for this amount
    balanceB: new BN("1"), // B's initial balance in Toncoins. Next B will need to make a top-up for this amount
    seqnoA: new BN(seqno), // initially 0
    seqnoB: new BN(seqno), // initially 0
  };

  const channelConfig = {
    channelId: new BN(user.last_channel_id.toString()), // Channel ID, for each new channel there must be a new ID
    addressA: walletAddressA, // A's funds will be withdrawn to this wallet address after the channel is closed
    addressB: walletAddressB, // B's funds will be withdrawn to this wallet address after the channel is closed
    initBalanceA: channelInitState.balanceA,
    initBalanceB: channelInitState.balanceB,
  };

  //@ts-ignore
  const channelB = tonweb.payments.createChannel({
    ...channelConfig,
    isA: false,
    myKeyPair: keyPairB,
    hisPublicKey: new Uint8Array(publicKey),
  });

  console.log(
    JSON.stringify(
      {
        channelId: channelConfig.channelId,
        addressA: walletAddressA,
        addressB: walletAddressB,
        initBalanceA: channelConfig.initBalanceA,
        initBalanceB: channelConfig.initBalanceB,
        isA: false,
        myKeyPair: keyPairB,
        hisPublicKey: new Uint8Array(publicKey),
      },
      null,
      4
    )
  );

  const channelAddressB = (await channelB.getAddress()).toString();
  const channelAddressA = channelAddress;

  console.log(channelAddressA);
  console.log(channelAddressB);

  if (channelAddressB.toString() !== channelAddressA.toString()) {
    return ResponseErrorBadChannelAddress;
  }

  const fromWalletB = channelB.fromWallet({
    wallet: walletB,
    secretKey: keyPairB.secretKey,
  });

  await fromWalletB
    .topUp({ coinsA: new BN("0"), coinsB: channelConfig.initBalanceB }) // 1 nanocoin for deploy channel
    .send(channelConfig.initBalanceB.add(NETWORK_FEE)); // +0.05 TON to network fees

  // @TODO fix it
  // const data = await retryAsyncFunction(() => channelB.getData(), 60, 1000);
  /* if (data.balanceA.gte(toNano(value.toString())) === false) {
    return ResponseErrorNoContractDeposit;
  } */

  const newContract = new ContractsCollection({
    owner: telegram_id,
    address: channelAddressB,
    balanceA: channelInitState.balanceA.toJSON(),
    balanceB: channelInitState.balanceB.toJSON(),
    seqnoA: channelInitState.seqnoA.toJSON(),
    seqnoB: channelInitState.seqnoB.toJSON(),
    channelId: user.last_channel_id.toString(),
    publicKeyA: publicKey,
    publicKeyB: Array.from(keyPairB.publicKey),
    initBalanceA: channelConfig.initBalanceA.toJSON(),
    initBalanceB: channelConfig.initBalanceB.toJSON(),
    isA: false,
  });

  await newContract.save();

  const numberBalance = Number(valueBN.toString(10)) / 1_000_000_000;

  user.deposit_in_contract = numberBalance;
  user.current_contract = channelAddressB;
  user.real_balance = numberBalance;
  await user.save();

  return {
    success: true,
    data: {
      newBalance: value,
    },
  };
};

export { topup };
