import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { DarkModeSwitch } from "react-toggle-dark-mode";
import { Search } from "lucide-react";
import { SEARCH_PAGE } from "../routes/constants";
import { MainLogo } from "./Logo";
import { useTheme } from "@/context/ThemeContext";

/* ─────────────────────────────────────────────
   DARK MODE SWITCHER — logika tidak diubah
───────────────────────────────────────────── */
export const useDarkSide = (): [string, React.Dispatch<React.SetStateAction<string>>] => {
  const storedTheme = localStorage.getItem("theme");
  const [theme, setTheme] = useState<string>(storedTheme || "light");
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove(theme === "dark" ? "light" : "dark");
    root.classList.add(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);
  return [theme, setTheme];
};

export const Switcher = () => {
  const { theme, setTheme } = useTheme();
  const toggleDarkMode = (checked: boolean) => {
    setTheme(checked ? "dark" : "light");
  };
  return (
    <DarkModeSwitch
      checked={theme === "dark"}
      onChange={toggleDarkMode}
      size={20}
    />
  );
};

/* ─────────────────────────────────────────────
   NAV COMPONENT
───────────────────────────────────────────── */
export const NavComponent = () => {
  const [visible, setVisible] = useState(true);
  const [atTop, setAtTop] = useState(true);
  const lastY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setAtTop(y < 10);
      // Threshold 6px agar tidak flicker saat scroll kecil
      if (Math.abs(y - lastY.current) < 6) return;
      setVisible(y < lastY.current || y < 60);
      lastY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`
        fixed top-0 left-0 right-0 z-20 h-16
        transition-transform duration-300 ease-in-out
        ${visible ? "translate-y-0" : "-translate-y-full"}
        ${atTop
          ? "bg-white/95 dark:bg-gray-950/95 border-b border-transparent"
          : "bg-white/90 dark:bg-gray-950/90 backdrop-blur-xl border-b border-gray-100 dark:border-white/5"
        }
      `}
    >
      <div className="max-w-6xl mx-auto px-4 h-full flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center">
          <div className="dark:hidden">
            <MainLogo type={0} />
          </div>
          <div className="hidden dark:block">
            <MainLogo type={1} />
          </div>
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <Link
            to={SEARCH_PAGE}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
          >
            <Search className="h-[18px] w-[18px]" />
          </Link>
          <div className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-all cursor-pointer">
            <Switcher />
          </div>
        </div>
      </div>
    </header>
  );
};

/* ─────────────────────────────────────────────
   NAVIGATION EXPORT
───────────────────────────────────────────── */
export const Navigation = () => (
  <nav>
    <NavComponent />
    {/* Spacer agar konten tidak tertutup navbar */}
    <div className="h-16" />
  </nav>
);
