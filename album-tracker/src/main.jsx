import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { PlayerProvider } from "./context/PlayerContext.jsx";
import { CollectionProvider } from "./context/CollectionContext.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <CollectionProvider>
        <PlayerProvider>
          <App />
        </PlayerProvider>
      </CollectionProvider>
    </BrowserRouter>
  </React.StrictMode>
);