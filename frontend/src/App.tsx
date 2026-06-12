import { useEffect, useState } from "react";
import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { AppNav } from "./components/app-nav";
import { ToolSidebar } from "./components/tool-sidebar";
import { BlogIndex, BlogPost } from "./pages/blog";
import WebsiteToJson from "./pages/website-to-json";
import WebsiteToMarkdown from "./pages/website-to-markdown";
import WebsiteToScreenshot from "./pages/website-to-screenshot";
import WebsiteToTabular from "./pages/website-to-tabular";
import WebsiteToPdf from "./pages/website-to-pdf";
import WebsiteBulkExport from "./pages/website-bulk-export";
import ChangeMonitors from "./pages/change-monitors";
import DeveloperAPI from "./pages/developer-api";
import DeveloperDocs from "./pages/developer-docs";

function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname]);

  const showToolSidebar =
    location.pathname === "/" ||
    location.pathname.startsWith("/web-to-") ||
    location.pathname === "/website-bulk-export" ||
    location.pathname === "/change-monitoring" ||
    location.pathname === "/developer-api" ||
    location.pathname === "/developers/docs" ||
    location.pathname.startsWith("/blog");

  return (
    <div className="app-shell">
      <AppNav
        showSidebarToggle={showToolSidebar}
        onOpenSidebar={() => setSidebarOpen(true)}
      />
      <div className={showToolSidebar ? "app-shell-content" : "app-shell-content no-sidebar"}>
        {showToolSidebar && (
          <>
            <button
              type="button"
              className={sidebarOpen ? "tool-sidebar-backdrop open" : "tool-sidebar-backdrop"}
              aria-label="Close tool sidebar"
              onClick={() => setSidebarOpen(false)}
            />
            <ToolSidebar
              isOpen={sidebarOpen}
              onClose={() => setSidebarOpen(false)}
            />
          </>
        )}
        <div className="app-shell-main">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/web-to-pdf" replace />} />
        <Route path="/web-to-pdf" element={<WebsiteToPdf />} />
        <Route path="/web-to-markdown" element={<WebsiteToMarkdown />} />
        <Route path="/web-to-json" element={<WebsiteToJson />} />
        <Route path="/web-to-csv" element={<WebsiteToTabular format="csv" />} />
        <Route path="/web-to-excel" element={<WebsiteToTabular format="xlsx" />} />
        <Route path="/web-to-screenshot" element={<WebsiteToScreenshot />} />
        <Route path="/website-bulk-export" element={<WebsiteBulkExport />} />
        <Route path="/change-monitoring" element={<ChangeMonitors />} />
        <Route path="/developer-api" element={<DeveloperAPI />} />
        <Route path="/developers/docs" element={<DeveloperDocs />} />
        <Route path="/blog" element={<BlogIndex />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
        <Route path="*" element={<Navigate to="/web-to-pdf" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
