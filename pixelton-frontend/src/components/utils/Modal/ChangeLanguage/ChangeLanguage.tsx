import css from './ChangeLanguage.module.scss'
import {useRecoilValue} from "recoil";
import {LangState} from "../../../Main/Main";
import {Languages} from "../../../../utils/vocabulary";
import Modal from "../Modal";
import {useChangeLang} from "../../../../hooks/useLang";
import {useNavigate} from "react-router-dom";
import {Icon20Check} from "@vkontakte/icons";
import Icon from "../../Icon/Icon";

const ChangeLanguage = () => {

    const navigate = useNavigate();
    const language = useRecoilValue(LangState);
    const changeLanguage = useChangeLang();

    const setLang = (lang: Languages) => {
        changeLanguage(lang);
        navigate(-1);
    }

    return <Modal>

        <div className={css.ChangeLang}>
            {['EN','RU'].map((l) => {

                let lng = l as Languages,
                    langTitle = {
                        RU : 'Русский',
                        EN : 'English'
                    };

                return <div className={css.ChangeLangItem} onClick={() => setLang(lng)}>
                    <div className={css.icon}><SvgFlag language={lng} /></div>
                    <div className={css.lang}>{langTitle[lng]}</div>
                    {lng === language && (
                        <div className={css.check}><Icon20Check /></div>
                    )}
                </div>

            })}
        </div>

    </Modal>

}

export const SvgFlag = ({language}: {language: Languages}) => {

    if (language === 'EN') {
        return <Icon i="flag_us" size={24} />
    }

    if (language === 'RU') {
        return <Icon i="flag_ru" size={24} />
    }

    return null;

}

export default ChangeLanguage