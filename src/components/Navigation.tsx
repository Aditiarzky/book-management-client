import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { DarkModeSwitch } from "react-toggle-dark-mode";
import { Search } from "lucide-react";
import { SEARCH_PAGE } from "../routes/constants";
import { MainLogo } from "./Logo";
import { useTheme } from "@/context/ThemeContext";


export const Navigation = () => {
    return (
        <nav>
            <NavComponent/>
            <div className="h-16"></div>
        </nav>
    );
};

export const NavComponent = () => {
    const [isFixed, setIsFixed] = useState(true);
    const [prevScrollPos, setPrevScrollPos] = useState(0);
  
    useEffect(() => {
      const handleScroll = () => {
        const currentScrollPos = window.pageYOffset;
  
        if (currentScrollPos < prevScrollPos && !isFixed) {
          setIsFixed(true);
        } else if (currentScrollPos > prevScrollPos && isFixed) {
          setIsFixed(false);
        }
  
        setPrevScrollPos(currentScrollPos);
      };
  
      window.addEventListener('scroll', handleScroll);
  
      return () => {
        window.removeEventListener('scroll', handleScroll);
      };
    }, [isFixed, prevScrollPos]);
  
    return (
        <main
        className={`z-20 w-full h-16 right-0 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-b-[0.5px] transition-all border-gray-200 dark:border-gray-800 ${
          isFixed ? 'fixed' : 'hidden'
        }`}
      >
        <div id="nav-main" className="top-0 px-4 max-w-6xl mx-auto flex justify-between items-center w-full h-16">
          <div className="dark:hidden">
            <MainLogo type={0} />
          </div>
          <div className="hidden dark:block">
            <MainLogo type={1} />
          </div>
          <div>
            <ul className="flex space-x-4 text-inherit items-center">
              <Link to={SEARCH_PAGE}>
                <li className="hov-b">
                  <Search />
                </li>
              </Link>
              <div>
                <li className="hov-b">
                  <Switcher />
                </li>
              </div>
              <li className="flex space-x-1"></li>
            </ul>
          </div>
        </div>
      </main>
    );
  };

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

    const toggleDarkMode = (checked : boolean) => {
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
