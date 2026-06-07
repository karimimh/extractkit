import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AppNav } from "./components/AppNav";
import PdfTool from "./pages/PdfTool";
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
        <Route index element={<Navigate to="/pdf" replace />} />
        <Route path="/pdf" element={<PdfTool />} />
        <Route
          path="/markdown"
          element={
            <ToolPlaceholder
              title="Export Any Webpage to Markdown"
              description="Convert a web page into clean, portable Markdown."
            />
          }
        />
        <Route
          path="/screenshots"
          element={
            <ToolPlaceholder
              title="Capture Webpage Screenshots"
              description="Generate full-page or sectioned screenshots from any URL."
            />
          }
        />
        <Route
          path="/study/*"
          element={<StudyTool />}
        />
        <Route
          path="/notes/*"
          element={<NotesTool />}
        />
        <Route
          path="/images"
          element={<ImagesTool />}
        />
        <Route path="*" element={<Navigate to="/pdf" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
