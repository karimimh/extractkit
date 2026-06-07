import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AppNav } from "./components/AppNav";
import PdfTool from "./pages/PdfTool";
import MarkdownTool from "./pages/MarkdownTool";
import ScreenshotTool from "./pages/ScreenshotTool";
import { ToolPlaceholder } from "./pages/ToolPlaceholder";
import StudyTool from "./tools/study/StudyTool";
import ImagesTool from "./tools/images/ImagesTool";
import NotesTool from "./tools/notes/NotesTool";

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
        <Route path="/web-to-pdf" element={<PdfTool />} />
        <Route path="/web-to-markdown" element={<MarkdownTool />} />
        <Route path="/web-to-screenshot" element={<ScreenshotTool />} />
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
