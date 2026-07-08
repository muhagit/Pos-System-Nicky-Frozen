import { useEffect, useState } from "react";
import api from "../../utils/api";
import { FiTrendingUp, FiShoppingCart, FiUsers, FiPercent } from "react-icons/fi";
import StatCard from "../../components/owner/StatCard";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const formatRupiah = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-border rounded-xl p-3 shadow-lg text-xs font-poppins">
        <p className="font-semibold text-text mb-2">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="mb-0.5" style={{ color: p.color }}>
            {p.name}: {formatRupiah(p.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const Analytics = () => {
  const [analytics, setAnalytics] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    customers: 0,
    conversionRate: 100,
  });
  const [trendData, setTrendData] = useState([]);
  const [selectedCabang, setSelectedCabang] = useState("Gabungan");
  const [loading, setLoading] = useState(false);

  const fetchAnalytics = async (branch) => {
    try {
      setLoading(true);

      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      const config = {
        headers: { Authorization: `Bearer ${userInfo?.token}` },
      };

      const url = branch === "Gabungan"
        ? "/transactions/report"
        : `/transactions/report?cabang=${encodeURIComponent(branch)}`;

      const { data } = await api.get(url, config);

      setAnalytics({
        totalRevenue: data.totalRevenue || 0,
        totalOrders: data.totalTransactions || 0,
        customers: data.customers || 0,
        conversionRate: data.conversionRate || 100,
      });
      setTrendData(data.trendData || []);
    } catch (error) {
      console.error(error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(selectedCabang);
  }, [selectedCabang]);

  const statCards = [
    {
      label: "Total Revenue",
      value: formatRupiah(analytics.totalRevenue),
      sub: "Berdasarkan penjualan selesai",
      icon: FiTrendingUp,
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
      naik: true,
    },
    {
      label: "Total Orders",
      value: `${analytics.totalOrders} Pesanan`,
      sub: "Transaksi selesai hari ini",
      icon: FiShoppingCart,
      iconBg: "bg-success/10",
      iconColor: "text-success",
      naik: true,
    },
    {
      label: "Customers",
      value: `${analytics.customers} Pelanggan`,
      sub: "Estimasi pelanggan unik",
      icon: FiUsers,
      iconBg: "bg-warning/10",
      iconColor: "text-warning",
      naik: true,
    },
    {
      label: "Conversion Rate",
      value: `${analytics.conversionRate}%`,
      sub: "Rasio penyelesaian transaksi",
      icon: FiPercent,
      iconBg: "bg-danger/10",
      iconColor: "text-danger",
      naik: true,
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen bg-background font-poppins">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-text">Analytics</h1>
          <p className="text-text-secondary mt-1">
            Business performance overview
          </p>
        </div>

        <div>
          <select
            value={selectedCabang}
            onChange={(e) => setSelectedCabang(e.target.value)}
            className="border border-border rounded-xl px-4 py-2.5 bg-card text-text outline-none shadow-sm font-medium focus:border-primary transition cursor-pointer"
          >
            <option value="Gabungan">Gabungan (Semua Cabang)</option>
            <option value="Cabang Solo">Cabang Solo</option>
            <option value="Cabang Jogja">Cabang Jogja</option>
          </select>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {statCards.map((card, i) => (
          <StatCard key={i} {...card} />
        ))}
      </div>

      {/* REVENUE TREND CHART */}
      <div className="mt-8 bg-card border border-border rounded-2xl p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-text text-sm">Tren Pendapatan Mingguan</h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Pendapatan harian dalam 7 hari terakhir ({selectedCabang})
            </p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={trendData}>
            <defs>
              <linearGradient id="gradTrendRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

            <XAxis
              dataKey="hari"
              tick={{ fontSize: 11, fill: "#6b7280", fontFamily: "Poppins" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#6b7280", fontFamily: "Poppins" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v / 1000000}jt`}
            />

            <Tooltip content={<CustomTooltip />} />

            <Area
              type="monotone"
              dataKey="revenue"
              name="Pendapatan"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#gradTrendRevenue)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Analytics;