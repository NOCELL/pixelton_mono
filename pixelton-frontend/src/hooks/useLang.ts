import {Languages, Vocabulary, vocabulary} from "../utils/vocabulary";
import {useRecoilValue, useSetRecoilState} from "recoil";
import {LangState} from "../components/Main/Main";
import {setCookie} from "../utils/functions";
import {CONFIG} from "../utils/config";

export const useLang = (): Vocabulary => {

    const lang = useRecoilValue(LangState) as Languages;

    return vocabulary[lang];

}

export const useChangeLang = () => {

    const setLang = useSetRecoilState(LangState);

    return (lang: Languages) => {

        setLang(lang);
        setCookie(CONFIG.cookie_language, lang,  {expiresDate : new Date('Jan 1, 2030')});

    }

}