import css from "./DrawMode.module.scss";
import { atom, useRecoilState, useRecoilValue } from "recoil";
import React, { useEffect, useState } from "react";
import { CanvasPixelsState, DrawColorState } from "../Canvas";
import {Icon12Ghost, Icon16CheckOutline} from "@vkontakte/icons";
import Button from "../../utils/Button/Button";
import {
  PaymentChannelContractValue,
  PaymentChannelCreatedState,
  PaymentChannelInitState,
  PaymentChannelState,
  WalletKeyPairState,
} from "../../Main/Main";
import axios from "axios";
import { UserWalletKeyPair, UserWalletState } from "../../Profile/Profile";
import { NETWORK_FEE, PRICE_ONE_PIXEL, tonweb } from "../../../tonweb";
import { BN } from "bn.js";
import { toNano } from "../../../utils/toNano";
import { retryAsyncFunction } from "../../../utils/async";
import {CONFIG} from "../../../utils/config";
import Spinner from "../../utils/Spinner/Spinner";

export const DrawModeEnabledState = atom({
  key: "DrawModeEnabledState",
  default: false,
});

export const DrawModeMinifiedState = atom({
  key: "DrawModeMinifiedState",
  default: false,
});

export const IsLoadingPaymentChannelState = atom({
  key : 'IsLoadingPaymentChannelState',
  default : false,
});

export const ChannelBalanceState = atom({
  key : 'ChannelBalanceState',
  default : {
    balance : 0,
    spent_balance : 0,
  }
});

export const ChannelBalanceScreencast = atom({
    key : 'ChannelBalanceScreencast',
    default : 1500000000
});

