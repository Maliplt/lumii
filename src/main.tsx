import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { CustomProvider } from "rsuite";
import { store } from "./store/store";
import "./index.css";
import "./main.scss";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <CustomProvider theme="dark">
        <App />
      </CustomProvider>
    </Provider>
  </StrictMode>,
);
