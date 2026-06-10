import { useState } from "react";
import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { AppNav } from "./components/app-nav";
import { ToolSidebar } from "./components/tool-sidebar";
import { BlogIndex, BlogPost } from "./pages/blog";
import WebsiteToJson from "./pages/website-to-json";
import WebsiteToMarkdown from "./pages/website-to-markdown";
import WebsiteToScreenshot from "./pages/website-to-screenshot";
import WebsiteToTabular from "./pages/website-to-tabular";
import WebsiteToPdf from "./pages/website-to-pdf";
import WebsiteCrawler from "./pages/website-crawler";
import ImagesTool from "./tools/images/ImagesTool";
import NotesTool from "./tools/notes/NotesTool";
import StudyTool from "./tools/study/StudyTool";

function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const showToolSidebar =
    location.pathname === "/" ||
    location.pathname.startsWith("/web-to-") ||
    location.pathname === "/website-crawler" ||
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
        <Route path="/website-crawler" element={<WebsiteCrawler />} />
        <Route path="/blog" element={<BlogIndex />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
        {!import.meta.env.PROD && (
          <>
            <Route path="/study/*" element={<StudyTool />} />
            <Route path="/notes/*" element={<NotesTool />} />
            <Route path="/images" element={<ImagesTool />} />
          </>
        )}
        <Route path="*" element={<Navigate to="/web-to-pdf" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
