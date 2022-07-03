import React from 'react'
import css from './Spinner.module.scss'
import {Icon32Spinner} from "@vkontakte/icons";

const Spinner = ({size = 16, style = {}}) => {

    return <div className={css.spinnerWrap1} style={{width:size, ...style}}>
        <div className={css.spinnerWrap2}>
            <div className={css.spinnerWrap3}>
                <div className={css.spinner}><Icon32Spinner width={size} height={size} /></div>
            </div>
        </div>
    </div>

}

export default Spinner