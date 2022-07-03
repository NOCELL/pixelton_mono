import {atom, useSetRecoilState} from "recoil";
import {useAjax} from "./useAjax";
import {getCookie, setCookie} from "../utils/functions";
import {CONFIG} from "../utils/config";

export const AuthUrlState = atom({
    key : 'AuthUrlState',
    default : ''
});

export const AuthUserState = atom({
    key : 'AuthStatusState',
    default : {
        tg_id : 0,
        tg_username : '',
        tg_avatar : '',
    }
});

export const useAuth = () => {

    const setUser = useSetRecoilState(AuthUserState);
    const setAuthUrl = useSetRecoilState(AuthUrlState);

    const ajax = useAjax('auth2', {}, res => {

        if (res.data !== undefined) {

            if (res.data.auth_url !== undefined) {
                setAuthUrl(res.data.auth_url);
                setUser({
                    tg_id : 0,
                    tg_username : '',
                    tg_avatar : '',
                })
            }

            if (res.data.user.tg_id !== undefined) {

                let auth_cookie = getCookie(CONFIG.cookie_auth);

                if (auth_cookie === undefined) {
                    if (res.data.auth_token !== undefined) {
                        setCookie(CONFIG.cookie_auth, res.data.auth_token, {expiresDate : new Date('Jan 1, 2030')});
                    }
                }

                setUser({
                    tg_id : res.data.user.tg_id,
                    tg_username : res.data.user.tg_username,
                    tg_avatar : res.data.user.tg_avatar,
                })
            }

        }

    }, true);

    const send = () => {

        ajax.sendRequest();

    }

    const logout = () => {
        setCookie(CONFIG.cookie_auth, '', {expiresDate : new Date('Jan 1, 1999')});
        send();
    }

    return {
        send,
        logout
    }

}