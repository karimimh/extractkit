import { useEffect } from "react";
import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { AppNav } from "./components/app-nav";
import { BlogIndex, BlogPost } from "./pages/blog";
import WebsiteToJson from "./pages/website-to-json";
import WebsiteToMarkdown from "./pages/website-to-markdown";
import WebsiteToScreenshot from "./pages/website-to-screenshot";
import WebsiteToTabular from "./pages/website-to-tabular";
import WebsiteToPdf from "./pages/website-to-pdf";
import ChangeMonitors from "./pages/change-monitors";
import DeveloperAPI from "./pages/developer-api";
import DeveloperDocs from "./pages/developer-docs";
import { CHANGE_MONITORING_ENABLED } from "./lib/features";

function Layout() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname]);

  return (
    <div className="app-shell">
      <AppNav />
      <div className="app-shell-content">
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
        {CHANGE_MONITORING_ENABLED && <Route path="/change-monitoring" element={<ChangeMonitors />} />}
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