const DrawMode = ({ zoomToElement }: { zoomToElement: any }) => {
  const [drawMode, setDrawMode] = useRecoilState(DrawModeEnabledState);
  const [drawColor, setDrawColor] = useRecoilState(DrawColorState);
  const [drawModeMinified, setDrawModeMinified] = useRecoilState(
    DrawModeMinifiedState
  );
  const [channelCreated, setChannelCreated] = useRecoilState(
    PaymentChannelCreatedState
  );
  const [paymentChannel, setPaymentChannel] =
    useRecoilState(PaymentChannelState);
  const [paymentChannelInitState, setPaymentChannelInitState] = useRecoilState(
    PaymentChannelInitState
  );
  const [wallet, setWallet] = useRecoilState(UserWalletState);
  const [walletPairKey, setWalletPairKey] = useRecoilState(WalletKeyPairState);
  const [channelValue, setChannelValue] = useRecoilState(
    PaymentChannelContractValue
  );
  const [isLoadingPaymentChannel, setIsLoadingPaymentChannel] = useRecoilState(IsLoadingPaymentChannelState);

  let wrapClasses = [css.DrawModeWrap];

  if (drawModeMinified) wrapClasses.push(css.DrawModeWrapMinified);

  const startDrawMode = async () => {
    if (drawMode === true) {
      setDrawMode(false);
      return;
    }

    setIsLoadingPaymentChannel(true);

    const value =
      channelValue && channelCreated
        ? new BN(channelValue, 16)
        : wallet.balance.sub(NETWORK_FEE.mul(new BN("4")));

    const {
      data: { data: dataGetInfoForChannel, error: errorGetInfoForChannel },
    } = await axios.post(CONFIG.pixelton_api_url, {
      method: "get_info_for_channel",
      telegram_id: "559212240",
      publicKey: Array.from(walletPairKey.publicKey),
      value,
      current: channelCreated,
    });

    console.log("dataGetInfoForChannel", dataGetInfoForChannel);

    if (errorGetInfoForChannel) {
      throw errorGetInfoForChannel;
    }

    const publicKeyB = new Uint8Array(
      dataGetInfoForChannel.channelConfig.hisPublicKey
    );

    const walletA = tonweb.wallet.create({
      publicKey: walletPairKey.publicKey,
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
      initBalanceB: new BN(
        dataGetInfoForChannel.channelConfig.initBalanceB,
        16
      ),
    };

    //@ts-ignore
    const channelA = tonweb.payments.createChannel({
      ...channelInitState,
      isA: true,
      myKeyPair: walletPairKey,
      hisPublicKey: publicKeyB,
    });

    console.log(
      "Wallet A: ",
      JSON.stringify(
        {
          ...channelInitState,
          isA: true,
          myKeyPair: walletPairKey,
          hisPublicKey: publicKeyB,
        },
        null,
        4
      )
    );

    const channelAddress = await channelA.getAddress(); // address of this payment channel smart-contract in blockchain
    console.log("channelAddress", channelAddress);

    if (channelCreated === false) {
      const fromWalletA = channelA.fromWallet({
        wallet: walletA,
        secretKey: walletPairKey.secretKey,
      });

      await fromWalletA.deploy().send(NETWORK_FEE);

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
      } = await axios.post(CONFIG.pixelton_api_url, {
        method: "topup",
        telegram_id: "559212240",
        publicKey: Array.from(walletPairKey.publicKey),
        channelAddress: channelAddress.toString(),
        value,
      });

      console.log({
        dataTopup,
        error,
      });

      if (error) {
        throw error;
      }

      let data = null;
      while (
        data === null ||
        data.balanceA.lte(new BN("0")) ||
        data.balanceB.lte(new BN("0"))
      ) {
        data = await retryAsyncFunction(() => channelA.getData(), 30, 1000);
      }

      await fromWalletA
        .init({
          balanceA: initBalanceA,
          balanceB: channelInitState.initBalanceB,
          seqnoA: new BN(0), // initially 0
          seqnoB: new BN(0), // initially 0
        })
        .send(NETWORK_FEE);

      localStorage.PaymentChannelCreatedState = "true";
      setChannelCreated(true);
    }

    setPaymentChannel(channelA);
    setPaymentChannelInitState(channelInitState);
    setChannelValue(value.toString(16));
    localStorage.PaymentChannelContractValue = value.toString(16);

    setDrawMode(true);

    setIsLoadingPaymentChannel(false);
  };

  console.log(isLoadingPaymentChannel);
  console.log(wallet);

  return (
    <div className={wrapClasses.join(" ")}>
      <div className={css.DrawMode}>
        {wallet === undefined && (
            <div className={css.loadingSomething}>
              <Spinner size={10} /> Loading your wallet...
            </div>
        )}
        {isLoadingPaymentChannel && wallet && (
            <div className={css.loadingSomething}>
              <Spinner size={10} /> Creating secure payment channel...
            </div>
        )}
        {drawMode && (
          <div
            className={css.minifyButton}
            onClick={() => {
              setDrawModeMinified(!drawModeMinified);
            }}
          >
            {drawModeMinified ? "Show" : "Hide"}
          </div>
        )}
        {drawMode && (
          <div className={css.DrawModeContent}>
            <div className={css.colors}>
              <div className={css.colorsTitle}>Select color</div>
              <div className={css.colorsListWrap}>
                <div className={css.colorsList}>
                  {[
                    [
                      "FFFFFF",
                      "B3B3B3",
                      "656565",
                      "303030",
                      "000000",
                      "7A3A0A",
                      "FF6B00",
                      "FED876",
                    ],
                    [
                      "1771F1",
                      "5199FF",
                      "64C7FF",
                      "B7D4FF",
                      "00CF91",
                      "00848C",
                      "EF2FA2",
                      "A854A5",
                    ],
                    [
                      "FF0000",
                      "FF7272",
                      "FFA96B",
                      "FBFF00",
                      "22EE00",
                      "008800",
                      "990944",
                      "8822DD",
                    ],
                  ].map((row: string[]) => {
                    return (
                      <div className={css.colorsRow}>
                        {row.map((c: string) => {
                          let classes = [css.colorItem];

                          if (drawColor === c)
                            classes.push(css.colorItemSelected);
                          if (c === "000000")
                            classes.push(css.colorItemSelectedWhite);

                          console.log(drawColor);

                          return (
                            <div
                              className={classes.join(" ")}
                              style={{ background: "#" + c }}
                              onClick={() => {
                                setDrawColor(c);
                              }}
                            >
                              {drawColor === c && (
                                <div>
                                  <Icon16CheckOutline />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className={css.infoWrap}>
              <div className={css.info}>
                <div className={css.infoTitle}>You are in Draw mode</div>
                <div className={css.infoDescr}>
                  One pixel costs 0.001 TON from your balance.
                  <br />
                  Purchase will happen instanlty after placing a pixel.
                </div>
              </div>
            </div>
          </div>
        )}
        <div className={css.DrawModeButton}>
          <Button red={drawMode} onClick={startDrawMode} disabled={isLoadingPaymentChannel || wallet === undefined}>
            {drawMode ? "Exit draw mode" : "Enter Draw mode"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export const DrawModePencil = () => {

  const [wallet, setWallet] = useRecoilState(UserWalletState);

  type MouseCoords = { x: number; y: number } | undefined;
  type ReactMouseOrTouchEvent =
    | React.MouseEvent<HTMLDivElement>
    | React.TouchEvent<HTMLDivElement>;

  const [pixels, setPixels] = useRecoilState(CanvasPixelsState);
  const [pencilMouseDownCoords, setPencilMouseDownCoords] =
    useState<MouseCoords>({ x: 0, y: 0 });
  const drawColor = useRecoilValue(DrawColorState);
  const [paymentChannel, setPaymentChannel] =
    useRecoilState(PaymentChannelState);

  const [channelBalance, setChannelBalance] = useRecoilState(ChannelBalanceState);

  const [b, setB] = useRecoilState(ChannelBalanceScreencast);


  const [channelInitState] = useRecoilState(PaymentChannelInitState);

  const setPixel = async (x: number, y: number, auto = false, color = null) => {
    let key = x + "," + y;
    let newPixels = { ...pixels } as any;
    newPixels[key] = color || drawColor;
    setPixels(newPixels);

    setB(b - 1000000);

    if (auto) {
      return;
    }



    const channelA = paymentChannel;

    const seqnoStored = Number(localStorage.seqno || 1);
    localStorage.seqno = String(seqnoStored + 1);

    const newSeqno = new BN(seqnoStored.toString()).add(new BN("1"));

    const newChannelState2 = {
      balanceA: new BN(
        channelInitState.initBalanceA
          .sub(PRICE_ONE_PIXEL.mul(newSeqno))
          .toJSON(),
        16
      ),
      balanceB: new BN(
        toNano("0").add(PRICE_ONE_PIXEL.mul(newSeqno)).toJSON(),
        16
      ),
      seqnoA: newSeqno,
      seqnoB: new BN("0"),
    };

    console.time("signState");
    const signatureA2 = await channelA.signState(newChannelState2);
    console.timeEnd("signState");

    console.log(JSON.stringify(newChannelState2, null, 4));

    const channelAddressA2 = (await channelA.getAddress()).toString();
    console.log("channelA2 adress", channelAddressA2);

    const {
      data: { data: dataPaint2, error: errorPaint2 },
    } = await axios.post(CONFIG.pixelton_api_url, {
      method: "paint_pixel",
      telegram_id: "559212240",
      signature: signatureA2,
      channelState: newChannelState2,
      x,
      y,
      color: drawColor,
    });

    console.log(dataPaint2, errorPaint2);
  };

  const dragStart = (e: ReactMouseOrTouchEvent) => {
    e.stopPropagation();

    if (e.nativeEvent instanceof MouseEvent) {
      let evt = e as React.MouseEvent;
      let { x, y } = canvasClickCoords(evt);
      console.log(x, y);
      setPencilMouseDownCoords({ x, y });
      setPixel(x, y);
    }

    if (e.nativeEvent instanceof TouchEvent) {
      let { x, y } = canvasClickCoords(e.nativeEvent.touches[0]);
      console.log(x, y);
      setPencilMouseDownCoords({ x, y });
      setPixel(x, y);
    }
  };

  const dragMove = (e: MouseEvent | TouchEvent) => {
    e.stopPropagation();
    console.log(e);

    if (e instanceof MouseEvent) {
      let evt = e as MouseEvent;
      let { x, y } = canvasClickCoords(evt);
      console.log(x, y);

      setPixel(x, y);
    }

    if (e instanceof TouchEvent) {
      let evt = e as TouchEvent;
      let { x, y } = canvasClickCoords(evt.touches[0]);
      console.log(x, y);

      setPixel(x, y);

    }
  };

  const dragEnd = () => {
    let pencilElement = document.getElementById("pencil");

    console.log(pencilElement);

    if (pencilElement !== null) {
      pencilElement.removeEventListener("mouseup", dragEnd);
      pencilElement.removeEventListener("mousemove", dragMove);
      pencilElement.removeEventListener("touchend", dragEnd);
      pencilElement.removeEventListener("touchmove", dragMove);
    }
  };

  useEffect(() => {
    if (pencilMouseDownCoords !== undefined) {
      let pencilElement = document.getElementById("pencil");

      console.log(pencilElement);

      if (pencilElement !== null) {
        pencilElement.removeEventListener("mousemove", dragMove);
        pencilElement.addEventListener("mousemove", dragMove);

        pencilElement.removeEventListener("mouseup", dragEnd);
        pencilElement.addEventListener("mouseup", dragEnd);

        pencilElement.removeEventListener("touchmove", dragMove);
        pencilElement.addEventListener("touchmove", dragMove);

        pencilElement.removeEventListener("touchend", dragEnd);
        pencilElement.addEventListener("touchend", dragEnd);
      }
    }
  }, [pencilMouseDownCoords]);

  const drawMode = useRecoilValue(DrawModeEnabledState);

  useEffect(() => {
    const { location } = window;
    const socket = new WebSocket(CONFIG.pixelton_socket_url);

    /*new WebSocket(
      `${location.protocol.endsWith("s") ? "wss" : "ws"}://${location.host}${
        location.port ? "" : `:${location.port}`
      }/pixelSocket`
    );*/

    // Connection opened
    socket.addEventListener("open", function (event) {
      socket.send("Hello Server!");
    });

    // Listen for messages
    socket.addEventListener("message", function (event) {
      console.log("Message from server ", event.data);
      if (event.data) {
        const data = JSON.parse(event.data);
        if (data.type === "paint_pixel") {
          let newPixels = { ...pixels } as any;
          for (const pixel of data.updates) {
            const { x, y, color } = pixel;
            let key = x + "," + y;
            newPixels[key] = color;
          }

          setPixels(newPixels);
        }
      }
    });
  }, []);

  useEffect(() => {
    (async () => {
      const {
        data: { data: dataPaint, error: errorPaint },
      } = await axios.post(CONFIG.pixelton_api_url, {
        method: "load_canvas",
        telegram_id : "559212240",
        wallet_address : wallet === undefined ? '' : wallet.address,
      });

      console.log(dataPaint);

      if (dataPaint.balance !== undefined) {
        setChannelBalance({
          balance : dataPaint.balance,
          spent_balance : dataPaint.spent_balance
        })
      }

      let newPixels = { ...pixels } as any;
      for (const pixel of dataPaint.items) {
        const { x, y, color } = pixel;
        let key = x + "," + y;
        newPixels[key] = color;
      }


      setPixels(newPixels);
    })().catch((e) => console.error(e));
  }, [wallet?.address]);

  if (!drawMode) return null;

  return (
    <div
      id="pencil"
      className={css.Pencil}
      onMouseDown={dragStart}
      onTouchStart={dragStart}
    />
  );
};

const canvasClickCoords = (e: any) => {

  let rect = e.target.getBoundingClientRect();

  let x = e.clientX - rect.left;
  let y = e.clientY - rect.top;

  let { width, height } = rect;

  x = Math.floor((x / width) * 1000);
  y = Math.floor((y / height) * 1000);

  return { x, y };

};

export default DrawMode;
