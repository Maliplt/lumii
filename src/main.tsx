import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { CustomProvider } from "rsuite";
import trTR from "rsuite/locales/tr_TR";
import { store } from "./store/store";
import "./index.css";
import "./main.scss";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <CustomProvider theme="dark" locale={trTR}>
        <App />
      </CustomProvider>
    </Provider>
  </StrictMode>,
);
