import Canvas from "../Canvas/Canvas";
import { atom, useRecoilState, useSetRecoilState } from "recoil";
import { Route, Routes, useLocation } from "react-router";
import { useAjax } from "../../hooks/useAjax";
import ChangeLanguage from "../utils/Modal/ChangeLanguage/ChangeLanguage";
import Login from "../utils/Modal/Login/Login";
import { useAuth } from "../../hooks/useAuth";
import { CONFIG } from "../../utils/config";
import { getCookie, setCookie } from "../../utils/functions";
import { Languages } from "../../utils/vocabulary";
import { useChangeLang } from "../../hooks/useLang";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import About from "../utils/Modal/About/About";
import Profile, { UserWalletState } from "../Profile/Profile";
import TonWeb from "tonweb";
import { createKeyPair } from "../../utils/createPairKey";
import { tonweb } from "../../tonweb";
import BN from "bn.js";

export const LangState = atom<"RU" | "EN">({
  key: "LangState",
  default: "EN",
});

export const TelegramState = atom<any>({
  key: "TelegramIDState",
  default: {
    id: "559212240",
  },
});

export const WalletKeyPairState = atom<any | undefined>({
  key: "WalletKeyPairState",
  default: undefined,
});

export const PaymentChannelCreatedState = atom<boolean>({
  key: "PaymentChannelCreatedState",
  default: localStorage.PaymentChannelCreatedState === "true" ? true : false,
});

export const PaymentChannelState = atom<any>({
  key: "PaymentChannelState",
  default: undefined,
});

export const PaymentChannelInitState = atom<any>({
  key: "PaymentChannelInitState",
  default: undefined,
});

export const PaymentChannelContractValue = atom<BN | null>({
  key: "PaymentChannelContractValue",
  default: localStorage.PaymentChannelContractValue
    ? new BN(localStorage.PaymentChannelContractValue, 16)
    : null,
});

let isFirst = true;

const Main = () => {
  const location = useLocation();
  const auth = useAuth();
  const changeLang = useChangeLang();
  const setLang = useSetRecoilState(LangState);
  const [walletPairKey, setWalletPairKey] = useRecoilState(WalletKeyPairState);
  const [wallet, setWallet] = useRecoilState(UserWalletState);
  const navigate = useNavigate();

  const state = location.state as { backgroundLocation?: Location };

  const loadCanvas = useAjax(
    "loadCanvas",
    {},
    (res) => {
      //let canvas = res.data as any;
    },
    true
  );

  /*

    const loadCanvas = useAjax('loadCanvas', {}, res => {

        let canvas = res.data as LoadCanvasData;

    }, true);

    */

  useEffect(() => {
    //Authorize user

    auth.send();

    //Load Canvas

    //loadCanvas.sendRequest();

    //Detect or set language from cookie

    let language = getCookie(CONFIG.cookie_language) as Languages;

    if (language === undefined) {
      let nav_lang = navigator.language,
        set_lang = "EN" as Languages;

      console.log(nav_lang);

      let ru_langs = ["ru", "uk", "be", "kk", "uz"];

      ru_langs.forEach((lang) => {
        if (nav_lang.toLocaleLowerCase().startsWith(lang)) {
          set_lang = "RU";
        }
      });

      changeLang(set_lang);
    } else {
      setLang(language);
    }

    //Show about page for new users

    let show_about = getCookie(CONFIG.cookie_new_user);

    if (show_about !== "0") {
      setCookie(CONFIG.cookie_new_user, "0", {
        expiresDate: new Date("Jan 1, 2030"),
      });
      navigate("/about", { state: { backgroundLocation: location } });
    }
  }, []);

  useEffect(() => {
    (async () => {
      console.log("started", localStorage.wallet);
      if (localStorage.wallet === undefined) {
        // @ts-ignore
        const newPairKey = await createKeyPair();
        // @ts-ignore
        localStorage.wallet = JSON.stringify({
          secretKey: TonWeb.utils.bytesToHex(newPairKey.secretKey),
          publicKey: TonWeb.utils.bytesToHex(newPairKey.publicKey),
        });
      }
      const walletParsed = JSON.parse(localStorage.wallet);

      console.log("localStorage.wallet", localStorage.wallet);

      const keyPairA = {
        secretKey: TonWeb.utils.hexToBytes(walletParsed.secretKey),
        publicKey: TonWeb.utils.hexToBytes(walletParsed.publicKey),
      };

      console.log("keyPairA", keyPairA);

      setWalletPairKey(keyPairA);
    })();
  }, []);

  useEffect(() => {
    const updateWallet = async () => {
      console.log("walletKeyPairState", walletPairKey);
      if (walletPairKey === undefined) {
        return;
      }

      // @ts-ignore
      const wallet = tonweb.wallet.create({
        publicKey: walletPairKey.publicKey,
      });

      const address = await wallet.getAddress();
      // @ts-ignore
      const balance = await tonweb.getBalance(address);

      const friendlyAdress = address.toString(true, true, true);

      setWallet({
        address: friendlyAdress,
        balance: new BN(balance),
        top_up_url: `https://app.tonkeeper.com/transfer/${friendlyAdress}`,
      });
    };

    const intervalId = setInterval(updateWallet, 5000);

    if (isFirst) {
      updateWallet();
      isFirst = false;
    }

    return () => {
      clearInterval(intervalId);
    };
  }, [walletPairKey]);

  console.log("keyPairA", walletPairKey);

  return (
    <>
      <Routes location={state?.backgroundLocation || location}>
        <Route path="*" element={<Canvas loadCanvas={loadCanvas} />} />

        <Route path="/profile" element={<Profile />} />
      </Routes>

      {state?.backgroundLocation && (
        <Routes>
          <Route path={"about"} element={<About />} />
          <Route path={"/profile/about"} element={<About />} />

          <Route path={"/login"} element={<Login />} />
          <Route path={"/profile/login"} element={<About />} />

          <Route path={"/lang"} element={<ChangeLanguage />} />
          <Route path={"/profile/lang"} element={<ChangeLanguage />} />
        </Routes>
      )}
    </>
  );
};

export default Main;
