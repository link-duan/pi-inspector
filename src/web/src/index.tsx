import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";
import "highlight.js/styles/github-dark.css";
import "./styles/app.css";

const rootElement = document.getElementById("root");
if (rootElement) {
	const root = createRoot(rootElement);
	root.render(<App />);
}
