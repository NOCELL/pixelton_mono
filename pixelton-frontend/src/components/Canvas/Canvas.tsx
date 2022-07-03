import css from './Canvas.module.scss'
import pencil_css from './DrawMode/DrawMode.module.scss'
import {TransformWrapper, TransformComponent, ReactZoomPanPinchRef} from "react-zoom-pan-pinch";
import React, {useEffect} from "react";
import {atom, useRecoilValue} from "recoil";
import {getRandomInt} from "../../utils/functions";
import {AjaxRequest} from "../../hooks/useAjax";
import Header from "../Main/Header/Header";
import DrawMode, {DrawModePencil} from "./DrawMode/DrawMode";

export const CanvasPixelsState = atom({
    key : 'CanvasPixelsState222',
    default : {}
});

export const DrawColorState = atom({
    key : 'DrawColorState',
    default : '000000'
});

const Canvas = ({loadCanvas} : {loadCanvas: AjaxRequest}) => {

    const CanvasPixels = useRecoilValue(CanvasPixelsState);

    const canvasActionProgress = (ref: ReactZoomPanPinchRef, e: object) => {
        console.log('action progress');
    }

    const canvasActionStart = (ref: ReactZoomPanPinchRef, e: object) => {
        console.log('action start');
    }

    const canvasActionEnd = (ref: ReactZoomPanPinchRef, e: object) => {
        console.log('action end');
    }

    /*const user = useRecoilValue(AuthUserState);*/

    useEffect(() => {
        renderCanvas(CanvasPixels);
    });

    return <>

        <div className={css.Canvas}>

            <TransformWrapper
                initialScale={2}
                centerOnInit={true}
                centerZoomedOut={true}
                minScale={1}
                maxScale={30}

                onPanningStart={canvasActionStart}
                onPanning={canvasActionProgress}
                onPanningStop={canvasActionEnd}

                onPinchingStart={canvasActionStart}
                onPinching={canvasActionProgress}
                onPinchingStop={canvasActionEnd}

                onZoomStart={canvasActionStart}
                onZoom={canvasActionProgress}
                onZoomStop={canvasActionEnd}

                panning={{
                    excluded : [
                        pencil_css.Pencil
                    ]
                }}

            >

                {({zoomToElement, centerView}) => (<div className={css.CanvasWrapper2}>

                    <Header centerView={centerView} />

                    <DrawMode zoomToElement={zoomToElement} />

                    <TransformComponent
                        wrapperClass={css.CanvasWrapper}
                        contentClass={css.CanvasImg}
                    >

                        <div className={css.CanvasImagePadding}>

                            <div className={css.CanvasImage}>
                                <div className={css.CanvasBackground} />
                                <div className={css.CanvasCanvas}>
                                    <canvas id="canvas" width={1000} height={1000} />
                                </div>
                            </div>

                            <DrawModePencil />

                        </div>

                    </TransformComponent>

                </div>)}

            </TransformWrapper>

        </div>

    </>

}

export const renderCanvas = (pixels: any) => {

    const canvas = document.getElementById('canvas') as any;

    if (!canvas.getContext) {
        return;
    }

    const ctx = canvas.getContext('2d');

    Object.keys(pixels).forEach((coords: string) => {
        let [x,y] = coords.split(',').map(Number),
            c = pixels[coords];
        ctx.fillStyle = '#' + c;
        ctx.fillRect(x, y, 1, 1);
    });

}

export default Canvas