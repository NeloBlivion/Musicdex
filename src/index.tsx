import { ChakraProvider } from "@chakra-ui/react";
import { createStore, persist, StoreProvider } from "easy-peasy";
import "focus-visible/dist/focus-visible";
import React from "react";
import ReactDOM from "react-dom";
import { QueryClient, QueryClientProvider } from "react-query";
import App from "./App";
import "./modules/i18n";
import storeModel from "./store";
import reportWebVitals from "./utils/reportWebVitals";

// https://easy-peasy.dev/docs/api/persist.html
const store = createStore(persist(storeModel, { storage: "localStorage" }));

const queryClient = new QueryClient();

store.persist.resolveRehydration().then(() => {
  ReactDOM.render(
    <React.StrictMode>
      <StoreProvider store={store}>
        <ChakraProvider>
          <QueryClientProvider client={queryClient}>
            <App />
          </QueryClientProvider>
        </ChakraProvider>
      </StoreProvider>
    </React.StrictMode>,
    document.getElementById("root")
  );
});

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();