import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { he } from "./locale/he";
import "./styles.css";

const root = document.getElementById("root");
if (!root) {
  throw new Error("Missing #root element");
}

document.title = he.appName;
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
