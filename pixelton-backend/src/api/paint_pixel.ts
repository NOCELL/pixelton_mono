import {
  ContractStateCollection,
  PixelsCollection,
  UsersCollection,
} from "../models";
import {
  ResponseErrorBadAuth,
  ResponseErrorBadChannelState,
  ResponseErrorBadChannelStateSignature,
  ResponseErrorBadUserWallet,
  ResponseErrorNoCurrentContract,
  ResponseErrorNoMoney,
} from "./errors";
import { BasicApiResponse } from "./types";
import { toNano } from "../ton/utils";
import { publicKeyB, walletB } from "../ton/walletB";
import { ContractsCollection } from "../models";
import BN from "bn.js";
import { tonweb } from "../ton/tonweb";
import { getContract } from "../ton/getContract";
import wallets from "../wallets";
import { delayAsync, retryAsyncFunction } from "../utils";
import { getWSConnections, sendMassPixelPoints } from "../ws";

const PRICE_ONE_PIXEL = toNano("0.00001");

export interface GetChannelResponse extends BasicApiResponse {
  data?: {
    lost: BN;
  };
}

export const paint_pixel = async (
  request: any,
  reply: any
): Promise<GetChannelResponse> => {
  try {
    const { body = {} } = request;

    const { telegram_id, channelState, signature, x, y, color } = body;

    if (telegram_id === undefined || typeof telegram_id !== "string") {
      return ResponseErrorBadAuth;
    }

    if (channelState === undefined || typeof channelState !== "object") {
      return ResponseErrorBadChannelState;
    }

    if (signature === undefined || typeof signature !== "object") {
      return ResponseErrorBadChannelStateSignature;
    }

    const { balanceA, balanceB, seqnoA, seqnoB } = channelState;

    if (
      typeof balanceA === undefined ||
      typeof balanceB === undefined ||
      typeof seqnoA === undefined ||
      typeof seqnoB === undefined
    ) {
      return ResponseErrorBadChannelState;
    }

    const user = await UsersCollection.findOne({ telegram_id });
    if (user === null) {
      return ResponseErrorBadAuth;
    }

    if (user.current_contract === undefined) {
      return ResponseErrorNoCurrentContract;
    }

    const channelB = await getContract(user.current_contract);

    const newChannelState = {
      balanceA: new BN(balanceA, 16),
      balanceB: new BN(balanceB, 16),
      seqnoA: new BN(seqnoA, 16),
      seqnoB: new BN(seqnoB, 16),
    };

    const signatureA = new Uint8Array(Object.values(signature));

    //@ts-ignore
    await retryAsyncFunction(() => channelB.getData(), 60, 1000);

    const contractFromDB = await ContractsCollection.findOne({
      address: user.current_contract,
    });

    if (contractFromDB !== null && contractFromDB.inited === false) {
      let channelStateCode = null;
      let retries = 0;
      while (
        (channelStateCode === null || channelStateCode === 0) &&
        retries < 60
      ) {
        //@ts-ignore
        channelStateCode = await channelB.getChannelState();
        if (channelStateCode === null) {
          await delayAsync(1000);
          retries++;
        }
      }
    } else {
      contractFromDB.inited = true;
      await contractFromDB.save();
    }

    const sum = newChannelState.balanceA.add(newChannelState.balanceB);

    //@ts-ignore
    const signatureB = await channelB.signState(newChannelState);

    //@ts-ignore
    /*if (!(await channelB.verifyState(newChannelState, signatureA))) {
      return ResponseErrorBadChannelStateSignature;
    }*/

    const newBalanceB = newChannelState.balanceB.toNumber();

    const newContractState = new ContractStateCollection({
      address: user.current_contract,
      balanceA: newChannelState.balanceA.toNumber(),
      balanceB: newChannelState.balanceB.toNumber(),
      seqnoA: newChannelState.seqnoA.toNumber(),
      seqnoB: newChannelState.seqnoB.toNumber(),
      signatureA,
      signatureB,
    });
    await newContractState.save();

    const updatedUser = await UsersCollection.findOneAndUpdate(
      { telegram_id },
      {
        $inc: {
          spent_coins: PRICE_ONE_PIXEL.toNumber(),
        },
        $max: {
          real_balance: newBalanceB,
        },
      },
      {
        upsert: true,
      }
    );

    if (updatedUser === null) {
      return ResponseErrorBadUserWallet;
    }

    const realBalance = toNano(updatedUser.real_balance.toString());
    const spentCoins = new BN(updatedUser.spent_coins);

    if (realBalance.lt(spentCoins)) {
      return ResponseErrorNoMoney;
    }

    const lost = BN.min(realBalance, realBalance.sub(spentCoins));

    const newPixelId = `${x}_${y}`;
    await PixelsCollection.updateOne(
      { id: newPixelId },
      { $set: { x, y, id: newPixelId, color } },
      {
        upsert: true,
      }
    );

    sendMassPixelPoints({x, y, color});

    return {
      success: true,
      data: {
        lost,
      },
    };
  } catch (e) {
    console.error(e);
    debugger;
  }
};
