import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { UserHeader } from "./user-header";

const ALL_TOOLS = [
  { to: "/web-to-pdf", label: "Web → PDF" },
  { to: "/web-to-markdown", label: "Web → Markdown" },
  { to: "/web-to-screenshot", label: "Web → Screenshot" },
  // { to: "/study", label: "PDF → Study" },
  // { to: "/notes", label: "NoteMD" },
  // { to: "/images", label: "Image Tools" },
];

const WEB_TOOLS = ["/web-to-pdf", "/web-to-markdown", "/web-to-screenshot"];
const TOOLS = import.meta.env.PROD
  ? ALL_TOOLS.filter((t) => WEB_TOOLS.includes(t.to))
  : ALL_TOOLS;

export function AppNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <svg className="app-nav-zigzag-defs" aria-hidden="true">
        <defs>
          <clipPath id="app-nav-zigzag" clipPathUnits="objectBoundingBox">
            <polygon points="
              0,0 0,0.88
              0.01,1 0.02,0.88 0.03,1 0.04,0.88 0.05,1 0.06,0.88 0.07,1 0.08,0.88 0.09,1 0.10,0.88
              0.11,1 0.12,0.88 0.13,1 0.14,0.88 0.15,1 0.16,0.88 0.17,1 0.18,0.88 0.19,1 0.20,0.88
              0.21,1 0.22,0.88 0.23,1 0.24,0.88 0.25,1 0.26,0.88 0.27,1 0.28,0.88 0.29,1 0.30,0.88
              0.31,1 0.32,0.88 0.33,1 0.34,0.88 0.35,1 0.36,0.88 0.37,1 0.38,0.88 0.39,1 0.40,0.88
              0.41,1 0.42,0.88 0.43,1 0.44,0.88 0.45,1 0.46,0.88 0.47,1 0.48,0.88 0.49,1 0.50,0.88
              0.51,1 0.52,0.88 0.53,1 0.54,0.88 0.55,1 0.56,0.88 0.57,1 0.58,0.88 0.59,1 0.60,0.88
              0.61,1 0.62,0.88 0.63,1 0.64,0.88 0.65,1 0.66,0.88 0.67,1 0.68,0.88 0.69,1 0.70,0.88
              0.71,1 0.72,0.88 0.73,1 0.74,0.88 0.75,1 0.76,0.88 0.77,1 0.78,0.88 0.79,1 0.80,0.88
              0.81,1 0.82,0.88 0.83,1 0.84,0.88 0.85,1 0.86,0.88 0.87,1 0.88,0.88 0.89,1 0.90,0.88
              0.91,1 0.92,0.88 0.93,1 0.94,0.88 0.95,1 0.96,0.88 0.97,1 0.98,0.88 0.99,1 1,0.88
              1,0
            " />
          </clipPath>
          <clipPath id="app-nav-zigzag-mobile" clipPathUnits="objectBoundingBox">
            <polygon points="
              0,0 0,0.88
              0.0625,1 0.125,0.88 0.1875,1 0.25,0.88 0.3125,1 0.375,0.88
              0.4375,1 0.5,0.88 0.5625,1 0.625,0.88 0.6875,1 0.75,0.88
              0.8125,1 0.875,0.88 0.9375,1 1,0.88
              1,0
            " />
          </clipPath>
        </defs>
      </svg>
      <div className="app-nav-shadow-wrapper">
      <nav className="app-nav">
        <div className="app-nav-inner">
          <NavLink to="/" className="app-nav-brand">
            DistillPage
          </NavLink>
          <div className="app-nav-links">
            {TOOLS.map((tool) => (
              <NavLink
                key={tool.to}
                to={tool.to}
                className={({ isActive }) =>
                  isActive ? "app-nav-link active" : "app-nav-link"
                }
              >
                {tool.label}
              </NavLink>
            ))}
          </div>
          <div className="app-nav-right">
            <div className="app-nav-user">
              <UserHeader />
            </div>
            <button
              type="button"
              className="app-nav-hamburger"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              onClick={() => setMobileMenuOpen((v) => !v)}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </nav>
      {mobileMenuOpen && (
        <div className="app-nav-mobile-drawer">
          {TOOLS.map((tool) => (
            <NavLink
              key={tool.to}
              to={tool.to}
              className={({ isActive }) =>
                isActive ? "app-nav-link active" : "app-nav-link"
              }
              onClick={() => setMobileMenuOpen(false)}
            >
              {tool.label}
            </NavLink>
          ))}
        </div>
      )}
      </div>
    </>
  );
}
