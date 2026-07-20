import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ListPage from "./pages/ListPage";
import NewPage from "./pages/NewPage";
import ExpandPage from "./pages/ExpandPage";
import EditPage from "./pages/EditPage";
import PreviewPage from "./pages/PreviewPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ListPage />} />
        <Route path="/new" element={<NewPage />} />
        <Route path="/projects/:id/expand" element={<ExpandPage />} />
        <Route path="/projects/:id" element={<EditPage />} />
        <Route path="/projects/:id/preview" element={<PreviewPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
