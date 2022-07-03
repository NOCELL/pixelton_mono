import { NETWORK_FEE } from "./ton/const";
import { toNano } from "./ton/utils";
import { delayAsync, retryAsyncFunction } from "./utils";

const { BN } = require("bn.js");
const { tonweb } = require("./ton/tonweb");

const axios = require("axios");
const wallets = require("./wallets");

const PRICE_ONE_PIXEL = toNano("0.001");

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const main = async () => {
  const value = 1;

  const seedA = tonweb.utils.base64ToBytes(wallets.seedA); // A's private (secret) key
  const keyPairA = tonweb.utils.keyPairFromSeed(seedA); // Obtain key pair (public key and private key)

  const {
    data: { data: dataGetInfoForChannel },
  } = await axios.post("http://localhost:3000/api", {
    method: "get_info_for_channel",
    telegram_id: "559212240",
    publicKey: Array.from(keyPairA.publicKey),
    value,
  });

  console.log("dataGetInfoForChannel", dataGetInfoForChannel);

  const publicKeyB = new Uint8Array(
    dataGetInfoForChannel.channelConfig.hisPublicKey
  );

  const walletA = tonweb.wallet.create({
    publicKey: keyPairA.publicKey,
  });

  const walletB = tonweb.wallet.create({
    publicKey: publicKeyB,
  });

  const walletAddressA = await walletA.getAddress(); // address of this wallet in blockchain
  const walletAddressB = await walletB.getAddress();

  const initBalanceA = new BN(
    dataGetInfoForChannel.channelConfig.initBalanceA,
    16
  );

  const channelInitState = {
    channelId: new BN(dataGetInfoForChannel.channelConfig.channelId, 16), // Channel ID, for each new channel there must be a new ID
    addressA: walletAddressA,
    addressB: walletAddressB,
    initBalanceA: initBalanceA,
    initBalanceB: new BN(dataGetInfoForChannel.channelConfig.initBalanceB, 16),
  };

  const channelA = tonweb.payments.createChannel({
    ...channelInitState,
    isA: true,
    myKeyPair: keyPairA,
    hisPublicKey: publicKeyB,
  });

  console.log(
    "Wallet A: ",
    JSON.stringify(
      {
        ...channelInitState,
        isA: true,
        myKeyPair: keyPairA,
        hisPublicKey: publicKeyB,
      },
      null,
      4
    )
  );

  const channelAddress = await channelA.getAddress(); // address of this payment channel smart-contract in blockchain
  console.log("channelAddress", channelAddress);

  const fromWalletA = channelA.fromWallet({
    wallet: walletA,
    secretKey: keyPairA.secretKey,
  });

  await fromWalletA.deploy().send(toNano("0.05"));

  console.log("Wait contract deployment");
  await retryAsyncFunction(() => channelA.getData(), 30, 1000);
  console.log("Contract deployed successfully");

  const sendTopup = initBalanceA.add(NETWORK_FEE);

  console.log("sendTopup", sendTopup.toNumber());

  await fromWalletA
    .topUp({ coinsA: initBalanceA, coinsB: new BN(0) })
    .send(sendTopup); // +0.05 TON to network fees

  const {
    data: { data: dataTopup, error },
  } = await axios.post("http://localhost:3000/api", {
    method: "topup",
    telegram_id: "559212240",
    publicKey: Array.from(keyPairA.publicKey),
    channelAddress: channelAddress.toString(),
    value,
  });

  if (error) {
    throw error;
  }

  let data = null;
  while (
    data === null ||
    data.balanceA.lt(new BN("1")) ||
    data.balanceB.lt(new BN("1"))
  ) {
    data = await retryAsyncFunction(() => channelA.getData(), 60, 1000);
  }

  await fromWalletA
    .init({
      balanceA: initBalanceA,
      balanceB: channelInitState.initBalanceB,
      seqnoA: new BN(0), // initially 0
      seqnoB: new BN(0), // initially 0
    })
    .send(NETWORK_FEE);

  console.log(dataTopup);

  let seqno = new BN("1");

  const async1 = async () => {
    const newChannelState = {
      balanceA: new BN(
        channelInitState.initBalanceA.sub(PRICE_ONE_PIXEL.mul(seqno)).toJSON(),
        16
      ),
      balanceB: new BN(
        toNano("0").add(PRICE_ONE_PIXEL.mul(seqno)).toJSON(),
        16
      ),
      seqnoA: seqno,
      seqnoB: new BN("0"),
    };
    /*{
      balanceA: new BN(
        channelInitState.initBalanceA.sub(PRICE_ONE_PIXEL.mul(seqno)).toJSON(),
        16
      ),
      balanceB: new BN(toNano("0").add(PRICE_ONE_PIXEL.mul(seqno)).toJSON(), 16),
      seqnoA: seqno,
      seqnoB: new BN("0"),
    };*/

    const sum = newChannelState.balanceA.add(newChannelState.balanceB);
    console.log("sum", sum.toNumber());

    console.log(JSON.stringify(newChannelState, null, 4));

    console.time("signState");
    const signatureA1 = await channelA.signState(newChannelState);
    console.timeEnd("signState");

    console.log(JSON.stringify(newChannelState, null, 4));

    const channelAddressA = (await channelA.getAddress()).toString();
    console.log("channelA adress", channelAddressA);

    const {
      data: { data: dataPaint, error: errorPaint },
    } = await axios.post("http://localhost:3000/api", {
      method: "paint_pixel",
      telegram_id: "559212240",
      signature: signatureA1,
      channelState: newChannelState,
      x: 1,
      y: 1,
      color: "#FF0000",
    });

    console.log(dataPaint, errorPaint);
  };

  const async2 = async () => {
    seqno = seqno.add(new BN("1"));

    const newChannelState2 = {
      balanceA: new BN(
        channelInitState.initBalanceA.sub(PRICE_ONE_PIXEL.mul(seqno)).toJSON(),
        16
      ),
      balanceB: new BN(
        toNano("0").add(PRICE_ONE_PIXEL.mul(seqno)).toJSON(),
        16
      ),
      seqnoA: seqno,
      seqnoB: new BN("0"),
    };

    console.time("signState");
    const signatureA2 = await channelA.signState(newChannelState2);
    console.timeEnd("signState");

    console.log(JSON.stringify(newChannelState2, null, 4));

    const channelAddressA2 = (await channelA.getAddress()).toString();
    console.log("channelA2 adress", channelAddressA2);

    const x = getRandomInt(0, 1000);
    const y = getRandomInt(0, 1000);

    const {
      data: { data: dataPaint2, error: errorPaint2 },
    } = await axios.post("http://localhost:3000/api", {
      method: "paint_pixel",
      telegram_id: "559212240",
      signature: signatureA2,
      channelState: newChannelState2,
      x,
      y,
      color: "#FFFF00",
    });

    console.log(dataPaint2, errorPaint2);
  };

  const tasks = [];
  for (let i = 0; i < 100; i++) {
    tasks.push(async2());
  }

  console.time(`${tasks.length} pixels`);
  await Promise.all(tasks);
  console.timeEnd(`${tasks.length} pixels`);
};

main().catch(console.error);
