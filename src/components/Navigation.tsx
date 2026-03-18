import { useState, useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { DarkModeSwitch } from "react-toggle-dark-mode";
import { Search } from "lucide-react";
import { MainLogo } from "./Logo";
import { useTheme } from "@/context/ThemeContext";
import SearchModal from "@/components/SearchModal";

/* ─────────────────────────────────────────────
   DARK MODE SWITCHER
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
  const [searchOpen, setSearchOpen] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setAtTop(y < 10);
      if (Math.abs(y - lastY.current) < 6) return;
      setVisible(y < lastY.current || y < 60);
      lastY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Cmd/Ctrl+K shortcut */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <>
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
            {/* Search trigger */}
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 h-9 pl-3 pr-2.5 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-all group"
            >
              <Search className="h-[18px] w-[18px]" />
              {/* Shortcut hint — desktop only */}
              <kbd className="hidden sm:flex items-center gap-0.5 text-[10px] font-mono text-gray-300 dark:text-white/20 group-hover:text-gray-400 dark:group-hover:text-white/30 transition-colors">
                <span className="text-[11px]">⌘</span>K
              </kbd>
            </button>

            {/* Dark mode toggle */}
            <div className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-all cursor-pointer">
              <Switcher />
            </div>
          </div>
        </div>
      </header>

      {/* Search modal */}
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
};

/* ─────────────────────────────────────────────
   NAVIGATION EXPORT
───────────────────────────────────────────── */
export const Navigation = () => (
  <nav>
    <NavComponent />
    <div className="h-16" />
  </nav>
);
