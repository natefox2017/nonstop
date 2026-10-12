import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { startRuntime } from "./app/startRuntime";
import { App } from "./ui/App";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("The game root element is missing.");

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

void startRuntime();
