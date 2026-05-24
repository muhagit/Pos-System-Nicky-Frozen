import React, { useState, useEffect } from "react";
import axios from "axios";
import {
    FiSearch,
    FiBell,
    FiSettings,
    FiPackage,
    FiAlertTriangle,
    FiRefreshCw,
    FiTrendingDown,
    FiTrendingUp,
} from "react-icons/fi";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
} from "recharts";

const AdminDashboard = () => {
    const [products, setProducts] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const userInfo = JSON.parse(localStorage.getItem("userInfo"));
                const config = {
                    headers: { Authorization: `Bearer ${userInfo?.token}` },
                };

                const [productRes, transactionRes] = await Promise.all([
                    axios.get("http://localhost:5000/api/products", config),
                    axios.get("http://localhost:5000/api/transactions", config),
                ]);

                setProducts(productRes.data);
                setTransactions(transactionRes.data);
                setIsLoading(false);
            } catch (error) {
                console.error("Gagal mengambil data:", error);
                setIsLoading(false); // Tetap matikan loading agar UI tidak macet
            }
        };

        // 1. Ambil data pertama kali saat halaman baru dibuka
        fetchDashboardData();

        // 2. Fitur REAL-TIME (Polling):
        // Perintahkan React mengambil data ulang setiap 10 detik di belakang layar
        const intervalId = setInterval(() => {
            fetchDashboardData();
        }, 10000); // 10000 milidetik = 10 detik

        // 3. Cleanup: Hentikan putaran timer jika admin pindah ke halaman lain
        return () => clearInterval(intervalId);
    }, []);

    // ==========================================
    // LOGIKA PERHITUNGAN DATA
    // ==========================================
    const totalProducts = products.length;
    const totalStock = products.reduce(
        (acc, curr) => acc + curr.stok_saat_ini,
        0,
    );

    // Filter produk yang menipis untuk Table Low Stock
    const lowStockProductsList = products.filter(
        (p) => p.stok_saat_ini <= p.batas_stok_minimum,
    );
    const lowStockItems = lowStockProductsList.length;

    // Olah data Pie Chart
    const categoryDataRaw = products.reduce((acc, curr) => {
        const category = curr.kategori || "Lainnya";
        acc[category] = (acc[category] || 0) + curr.stok_saat_ini;
        return acc;
    }, {});
    const pieChartData = Object.keys(categoryDataRaw).map((key) => ({
        name: key,
        value: categoryDataRaw[key],
    }));
    const COLORS = [
        "#22d3ee",
        "#0ea5e9",
        "#0284c7",
        "#0369a1",
        "#7dd3fc",
        "#bae6fd",
    ];

    // Olah data Bar Chart
    const barChartData = products.slice(0, 8).map((p) => ({
        name:
            p.nama_produk.length > 12
                ? p.nama_produk.substring(0, 12) + "..."
                : p.nama_produk,
        stock: p.stok_saat_ini,
    }));

    // Olah data Transaksi untuk Recent Movements
    // Karena ini aplikasi kasir, semua transaksi diasumsikan sebagai pengeluaran (barang terjual)
    const recentMovements = [];
    transactions.forEach((trx) => {
        trx.detail_transaksi?.forEach((item) => {
            recentMovements.push({
                id: `${trx._id}-${item._id || Math.random()}`,
                productName: item.produk_id?.nama_produk || "Produk Terjual",
                branch: trx.cabang || "Pusat",
                user: trx.user_id?.nama_lengkap || "Kasir",
                qty: item.kuantitas,
                date: new Date(trx.createdAt || Date.now()).toLocaleDateString(
                    "id-ID",
                    {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                    },
                ),
                type: "out", // 'out' = terjual (merah), bisa 'in' jika ada fitur restock (hijau)
            });
        });
    });
    // Urutkan dari yang paling baru dan ambil 5 teratas
    const topMovements = recentMovements.reverse().slice(0, 5);

    return (
        <div className="h-full flex flex-col bg-background font-poppins">
            {/* Header Topbar */}
            <header className="h-20 px-8 flex items-center justify-between bg-background flex-shrink-0">
                <h2 className="text-2xl font-bold text-gray-800">
                    Admin Dashboard
                </h2>

                <div className="flex items-center gap-6">
                    <div className="relative">
                        <FiSearch
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                            size={18}
                        />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="pl-11 pr-4 py-2.5 w-64 rounded-full border border-gray-200 bg-white focus:outline-none focus:border-primary text-sm shadow-sm transition-all"
                        />
                    </div>

                    <div className="flex items-center gap-5 text-gray-500">
                        <div className="relative cursor-pointer hover:text-primary transition">
                            <FiBell size={22} />
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-background"></span>
                        </div>
                        <FiSettings
                            size={22}
                            className="cursor-pointer hover:text-primary transition"
                        />
                    </div>
                </div>
            </header>

            {/* Dashboard Content (Scrollable) */}
            <div className="flex-1 overflow-y-auto px-8 pb-10">
                {/* 1. TOP ROW: Summary Cards */}
                <div className="grid grid-cols-4 gap-6 mb-6">
                    <StatCard
                        title="Total Products"
                        value={isLoading ? "..." : totalProducts}
                        icon={<FiPackage />}
                    />
                    <StatCard
                        title="Total Stock"
                        value={isLoading ? "..." : totalStock}
                        icon={<FiPackage />}
                    />
                    <StatCard
                        title="Low Stock Items"
                        value={isLoading ? "..." : lowStockItems}
                        subtitle={
                            lowStockItems > 0
                                ? `↓ ${lowStockItems} items`
                                : "Stok Aman"
                        }
                        icon={<FiAlertTriangle />}
                        isWarning={true}
                    />
                    <StatCard
                        title="Stock Movements"
                        value={isLoading ? "..." : transactions.length}
                        icon={<FiRefreshCw />}
                    />
                </div>

                {/* 2. MIDDLE ROW: Charts */}
                <div className="grid grid-cols-5 gap-6 mb-6">
                    {/* Pie Chart */}
                    <div className="col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
                        <h3 className="font-bold text-gray-800 text-lg">
                            Stock by Category
                        </h3>
                        <p className="text-sm text-gray-500 mb-2">
                            Current inventory distribution
                        </p>
                        <div className="flex-1 min-h-[250px] w-full">
                            {isLoading ? (
                                <div className="h-full flex items-center justify-center text-gray-400">
                                    Loading chart...
                                </div>
                            ) : pieChartData.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-gray-400">
                                    Belum ada data produk
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieChartData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {pieChartData.map(
                                                (entry, index) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={
                                                            COLORS[
                                                                index %
                                                                    COLORS.length
                                                            ]
                                                        }
                                                    />
                                                ),
                                            )}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value) => [
                                                `${value} unit`,
                                                "Total Stok",
                                            ]}
                                            contentStyle={{
                                                borderRadius: "12px",
                                                border: "none",
                                                boxShadow:
                                                    "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                                            }}
                                        />
                                        <Legend
                                            verticalAlign="bottom"
                                            height={36}
                                            iconType="circle"
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                    {/* Bar Chart */}
                    <div className="col-span-3 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
                        <h3 className="font-bold text-gray-800 text-lg">
                            Stock Levels
                        </h3>
                        <p className="text-sm text-gray-500 mb-6">
                            Products inventory status
                        </p>
                        <div className="flex-1 min-h-[250px] w-full">
                            {isLoading ? (
                                <div className="h-full flex items-center justify-center text-gray-400">
                                    Loading chart...
                                </div>
                            ) : barChartData.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-gray-400">
                                    Belum ada data produk
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={barChartData}
                                        margin={{
                                            top: 5,
                                            right: 10,
                                            left: -20,
                                            bottom: 25,
                                        }}
                                    >
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            vertical={false}
                                            stroke="#f3f4f6"
                                        />
                                        <XAxis
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{
                                                fill: "#6b7280",
                                                fontSize: 11,
                                            }}
                                            angle={-35}
                                            textAnchor="end"
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{
                                                fill: "#6b7280",
                                                fontSize: 12,
                                            }}
                                        />
                                        <Tooltip
                                            cursor={{ fill: "#f3f4f6" }}
                                            contentStyle={{
                                                borderRadius: "12px",
                                                border: "none",
                                                boxShadow:
                                                    "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                                            }}
                                        />
                                        <Bar
                                            dataKey="stock"
                                            fill="#22d3ee"
                                            radius={[4, 4, 0, 0]}
                                            barSize={40}
                                            name="Total Stok"
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>
                </div>

                {/* 3. BOTTOM ROW: Tables & Lists */}

                {/* Low Stock Alerts */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mb-6">
                    <div className="flex items-center gap-3 mb-6">
                        <FiAlertTriangle className="text-amber-500" size={24} />
                        <h3 className="font-bold text-gray-800 text-lg">
                            Low Stock Alerts
                        </h3>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-gray-500 text-sm border-b border-gray-100">
                                    <th className="pb-4 font-medium px-4">
                                        Product Name
                                    </th>
                                    <th className="pb-4 font-medium">SKU</th>
                                    <th className="pb-4 font-medium">
                                        Category
                                    </th>
                                    <th className="pb-4 font-medium">
                                        Current Stock
                                    </th>
                                    <th className="pb-4 font-medium">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {lowStockProductsList.map((product) => {
                                    // Bikin SKU buatan dari _id
                                    const sku = `FRZ-${product._id.substring(18, 24).toUpperCase()}`;
                                    const isCritical =
                                        product.stok_saat_ini === 0;

                                    return (
                                        <tr
                                            key={product._id}
                                            className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition"
                                        >
                                            <td className="py-4 px-4 font-semibold text-gray-800">
                                                {product.nama_produk}
                                            </td>
                                            <td className="py-4 text-gray-500 text-sm">
                                                {sku}
                                            </td>
                                            <td className="py-4 text-gray-500 text-sm">
                                                {product.kategori}
                                            </td>
                                            <td className="py-4 font-bold text-gray-800">
                                                {product.stok_saat_ini} units
                                            </td>
                                            <td className="py-4">
                                                <span
                                                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                        isCritical
                                                            ? "bg-red-100 text-red-600"
                                                            : "bg-amber-100 text-amber-600"
                                                    }`}
                                                >
                                                    {isCritical
                                                        ? "Critical"
                                                        : "Low Stock"}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {lowStockProductsList.length === 0 &&
                                    !isLoading && (
                                        <tr>
                                            <td
                                                colSpan="5"
                                                className="py-8 text-center text-gray-400 text-sm"
                                            >
                                                Semua stok produk dalam kondisi
                                                aman.
                                            </td>
                                        </tr>
                                    )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Recent Stock Movements */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <h3 className="font-bold text-gray-800 text-lg mb-6">
                        Recent Stock Movements
                    </h3>

                    <div className="flex flex-col gap-3">
                        {topMovements.map((movement) => (
                            <div
                                key={movement.id}
                                className="flex items-center justify-between p-4 bg-gray-50/70 rounded-xl hover:bg-gray-100/70 transition"
                            >
                                <div className="flex items-center gap-4">
                                    <div
                                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                            movement.type === "in"
                                                ? "bg-emerald-100 text-emerald-600"
                                                : "bg-red-100 text-red-500"
                                        }`}
                                    >
                                        {movement.type === "in" ? (
                                            <FiTrendingUp size={20} />
                                        ) : (
                                            <FiTrendingDown size={20} />
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800">
                                            {movement.productName}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {movement.branch} • {movement.user}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p
                                        className={`font-bold ${movement.type === "in" ? "text-emerald-500" : "text-red-500"}`}
                                    >
                                        {movement.type === "in" ? "+" : "-"}
                                        {movement.qty} units
                                    </p>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        {movement.date}
                                    </p>
                                </div>
                            </div>
                        ))}

                        {topMovements.length === 0 && !isLoading && (
                            <div className="text-center py-6 text-gray-400 text-sm">
                                Belum ada riwayat pergerakan stok.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ title, value, subtitle, icon, isWarning }) => {
    return (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
                <p className="text-gray-500 font-medium text-sm">{title}</p>
                <div
                    className={`p-3 rounded-xl text-white ${isWarning ? "bg-amber-500 shadow-amber-500/30" : "bg-primary shadow-cyan-500/30"} shadow-lg`}
                >
                    {React.cloneElement(icon, { size: 20 })}
                </div>
            </div>
            <div>
                <h3 className="text-3xl font-bold text-gray-800">{value}</h3>
                {subtitle && (
                    <p
                        className={`text-xs mt-2 font-medium ${isWarning ? "text-red-500" : "text-emerald-500"}`}
                    >
                        {subtitle}
                    </p>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
