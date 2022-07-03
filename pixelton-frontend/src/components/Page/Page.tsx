import css from './Page.module.scss'
import {PropsWithChildren} from "react";

const Page = ({children}: PropsWithChildren) => {

    return <div className={css.PageWrap}>

        <div className={css.PageContent}>

            {children}

        </div>

    </div>

}

export default Page