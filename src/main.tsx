// Pico ต้องมาก่อน index.css (ซึ่งมี CSS เดิมใน styles/) — ลำดับเดียวกับก่อนย้าย
import "@picocss/pico/css/pico.conditional.min.css";
import "./index.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);