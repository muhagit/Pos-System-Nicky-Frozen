import { BrowserRouter, Routes, Route } from "react-router-dom";

import LoginPage from "./pages/LoginPage";
import OwnerPage from "./pages/OwnerPage";
import AdminPage from "./pages/AdminPage";
import KasirPage from "./pages/KasirPage";

import HistoryPage from "./pages/HistoryPage";
import KasirLayout from "./layouts/KasirLayout";
import HoldPage from "./pages/HoldPage";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />

        <Route path="/owner" element={<OwnerPage />} />

        <Route path="/admin" element={<AdminPage />} />

        <Route path="/" element={<LoginPage />} />

        <Route element={<KasirLayout />}>
          <Route path="/kasir" element={<KasirPage />} />

          <Route path="/history" element={<HistoryPage />} />
          <Route path="/hold" element={<HoldPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
