import css from "./Profile.module.scss";
import Header from "../Main/Header/Header";
import Page from "../Page/Page";
import Icon from "../utils/Icon/Icon";
import Button from "../utils/Button/Button";
import { atom, useRecoilState, useRecoilValue } from "recoil";
import { AuthUrlState, AuthUserState, useAuth } from "../../hooks/useAuth";
import { useLang } from "../../hooks/useLang";
import { useLocation } from "react-router";
import React, { useEffect, useState } from "react";
import { isMobile } from "react-device-detect";
import QRCodeStyling from "qr-code-styling";
import {plural, setCookie} from "../../utils/functions";
import Spinner from "../utils/Spinner/Spinner";
import { WalletKeyPairState } from "../Main/Main";
import { tonweb } from "../../tonweb";
import BN from "bn.js";
import {ChannelBalanceState} from "../Canvas/DrawMode/DrawMode";

export const UserWalletState = atom<any>({
  key: "UserWalletState",
  default: undefined,
});

export const UserWalletKeyPair = atom<any>({
  key: "UserWalletKeyPair",
  default: undefined,
});

export const CurrentContractState = atom<any>({
  key: "CurrentContractState",
  default: undefined,
});

const Profile = () => {
  const user = useRecoilValue(AuthUserState);
  const auth_url = useRecoilValue(AuthUrlState);
  const [walletKeyPairState, setWalletKeyPairState] =
    useRecoilState(WalletKeyPairState);

  const [wallet, setWallet] = useRecoilState(UserWalletState);

  return (
    <>
      <Header />

      <Page>
        {!(user.tg_id === 0 && auth_url === "") && (
          <>{user.tg_id !== 0 ? <ProfileContent /> : <ProfileAuthRequired />}</>
        )}
      </Page>
    </>
  );
};

const ProfileContent = () => {
  const user = useRecoilValue(AuthUserState);
  const lang = useLang();

  const auth = useAuth();

  const wallet = useRecoilValue(UserWalletState);

  const [channelBalance, setChannelBalance] = useRecoilState(ChannelBalanceState);

  const balance = wallet === undefined ? -1 : wallet.balance.toNumber() / 1_000_000_000;
  const pixels = Math.floor(balance * 1000);

  const real_balance =  wallet === undefined ? -1 : (wallet.balance.toNumber()  + channelBalance.balance - channelBalance.spent_balance) / 1_000_000_000;
  const real_pixels = Math.floor(real_balance * 1000);

  let pixelsRemaining = pixels + ' ' + plural(pixels, lang.header_pixels_1) + ' ' + plural(pixels, lang.header_pixels_2),
      real_pixels_remaining = real_pixels + ' ' + plural(real_pixels, lang.header_pixels_1) + ' ' + plural(real_pixels, lang.header_pixels_2);

  useEffect(() => {
    if (wallet === undefined) return;
    const qrCode = new QRCodeStyling({
      width: 300,
      height: 300,
      type: "canvas",
      data: wallet.top_up_url,
      dotsOptions: {
        color: "#0EAFFF",
        type: "dots",
      },
      backgroundOptions: {
        color: "transparent",
      },
      cornersSquareOptions: {
        type: "square",
      },
      cornersDotOptions: {
        type: "square",
      },
    });

    let codeBox = document.getElementById("top_up_qr") as
      | HTMLElement
      | undefined;

    qrCode.append(codeBox);
  }, [wallet]);

  return (
    <div className={css.ProfileContentWrap}>
      <div className={css.ProfileContent}>
        <div className={css.loginStatus}>
          <div className={css.tgAccount}>
            <div className={css.tg_info}>
              <div className={css.name}>{user.tg_username}</div>
              <div className={css.logOut}>
                <div className={css.logOutBtn} onClick={() => auth.logout()}>
                  Log out
                </div>
              </div>
            </div>
            <div className={css.ava}>
              <div
                className={css.avaImage}
                style={{ backgroundImage: `url('${user.tg_avatar}')` }}
              />
            </div>
          </div>
        </div>
        <div className={css.balance}>
          <div className={css.walletInfo}>
            This is your temporary TON wallet, stored locally, directly in
            browser.
            <br />
            It is used as your in-game balance.
          </div>

          <div className={css.wallet}>
            <div className={css.addr}>
              <div className={css.title}>Your wallet</div>
              <div className={css.address}>
                {wallet === undefined ? <Spinner size={16} /> : wallet.address}
              </div>
            </div>
            <div className={css.balance}>
              <div className={css.title}>Balance</div>
              <div className={css.content}>
                <div>
                  {wallet === undefined ? (
                    <Spinner size={16} style={{marginTop:18}} />
                  ) : (
                    <>{balance} TON</>
                  )}
                </div>
                {wallet !== undefined && wallet.address !== "" && (
                  <div className={css.canDraw}>
                    You can draw {real_pixels} pixels
                  </div>
                )}
              </div>
            </div>
            <div className={css.actions + (wallet === undefined ? ' ' + css.actionsDisabled : '')}>
              <div className={css.actionBtn}>{lang.profile_wallet_withdraw}</div>
              <div className={css.actionBtn}>{lang.profile_wallet_recover}</div>
              <div className={css.actionBtn}>{lang.profile_wallet_export}</div>
            </div>
          </div>
        </div>
        <div className={css.topUp}>
          {wallet !== undefined ? (
            <>
              {isMobile ? (
                <div className={css.topUpMobile}>
                  <div className={css.topUpTitle}>
                    Use this button to top up your balance
                  </div>
                  <div>
                    <Button href={wallet.top_up_url} target="_blank">
                      Send TON Coins to temporary wallet
                    </Button>
                  </div>
                </div>
              ) : (
                <div className={css.topUpDesktop}>
                  <div className={css.qrCodeWrap}>
                    <div className={css.topUpQR} id="top_up_qr" />
                  </div>
                  <div className={css.topUpInfo}>
                    <div className={css.textScan}>
                      Scan this code via <span>Tonkeeper app</span> to top-up
                    </div>
                    <div className={css.or}>or use this URL</div>
                    <div className={css.link}>{wallet.top_up_url}</div>
                  </div>
                </div>
              )}
            </>
          ) : (
              <div className={css.topUpLoading}>
                <Spinner size={16} />
              </div>
          )}
        </div>
        <div className={css.info}>
          <div>
            When you place a pixel, PixelTON will instantly transfer 0.001 TON
            from your temporary wallet with special TON Payment Channels
            protocol.
          </div>
          <div>
            You can always withdraw your funds, and we don’t have any access to
            your temporary wallet, so your TON coins are under your full
            control.
          </div>
        </div>
      </div>
    </div>
  );
};

const ProfileAuthRequired = () => {
  const lang = useLang();
  const location = useLocation();

  return (
    <div className={css.ProfileAuthRequiredWrap}>
      <div className={css.ProfileAuthRequired}>
        <div>{lang.profile_auth_required}</div>

        <div style={{ marginTop: 24 }}>
          <Button
            secondary
            to="/login"
            state={{ backgroundLocation: location }}
            i={<Icon i="telegram" size={16} />}
            t={lang.login_button}
          />
        </div>
      </div>
    </div>
  );
};

export default Profile;
