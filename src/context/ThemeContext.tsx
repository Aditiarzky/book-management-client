import type { ReactNode } from "@tanstack/react-router";
import { createContext, useContext, useState, useEffect} from "react";

// Define the context type
interface ThemeContextType {
    theme: string;
    setTheme: (theme: string) => void;
}

interface ThemeProviderProps {
    children: ReactNode; 
}
const ThemeContext = createContext<ThemeContextType | null>(null);

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
    const [theme, setTheme] = useState<string>(() => localStorage.getItem("theme") || "light");

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove(theme === "dark" ? "light" : "dark");
        root.classList.add(theme);
        localStorage.setItem("theme", theme);
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
};