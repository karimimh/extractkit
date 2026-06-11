import { NavLink, useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
import { UserHeader } from "./user-header";
import { WEB_TOOLS } from "./tool-nav-items";

const ROUTE_TITLES = [
  ...WEB_TOOLS,
  { to: "/export-history", label: "Export History" },
  { to: "/developer-api", label: "Developer API" },
  { to: "/blog", label: "Blog" },
  // { to: "/study", label: "PDF → Study" },
  // { to: "/notes", label: "NoteMD" },
  // { to: "/images", label: "Image Tools" },
];

type AppNavProps = {
  showSidebarToggle?: boolean;
  onOpenSidebar?: () => void;
};

export function AppNav({ showSidebarToggle = false, onOpenSidebar }: AppNavProps) {
  const location = useLocation();
  const activeRoute = ROUTE_TITLES.find((route) =>
    route.to === "/blog"
      ? location.pathname.startsWith(route.to)
      : location.pathname === route.to
  );
  const pageTitle = activeRoute?.label ?? "DistillPage";

  return (
    <div className="app-nav-shadow-wrapper">
      <nav className="app-nav">
        <div className="app-nav-inner">
          {showSidebarToggle && (
            <button
              type="button"
              className="app-nav-sidebar-toggle"
              aria-label="Open tool sidebar"
              onClick={onOpenSidebar}
            >
              <Menu size={20} />
            </button>
          )}
          <NavLink to="/" className="app-nav-brand">
            DistillPage
          </NavLink>
          <div className="app-nav-title" aria-live="polite">
            {pageTitle}
          </div>
          <div className="app-nav-right">
            <div className="app-nav-user">
              <UserHeader />
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
}
