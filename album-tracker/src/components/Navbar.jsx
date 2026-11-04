import { useEffect } from "react";
import { NavLink } from "react-router-dom";
import { useCollection } from "../context/CollectionContext.jsx";
import useLocalStorage from "../hooks/useLocalStorage.js";

export default function Navbar() {
  const { albums } = useCollection();
  const count = Object.keys(albums).length;
  const [theme, setTheme] = useLocalStorage("album-tracker:theme", "dark");

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const linkClass = ({ isActive }) => `nav-tab ${isActive ? "active" : ""}`;

  return (
    <header className="navbar">
      <h1 className="logo">Album Tracker</h1>
      <nav className="nav-links">
        <NavLink to="/" end className={linkClass}>
          Discover
        </NavLink>
        <NavLink to="/collection" className={linkClass}>
          My collection ({count})
        </NavLink>
        <NavLink to="/recommendations" className={linkClass}>
          Recommendations
        </NavLink>
        <button
          type="button"
          className="nav-tab theme-toggle"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="Toggle color theme"
        >
          {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
        </button>
      </nav>
    </header>
  );
}