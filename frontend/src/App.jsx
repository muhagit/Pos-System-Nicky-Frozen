import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import LoginPage from "./pages/LoginPage";
import OwnerPage from "./pages/OwnerPage";
import KasirPage from "./pages/KasirPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminLayout from "./layouts/AdminLayout";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminStock from "./pages/admin/AdminStock";
import HistoryPage from "./pages/HistoryPage";
import KasirLayout from "./layouts/KasirLayout";
import HoldPage from "./pages/HoldPage";
import ReportPage from "./pages/ReportPage";
import NotificationPage from "./pages/NotificationPage";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* =========================================
                    1. RUTE UTAMA (ROOT)
                ========================================= */}
                <Route path="/" element={<LoginPage />} />

                {/* =========================================
                    2. RUTE OWNER
                ========================================= */}
                <Route path="/owner" element={<OwnerPage />} />

                {/* =========================================
                    3. RUTE ADMIN (Nested Routing)
                ========================================= */}
                {/* Perhatikan bahwa tag Route ini memiliki tag penutup </Route> */}
                <Route path="/admin" element={<AdminLayout />}>
                    {/* Index route ini sekarang berada DI DALAM AdminLayout */}
                    <Route index element={<AdminDashboard />} />
                    <Route path="products" element={<AdminProducts />} />{" "}
                    <Route path="stock" element={<AdminStock />} />
                </Route>

                {/* =========================================
                    4. RUTE KASIR (Nested Routing)
                ========================================= */}
                <Route element={<KasirLayout />}>
                    <Route path="/kasir" element={<KasirPage />} />
                    <Route path="/history" element={<HistoryPage />} />
                    <Route path="/hold" element={<HoldPage />} />
                    <Route path="/report" element={<ReportPage />} />
                    <Route
                        path="/notifications"
                        element={<NotificationPage />}
                    />
                </Route>

                {/* =========================================
                    5. RUTE PENYELAMAT (404)
                ========================================= */}
                {/* Jika user mengetik URL yang tidak ada di atas, lempar ke halaman Login */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
