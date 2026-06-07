import { NavLink } from "react-router-dom";
import { UserHeader } from "./UserHeader";

const ALL_TOOLS = [
  { to: "/pdf", label: "PDF" },
  { to: "/markdown", label: "Markdown" },
  { to: "/screenshots", label: "Screenshots" },
  { to: "/study", label: "Study" },
  { to: "/notes", label: "Notes" },
  { to: "/images", label: "Images" },
];

const TOOLS = import.meta.env.PROD
  ? ALL_TOOLS.filter((t) => t.to === "/pdf")
  : ALL_TOOLS;

export function AppNav() {
  return (
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
        <div className="app-nav-user">
          <UserHeader />
        </div>
      </div>
    </nav>
  );
}
