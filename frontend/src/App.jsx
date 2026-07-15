import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import LoginPage from "./pages/auth/LoginPage";
import KasirPage from "./pages/kasir/KasirPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminLayout from "./layouts/AdminLayout";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminStock from "./pages/admin/AdminStock";
import HistoryPage from "./pages/kasir/HistoryPage";
import KasirLayout from "./layouts/KasirLayout";
import HoldPage from "./pages/kasir/HoldPage";
import ReportPage from "./pages/kasir/ReportPage";
import NotificationPage from "./pages/kasir/NotificationPage";
import OwnerLayout from "./layouts/OwnerLayout";
import DashboardOwner from "./pages/owner/DashboardOwner";
import UserManagement from "./pages/owner/UserManagement";
import Analytics from "./pages/owner/Analytics";
import Reports from "./pages/owner/Reports";
import Branches from "./pages/owner/Branches";
import Notifications from "./pages/owner/Notifications";
import ClosingBook from "./pages/owner/ClosingBook";
import AdminExpired from "./pages/admin/AdminExpired";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminBranchSync from "./pages/admin/AdminBranchSync";
import AdminReports from "./pages/admin/AdminReports";
import AdminCategories from "./pages/admin/AdminCategories";

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
                <Route path="/owner" element={<OwnerLayout />}>
                    <Route index element={<DashboardOwner />} />
                    <Route path="users" element={<UserManagement />} />
                    <Route path="analytics" element={<Analytics />} />
                    <Route path="reports" element={<Reports />} />
                    <Route path="branches" element={<Branches />} />
                    <Route
                        path="/owner/notifications"
                        element={<Notifications />}
                    />
                    <Route path="closing-book" element={<ClosingBook />} />
                </Route>
                {/* =========================================
                    3. RUTE ADMIN (Nested Routing)
                ========================================= */}
                {/* Perhatikan bahwa tag Route ini memiliki tag penutup </Route> */}
                <Route path="/admin" element={<AdminLayout />}>
                    {/* Index route ini sekarang berada DI DALAM AdminLayout */}
                    <Route index element={<AdminDashboard />} />
                    <Route path="products" element={<AdminProducts />} />{" "}
                    <Route path="stock" element={<AdminStock />} />
                    <Route path="expired" element={<AdminExpired />} />
                    <Route path="settings" element={<AdminSettings />} />
                    <Route path="branch-sync" element={<AdminBranchSync />} />
                    <Route path="reports" element={<AdminReports />} />
                    <Route path="categories" element={<AdminCategories />} />
                </Route>
                {/* =========================================
                    4. RUTE KASIR (Nested Routing)
                ========================================= */}
                <Route element={<KasirLayout />}>
                    <Route path="/kasir" element={<KasirPage />} />
                    <Route path="/history" element={<HistoryPage />} />
                    <Route path="/hold" element={<HoldPage />} />
                    <Route path="/report" element={<ReportPage />} />
                    <Route path="/notifications" element={<NotificationPage />} />
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
