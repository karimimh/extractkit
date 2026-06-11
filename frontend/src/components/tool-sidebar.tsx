import { BookOpen, History, X } from "lucide-react";
import { NavLink } from "react-router-dom";
import { ThemeSwitcher } from "./theme-switcher";
import { AUTOMATION_TOOLS, CONVERSION_TOOLS } from "./tool-nav-items";

type ToolSidebarProps = {
  isOpen?: boolean;
  onClose?: () => void;
};

export function ToolSidebar({ isOpen = false, onClose }: ToolSidebarProps) {
  return (
    <aside
      className={isOpen ? "tool-sidebar open" : "tool-sidebar"}
      aria-label="Tool selection"
    >
      <div className="tool-sidebar-header">
        <span>DistillPage</span>
        <button
          type="button"
          className="tool-sidebar-close"
          aria-label="Close tool sidebar"
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>

      <div className="tool-sidebar-section">
        <p className="tool-sidebar-label">Webpage Export</p>
        <nav className="tool-sidebar-nav">
          {CONVERSION_TOOLS.map((tool) => {
            const Icon = tool.icon;

            return (
              <NavLink
                key={tool.to}
                to={tool.to}
                className={({ isActive }) =>
                  isActive ? "tool-sidebar-link active" : "tool-sidebar-link"
                }
                onClick={onClose}
              >
                <Icon size={18} aria-hidden="true" />
                <span>{tool.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="tool-sidebar-section">
        <p className="tool-sidebar-label">Automation</p>
        <nav className="tool-sidebar-nav">
          {AUTOMATION_TOOLS.map((tool) => {
            const Icon = tool.icon;
            return (
              <NavLink key={tool.to} to={tool.to} className={({ isActive }) => isActive ? "tool-sidebar-link active" : "tool-sidebar-link"} onClick={onClose}>
                <Icon size={18} aria-hidden="true" />
                <span>{tool.label}</span>
              </NavLink>
            );
          })}
          <NavLink to="/export-history" className={({ isActive }) => isActive ? "tool-sidebar-link active" : "tool-sidebar-link"} onClick={onClose}>
            <History size={18} aria-hidden="true" />
            <span>Export History</span>
          </NavLink>
        </nav>
      </div>

      <div className="tool-sidebar-section">
        <p className="tool-sidebar-label">Learn</p>
        <NavLink
          to="/blog"
          className={({ isActive }) =>
            isActive ? "tool-sidebar-link active" : "tool-sidebar-link"
          }
          onClick={onClose}
        >
          <BookOpen size={18} aria-hidden="true" />
          <span>Blog</span>
        </NavLink>
      </div>

      <div className="tool-sidebar-footer">
        <p className="tool-sidebar-label">Theme</p>
        <ThemeSwitcher />
      </div>
    </aside>
  );
}
