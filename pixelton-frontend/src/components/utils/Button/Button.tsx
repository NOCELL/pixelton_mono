import React from 'react'
import css from './Button.module.scss'
import {Link} from "react-router-dom";
import Spinner from "../Spinner/Spinner";

const Button = (props: {

    children?: React.ReactNode,
    i?: React.ReactNode,
    t?: React.ReactNode,
    onClick?: React.MouseEventHandler,
    style?: React.StyleHTMLAttributes<any>,

    loading?:   boolean,
    primary?:   boolean,
    secondary?: boolean,
    tertiary?:  boolean,
    veryBig?:   boolean,
    big?:       boolean,
    small?:     boolean,
    verySmall?: boolean,
    green?:     boolean,
    red?:       boolean,
    w100?:      boolean,
    noBG?:      boolean,
    disabled?:  boolean,

    w?:         number,
    h?:         number,
    mt?:        number,
    mb?:        number,

    to?:        string,
    href?:      string,
    target?:    string,
    rel?:       string,
    state?:     object,

}) => {

    let buttonClasses = [css.Button];

    let buttonContent = <div className={css.ButtonContent}>
        {props.i !== undefined && <div className={css.ButtonIcon}>{props.i}</div>}
        {props.t !== undefined && <div className={css.ButtonText}>{props.t}</div>}
        {props.children !== undefined && props.children !== null && props.children}
    </div>

    if (props.loading === true) {
        buttonContent = <div className={css.ButtonContentSpinner}><Spinner size={16} /></div>
    }

    if (props.primary) buttonClasses.push(css.ButtonPrimary);
    if (props.secondary) buttonClasses.push(css.ButtonSecondary);
    if (props.tertiary) buttonClasses.push(css.ButtonTertiary);

    if (props.veryBig) buttonClasses.push(css.ButtonVeryBig);
    if (props.big) buttonClasses.push(css.ButtonBig);
    if (props.small) buttonClasses.push(css.ButtonSmall);
    if (props.verySmall) buttonClasses.push(css.ButtonVerySmall);

    if (props.red) buttonClasses.push(css.ButtonRed);
    if (props.green) buttonClasses.push(css.ButtonGreen);

    if (props.w100) buttonClasses.push(css.ButtonW100);
    if (props.noBG) buttonClasses.push(css.ButtonNoBG);
    if (props.disabled) buttonClasses.push(css.ButtonDisabled);

    let className = buttonClasses.join(' '),
        buttonStyle = {} as any;

    let buttonProps = {className} as any;

    if (props.onClick !== undefined) buttonProps.onClick = props.onClick;
    if (props.style !== undefined) buttonStyle = {...props.style};
    if (props.w !== undefined) buttonStyle.width = props.w;
    if (props.h !== undefined) buttonStyle.height = props.h;
    if (props.mt !== undefined) buttonStyle.marginTop = props.mt;
    if (props.mb !== undefined) buttonStyle.marginBottom = props.mb;

    if (Object.keys(buttonStyle).length > 0) buttonProps.style = buttonStyle;

    if (props.disabled) delete(buttonProps.onClick);

    if (props.to !== undefined) {

        buttonProps.to = props.to;

        if (props.state !== undefined) buttonProps.state = props.state;

        return <Link {...buttonProps}>
            {buttonContent}
            <div className={css.BorderBottom} />
        </Link>;
    }

    if (props.href !== undefined) {

        buttonProps.href = props.href;

        if (props.target !== undefined) {
            buttonProps.target = props.target;
            buttonProps.rel = 'noopener noreferrer';
        }

        return <a {...buttonProps}>
            {buttonContent}
            <div className={css.BorderBottom} />
        </a>;

    }

    return <div {...buttonProps}>
        {buttonContent}
        <div className={css.BorderBottom} />
    </div>;

}

export default Button