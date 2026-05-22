import React, { useState, useEffect } from "react";
import axios from "axios";
import {
    LayoutDashboard,
    Package,
    Activity,
    AlertTriangle,
    Users,
    RefreshCw,
    FileText,
    LogOut,
    Search,
    Bell,
    Settings,
    TrendingUp,
    TrendingDown,
} from "lucide-react";

const AdminDashboard = () => {
    // State untuk menyimpan data dari Backend
    const [products, setProducts] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Mengambil data dari Backend saat komponen dimuat
    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Ambil token dari localStorage (sesuaikan dengan cara Anda menyimpan sesi login)
                const userInfo = JSON.parse(localStorage.getItem("userInfo"));
                const config = {
                    headers: {
                        Authorization: `Bearer ${userInfo?.token}`,
                    },
                };

                // Ambil data produk dan transaksi secara bersamaan
                const [productRes, transactionRes] = await Promise.all([
                    axios.get("http://localhost:5000/api/products", config),
                    axios.get("http://localhost:5000/api/transactions", config),
                ]);

                setProducts(productRes.data);
                setTransactions(transactionRes.data);
                setIsLoading(false);
            } catch (error) {
                console.error("Gagal mengambil data backend:", error);
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    // Kalkulasi Data Otomatis berdasarkan Database
    const totalProducts = products.length;
    const totalStock = products.reduce(
        (acc, curr) => acc + curr.stok_saat_ini,
        0,
    );

    // Filter produk yang stoknya <= batas minimum
    const lowStockProducts = products.filter(
        (p) => p.stok_saat_ini <= p.batas_stok_minimum,
    );

    return (
        <div className="flex h-screen w-full bg-[var(--color-background)] font-poppins overflow-hidden">
            {/* ================= SIDEBAR (Tetap) ================= */}
            <aside className="w-64 flex flex-col bg-[var(--color-sidebar)] text-white h-full shadow-xl flex-shrink-0">
                <div className="flex items-center gap-3 px-6 py-6 border-b border-white/10">
                    <div className="bg-[var(--color-primary)] p-2 rounded-lg text-white">
                        <LayoutDashboard size={24} />
                    </div>
                    <div>
                        <h1 className="font-bold text-lg leading-tight">
                            Nicky Frozen
                        </h1>
                        <p className="text-[var(--color-primary)] text-xs">
                            Admin
                        </p>
                    </div>
                </div>

                <div className="mx-4 mt-6 mb-2 p-3 bg-[var(--color-sidebar-light)] rounded-xl flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[var(--color-primary)] flex items-center justify-center font-bold text-[var(--color-sidebar)]">
                        A
                    </div>
                    <div>
                        <p className="font-semibold text-sm">Admin User</p>
                        <p className="text-xs text-gray-400">Admin Account</p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1 space-y-1">
                    <NavItem
                        icon={<LayoutDashboard size={20} />}
                        label="Dashboard"
                        active
                    />
                    <NavItem icon={<Package size={20} />} label="Products" />
                    <NavItem
                        icon={<Activity size={20} />}
                        label="Stock Management"
                    />
                    <NavItem
                        icon={<AlertTriangle size={20} />}
                        label="Expired Monitoring"
                    />
                    <NavItem
                        icon={<Users size={20} />}
                        label="User Management"
                    />
                    <NavItem
                        icon={<RefreshCw size={20} />}
                        label="Branch Sync"
                    />
                    <NavItem icon={<FileText size={20} />} label="Reports" />
                </div>

                <div className="p-4 border-t border-white/10">
                    <button className="flex items-center gap-3 px-4 py-3 w-full text-left text-gray-300 hover:text-white hover:bg-[var(--color-danger)]/20 rounded-xl transition-colors">
                        <LogOut size={20} />
                        <span className="font-medium">Logout</span>
                    </button>
                </div>
            </aside>

            {/* ================= MAIN CONTENT (Bisa di-scroll) ================= */}
            <main className="flex-1 flex flex-col h-full overflow-hidden">
                <header className="h-20 px-8 flex items-center justify-between bg-[var(--color-background)] flex-shrink-0">
                    <h2 className="text-2xl font-bold text-[var(--color-text)]">
                        Admin Dashboard
                    </h2>
                    <div className="flex items-center gap-6">
                        <div className="relative">
                            <Search
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                size={18}
                            />
                            <input
                                type="text"
                                placeholder="Search..."
                                className="pl-10 pr-4 py-2 w-64 rounded-full border border-[var(--color-border)] bg-[var(--color-card)] focus:outline-none focus:border-[var(--color-primary)] text-sm"
                            />
                        </div>
                        <div className="flex items-center gap-4 text-[var(--color-text-secondary)]">
                            <div className="relative cursor-pointer hover:text-[var(--color-primary)]">
                                <Bell size={24} />
                                <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-[var(--color-danger)] rounded-full border-2 border-[var(--color-background)]"></span>
                            </div>
                            <Settings
                                size={24}
                                className="cursor-pointer hover:text-[var(--color-primary)]"
                            />
                        </div>
                    </div>
                </header>

                {/* Area Konten Utama - Menggunakan overflow-y-auto agar bisa di-scroll ke bawah */}
                <div className="flex-1 overflow-y-auto px-8 pb-10">
                    {/* TOP ROW: Summary Cards Dinamis */}
                    <div className="grid grid-cols-4 gap-6 mb-6">
                        <StatCard
                            title="Total Products"
                            value={isLoading ? "..." : totalProducts}
                            icon={<Package />}
                            color="primary"
                        />
                        <StatCard
                            title="Total Stock"
                            value={isLoading ? "..." : totalStock}
                            icon={<Package />}
                            color="primary"
                        />
                        <StatCard
                            title="Low Stock Items"
                            value={isLoading ? "..." : lowStockProducts.length}
                            subtitle={
                                lowStockProducts.length > 0
                                    ? `↓ ${lowStockProducts.length} items`
                                    : "Stok Aman"
                            }
                            icon={<AlertTriangle />}
                            color="warning"
                        />
                        <StatCard
                            title="Total Transactions"
                            value={isLoading ? "..." : transactions.length}
                            icon={<RefreshCw />}
                            color="primary"
                        />
                    </div>

                    {/* MIDDLE ROW: Charts Area (Mockup visual dipertahankan) */}
                    <div className="grid grid-cols-5 gap-6 mb-6">
                        <div className="col-span-2 bg-[var(--color-card)] p-6 rounded-2xl border border-[var(--color-border)] shadow-sm">
                            <h3 className="font-bold text-[var(--color-text)] text-lg">
                                Stock by Category
                            </h3>
                            <p className="text-sm text-[var(--color-text-secondary)] mb-6">
                                Current inventory distribution
                            </p>
                            <div className="flex justify-center items-center h-64 relative">
                                <div
                                    className="w-48 h-48 rounded-full shadow-inner"
                                    style={{
                                        background:
                                            "conic-gradient(#22d3ee 0% 40%, #06b6d4 40% 65%, #a5f3fc 65% 100%)",
                                    }}
                                ></div>
                            </div>
                        </div>

                        <div className="col-span-3 bg-[var(--color-card)] p-6 rounded-2xl border border-[var(--color-border)] shadow-sm">
                            <h3 className="font-bold text-[var(--color-text)] text-lg">
                                Stock Levels
                            </h3>
                            <p className="text-sm text-[var(--color-text-secondary)] mb-6">
                                Products inventory status
                            </p>
                            <div className="h-64 flex items-end justify-around gap-4 border-b border-l border-[var(--color-border)] pb-2 pl-2 relative">
                                {/* Bar Chart Mockup */}
                                {[
                                    "Chicken Nugget",
                                    "Fish Fillet",
                                    "French Fries",
                                ].map((name, i) => (
                                    <div
                                        key={i}
                                        className="flex flex-col items-center w-full group"
                                    >
                                        <div
                                            className="w-full bg-[var(--color-primary)] rounded-t-sm"
                                            style={{
                                                height: `${Math.floor(Math.random() * 80 + 20)}%`,
                                            }}
                                        ></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ================= BOTTOM ROW 1: LOW STOCK ALERTS ================= */}
                    <div className="bg-[var(--color-card)] p-6 rounded-2xl border border-[var(--color-border)] shadow-sm mb-6">
                        <div className="flex items-center gap-2 mb-6">
                            <AlertTriangle
                                className="text-[var(--color-warning)]"
                                size={24}
                            />
                            <h3 className="font-bold text-[var(--color-text)] text-xl">
                                Low Stock Alerts
                            </h3>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="text-[var(--color-text-secondary)] text-sm border-b border-[var(--color-border)]">
                                        <th className="pb-3 font-medium">
                                            Product Name
                                        </th>
                                        <th className="pb-3 font-medium">
                                            Product ID
                                        </th>
                                        <th className="pb-3 font-medium">
                                            Category
                                        </th>
                                        <th className="pb-3 font-medium">
                                            Current Stock
                                        </th>
                                        <th className="pb-3 font-medium">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {lowStockProducts.map((product) => (
                                        <tr
                                            key={product._id}
                                            className="border-b border-[var(--color-border)] last:border-0 hover:bg-gray-50"
                                        >
                                            <td className="py-4 text-[var(--color-text)] font-medium">
                                                {product.nama_produk}
                                            </td>
                                            <td className="py-4 text-[var(--color-text-secondary)] text-sm">
                                                {product._id
                                                    .substring(18, 24)
                                                    .toUpperCase()}
                                            </td>
                                            <td className="py-4 text-[var(--color-text-secondary)]">
                                                {product.kategori}
                                            </td>
                                            <td className="py-4 font-semibold text-[var(--color-text)]">
                                                {product.stok_saat_ini} units
                                            </td>
                                            <td className="py-4">
                                                <span
                                                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                        product.stok_saat_ini ===
                                                        0
                                                            ? "bg-red-100 text-red-600" // Critical
                                                            : "bg-yellow-100 text-yellow-700" // Low Stock
                                                    }`}
                                                >
                                                    {product.stok_saat_ini === 0
                                                        ? "Critical"
                                                        : "Low Stock"}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {lowStockProducts.length === 0 &&
                                        !isLoading && (
                                            <tr>
                                                <td
                                                    colSpan="5"
                                                    className="py-8 text-center text-gray-400"
                                                >
                                                    Semua stok produk dalam
                                                    kondisi aman.
                                                </td>
                                            </tr>
                                        )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* ================= BOTTOM ROW 2: RECENT STOCK MOVEMENTS ================= */}
                    <div className="bg-[var(--color-card)] p-6 rounded-2xl border border-[var(--color-border)] shadow-sm">
                        <h3 className="font-bold text-[var(--color-text)] text-xl mb-6">
                            Recent Stock Movements
                        </h3>

                        <div className="flex flex-col gap-4">
                            {transactions.slice(0, 5).map((trx, index) =>
                                // Kita melakukan map ke dalam detail_transaksi karena 1 transaksi bisa punya banyak produk
                                trx.detail_transaksi.map((item, idx) => (
                                    <div
                                        key={`${trx._id}-${idx}`}
                                        className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-transparent hover:border-[var(--color-border)] transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            {/* Ikon Pengurangan (Karena ini data transaksi penjualan) */}
                                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-500">
                                                <TrendingDown size={20} />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-[var(--color-text)]">
                                                    {item.produk_id
                                                        ?.nama_produk ||
                                                        "Produk Terjual"}
                                                </p>
                                                <p className="text-xs text-[var(--color-text-secondary)]">
                                                    {trx.cabang} •{" "}
                                                    {trx.user_id
                                                        ?.nama_lengkap ||
                                                        "Kasir"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-red-600">
                                                -{item.kuantitas} units
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                {new Date(
                                                    trx.createdAt,
                                                ).toLocaleDateString("id-ID")}
                                            </p>
                                        </div>
                                    </div>
                                )),
                            )}

                            {transactions.length === 0 && !isLoading && (
                                <p className="text-center text-gray-400 py-4">
                                    Belum ada pergerakan stok (transaksi).
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

const NavItem = ({ icon, label, active }) => {
    return (
        <button
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 w-full text-left
            ${active ? "bg-[var(--color-primary)] text-white font-medium shadow-md shadow-cyan-500/20" : "text-gray-300 hover:bg-[var(--color-sidebar-light)] hover:text-white"}
        `}
        >
            {icon}
            <span className="text-sm">{label}</span>
        </button>
    );
};

const StatCard = ({ title, value, subtitle, icon, color }) => {
    const isWarning = color === "warning";
    return (
        <div className="bg-[var(--color-card)] p-6 rounded-2xl border border-[var(--color-border)] shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
                <p className="text-[var(--color-text-secondary)] font-medium text-sm">
                    {title}
                </p>
                <div
                    className={`p-2.5 rounded-lg text-white ${isWarning ? "bg-[var(--color-warning)]" : "bg-[var(--color-primary)]"}`}
                >
                    {React.cloneElement(icon, { size: 20 })}
                </div>
            </div>
            <div>
                <h3 className="text-3xl font-bold text-[var(--color-text)]">
                    {value}
                </h3>
                {subtitle && (
                    <p
                        className={`text-xs mt-1 ${isWarning ? "text-[var(--color-danger)]" : "text-[var(--color-success)]"}`}
                    >
                        {subtitle}
                    </p>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
