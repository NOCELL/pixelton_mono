import css from './Login.module.scss'
import {useEffect} from "react";
import QrCreator from "qr-creator";
import Modal from "../Modal";
import {useLang} from "../../../../hooks/useLang";
import DebugButton from "../../Debug/DebugButton";
import {isMobile} from 'react-device-detect';
import {useNavigate} from "react-router-dom";
import Button from "../../Button/Button";
import Icon from "../../Icon/Icon";
import {setCookie} from "../../../../utils/functions";
import {CONFIG} from "../../../../utils/config";
import {useAuth} from "../../../../hooks/useAuth";

const Login = () => {

    const navigate = useNavigate();
    const auth = useAuth();
    const lang = useLang();
    const loginURL = 'https://app.tonkeeper.com/ton-login/getgems.io/tk?id=OIwt3zjYrTUHX1yRBxZ-dA';

    useEffect(() => {

        if (!isMobile) {

            let qrContainer = document.getElementById('login-qr') as HTMLElement;

            if (qrContainer) {
                QrCreator.render({
                    text: loginURL,
                    radius: 0.5, // 0.0 to 0.5
                    ecLevel: 'M', // L, M, Q, H
                    fill: '#FFF', // foreground color
                    background: null, // color or null for transparent
                    size: 255 // in pixels
                }, qrContainer);
            }

        }

    }, []);

    return <Modal>

        <div className={css.Login}>

            {!isMobile ? (<>

                <div className={css.qrWrap}>
                    <div className={css.qr}>
                        <canvas id="login-qr" />
                    </div>
                </div>

                <div className={css.title}>
                    {lang.login_desktop_title}
                </div>
                <div className={css.caption}>
                    {lang.login_desktop_caption}
                </div>

            </>) : (<>

                <div className={css.buttonWrap}>
                    <Button
                        w100
                        big
                        secondary
                        href={loginURL}
                        target="_blank"
                        i={<Icon i="telegram" />}
                        t={lang.login_button}
                    />
                </div>

                <div className={css.title}>
                    {lang.login_mobile_title}
                </div>
                <div className={css.caption}>
                    {lang.login_mobile_caption}
                </div>

            </>)}

        </div>

        <DebugButton style={{marginTop:24}} onClick={() => {
            setCookie(CONFIG.cookie_auth, 'pixelton', {expiresDate : new Date('Jan 1, 2030')});
            auth.send();
            navigate(-1);
        }}>Залогиниться</DebugButton>

    </Modal>

}

export default Login