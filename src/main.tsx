import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./styles/globals.css";
import { ThemeProvider } from "./components/theme-provider.tsx";

console.log("Main.tsx executing");
const rootElement = document.getElementById("root");
console.log("Root element:", rootElement);
createRoot(rootElement!).render(
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <App />
    </ThemeProvider>
);
