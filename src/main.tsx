import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./styles/globals.css";
import { ThemeProvider } from "./components/theme-provider.tsx";

const rootElement = document.getElementById("root");
createRoot(rootElement!).render(
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <App />
    </ThemeProvider>
);
