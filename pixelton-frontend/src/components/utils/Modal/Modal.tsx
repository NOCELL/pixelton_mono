import css from './Modal.module.scss'
import {useNavigate} from "react-router-dom";
import {PropsWithChildren} from "react";
import {Icon24Cancel} from "@vkontakte/icons";

const Modal = ({children}: PropsWithChildren) => {

    const navigate = useNavigate();

    return <div className={css.ModalWrap}>
        <div onClick={() => navigate(-1)} className={css.ModalBg} />
        <div className={css.ModalContentWrap}>
            <div className={css.ModalContentBg} />
            <div className={css.ModalContent}>
                <div onClick={() => navigate(-1)} className={css.ModalClose}><Icon24Cancel /></div>
                {children}
            </div>
        </div>
    </div>

}

export default Modal