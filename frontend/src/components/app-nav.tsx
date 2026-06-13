import { NavLink } from "react-router-dom";
import { ChevronDown, Code2 } from "lucide-react";
import { useState } from "react";
import { UserHeader } from "./user-header";
import { AUTOMATION_TOOLS, CONVERSION_TOOLS } from "./tool-nav-items";

function ToolLinks({
  tools,
  onSelect,
}: {
  tools: typeof CONVERSION_TOOLS;
  onSelect: () => void;
}) {
  return tools.map((tool) => {
    const Icon = tool.icon;
    return (
      <NavLink
        key={tool.to}
        to={tool.to}
        className="app-nav-tool-link"
        onClick={onSelect}
      >
        <Icon size={18} aria-hidden="true" />
        <span>{tool.label}</span>
      </NavLink>
    );
  });
}

export function AppNav() {
  const [toolsDismissed, setToolsDismissed] = useState(false);
  const closeTools = () => setToolsDismissed(true);

  return (
    <div className="app-nav-shadow-wrapper">
      <nav className="app-nav">
        <div className="app-nav-inner">
          <NavLink to="/" className="app-nav-brand">
            ExtractKit
          </NavLink>

          <div className="app-nav-links">
            <div
              className={`app-nav-tools-menu${toolsDismissed ? " dismissed" : ""}`}
            >
              <button
                type="button"
                className="app-nav-tools-trigger"
                aria-haspopup="true"
                onClick={() => setToolsDismissed((current) => !current)}
                onMouseEnter={() => setToolsDismissed(false)}
              >
                Tools <ChevronDown size={15} aria-hidden="true" />
              </button>
              <div className="app-nav-tools-popover">
                <div className="app-nav-tool-category">
                  <p>Convert &amp; capture</p>
                  <ToolLinks tools={CONVERSION_TOOLS} onSelect={closeTools} />
                </div>
                <div className="app-nav-tool-category">
                  <p>Automate &amp; integrate</p>
                  <ToolLinks tools={AUTOMATION_TOOLS} onSelect={closeTools} />
                  <NavLink
                    to="/developer-api"
                    className="app-nav-tool-link"
                    onClick={closeTools}
                  >
                    <Code2 size={18} aria-hidden="true" />
                    <span>Developer API and Integrations</span>
                  </NavLink>
                </div>
              </div>
            </div>
            <NavLink to="/blog" className="app-nav-link">Blog</NavLink>
            <NavLink to="/developers/docs" className="app-nav-link">API Docs</NavLink>
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
