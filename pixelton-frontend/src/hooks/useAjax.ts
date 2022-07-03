import axios from 'axios'
import {useState} from "react";
import {CONFIG} from "../utils/config";
import {getCookie} from "../utils/functions";

export type ApiResponse = {
    success: boolean,
    text?: string,
    data?: any
};

export type AjaxRequest = {
    sendRequest: () => void,
    isSending: boolean,
    requestError: string,
};

export const useAjax = (

    method: string,
    data: object = {},
    callback: (res: ApiResponse) => void,
    debug: boolean = false,

) : AjaxRequest => {

    const [isSending, setIsSending] = useState(false);
    const [requestError, setRequestError] = useState('');

    const sendRequest = async () => {

        setIsSending(true);
        setRequestError('');

        try {

            let ajax_data = {
                method,
                ...data
            } as {
                method: string,
                auth_token: string,
            },
                auth_token = getCookie(CONFIG.cookie_auth);

            if (auth_token !== undefined) {
                ajax_data.auth_token = auth_token;
            }

            if (debug) {
                console.log('%cSend request (method: ' + method + ') with params:', 'font-weight:bold;color:#0F0');
                console.log(ajax_data);
                console.log('=====');
            }

            const response = await axios.post(CONFIG.ajax_url, ajax_data);

            setIsSending(false);

            handleResponse(response.data);

        } catch (err) {

            setIsSending(false);
            setRequestError('network error');

            if (debug) {
                console.error('%c' + method + ' error!', 'font-weight:bold;color:#F00');
            }

        }

    }

    const handleResponse = (res: ApiResponse) => {

        if (debug) {
            console.log('%c' + method + ' success', 'font-weight:bold;color:#0F0');
            console.log(res);
            console.log('\n');
        }

        if (!res.success) {

            setRequestError(res.text !== undefined ? res.text : 'unknown error');

        } else {

            callback(res);

        }

    }

    return {

        isSending,

        requestError,

        sendRequest,

    };

}