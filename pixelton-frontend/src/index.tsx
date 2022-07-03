import React from "react";
import ReactDOM from "react-dom/client";
import "./index.scss";
import Main from "./components/Main/Main";
import { BrowserRouter } from "react-router-dom";
import { RecoilRoot } from "recoil";
import { removeBodyBounce } from "remove-ios-bounce";

removeBodyBounce();

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

root.render(
  <React.StrictMode>
    <RecoilRoot>
      <BrowserRouter

      >
        <Main />
      </BrowserRouter>
    </RecoilRoot>
  </React.StrictMode>
);

/*
        basename={
          !process.env.NODE_ENV || process.env.NODE_ENV === "development"
            ? ""
            : "/pixelton/build/index.html"
        }
 */
