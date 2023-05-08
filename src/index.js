import "./index.css";

import React from "react";
import ReactDOM from "react-dom/client";
import ChatGptInterface from "./ChatGptInterface";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <div className="App">
      <ChatGptInterface />
    </div>
  </React.StrictMode>
);
