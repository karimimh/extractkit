import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { AppNav } from "./components/app-nav";
import WebsiteToMarkdown from "./pages/website-to-markdown";
import WebsiteToScreenshot from "./pages/website-to-screenshot";
import WebsiteToPdf from "./pages/website-to-pdf";
import ImagesTool from "./tools/images/ImagesTool";
import NotesTool from "./tools/notes/NotesTool";
import StudyTool from "./tools/study/StudyTool";

function Layout() {
  return (
    <div className="app-shell">
      <AppNav />
      <Outlet />
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
        <Route path="/web-to-screenshot" element={<WebsiteToScreenshot />} />
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
