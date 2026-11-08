import React from "react";
import ReactDOM from "react-dom/client";
import { CoachPlayerApp } from "./pages/mobile/CoachPlayerApp";
import { AcademyProvider } from "./services/AcademyContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AcademyProvider>
      <CoachPlayerApp />
    </AcademyProvider>
  </React.StrictMode>
);
