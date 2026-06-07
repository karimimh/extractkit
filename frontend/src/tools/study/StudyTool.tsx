import { Routes, Route, useParams } from "react-router-dom";
import StudyHome from "@study/app/page";
import DocumentView from "@study/components/DocumentView";
import "@study/globals.css";

function DocumentRoute() {
  const { id } = useParams<{ id: string }>();
  return <DocumentView id={id ?? ""} />;
}

export default function StudyTool() {
  return (
    <div className="min-h-full bg-slate-50 text-slate-900">
      <div className="mx-auto w-full max-w-5xl px-4 py-8">
        <Routes>
          <Route index element={<StudyHome />} />
          <Route path="document/:id" element={<DocumentRoute />} />
        </Routes>
      </div>
    </div>
  );
}
