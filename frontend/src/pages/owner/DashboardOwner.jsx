import React, { useState, useEffect } from "react";
import api from "../../utils/api";
import {
  FiTrendingUp,
  FiShoppingCart,
  FiAlertCircle,
  FiPackage,
  FiClock,
  FiBell,
  FiX,
} from "react-icons/fi";

import StatCard from "../../components/owner/StatCard";
import RevenueChart from "../../components/owner/RevenueChart";
import CategoryChart from "../../components/owner/CategoryChart";
import NotificationPopup from "../../components/owner/NotificationPopup";

const notifStyle = {
  expired: {
    bg: "bg-warning/10",
    text: "text-warning",
    border: "border-warning/20",
    label: "Expired",
    dot: "bg-warning",
  },
  selisih: {
    bg: "bg-danger/10",
    text: "text-danger",
    border: "border-danger/20",
    label: "Selisih Kas",
    dot: "bg-danger",
  },
  stok: {
    bg: "bg-primary/10",
    text: "text-primary",
    border: "border-primary/20",
    label: "Stok Menipis",
    dot: "bg-primary",
  },
};

const formatRupiah = (angka) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(angka);
};

const DashboardOwner = () => {
  // --- STATE UNTUK DATA BACKEND ---
  const [stats, setStats] = useState({
    penjualanHariIni: 0,
    persentasePenjualan: "0%",
    totalTransaksi: 0,
    persentaseTransaksi: "0%",
    selisihKas: 0,
    produkHampirHabis: 0,
  });
  const [notifikasiTerbaru, setNotifikasiTerbaru] = useState([]);
  const [showNotification, setShowNotification] = useState(false);

  // State baru untuk Chart
  const [revenueData, setRevenueData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filterType, setFilterType] = useState("all");

  const handleFilterTypeChange = (type) => {
    setFilterType(type);
    const today = new Date();
    
    if (type === "all") {
      setStartDate("");
      setEndDate("");
    } else if (type === "today") {
      const todayStr = today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, '0') + "-" + String(today.getDate()).padStart(2, '0');
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (type === "week") {
      const lastWeek = new Date();
      lastWeek.setDate(today.getDate() - 7);
      const startStr = lastWeek.getFullYear() + "-" + String(lastWeek.getMonth() + 1).padStart(2, '0') + "-" + String(lastWeek.getDate()).padStart(2, '0');
      const endStr = today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, '0') + "-" + String(today.getDate()).padStart(2, '0');
      setStartDate(startStr);
      setEndDate(endStr);
    } else if (type === "month") {
      const lastMonth = new Date();
      lastMonth.setMonth(today.getMonth() - 1);
      const startStr = lastMonth.getFullYear() + "-" + String(lastMonth.getMonth() + 1).padStart(2, '0') + "-" + String(lastMonth.getDate()).padStart(2, '0');
      const endStr = today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, '0') + "-" + String(today.getDate()).padStart(2, '0');
      setStartDate(startStr);
      setEndDate(endStr);
    } else if (type === "custom") {
      setStartDate("");
      setEndDate("");
    }
  };

  const getRevenueChartTitle = () => {
    if (filterType === "all") return "Penjualan Semua Waktu";
    if (filterType === "today") return "Penjualan Hari Ini";
    if (filterType === "week") return "Penjualan 1 Minggu Terakhir";
    if (filterType === "month") return "Penjualan 1 Bulan Terakhir";
    return "Penjualan Periode Kustom";
  };

  const fetchDashboardData = async (start = startDate, end = endDate) => {
    try {
      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      const config = {
        headers: { Authorization: `Bearer ${userInfo?.token}` },
        params: {}
      };

      if (start) {
        config.params.startDate = start;
      }
      if (end) {
        config.params.endDate = end;
      }

      const { data } = await api.get(
        "/dashboard/owner",
        config,
      );

      setStats(data.stats);
      setNotifikasiTerbaru(data.notifikasi);

      // Set data chart dari backend
      setRevenueData(data.revenueData);
      setCategoryData(data.categoryData);

      setIsLoading(false);
    } catch (error) {
      console.error("Gagal mengambil data dashboard:", error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(startDate, endDate);
  }, [startDate, endDate]);

  const statCards = [
    {
      label: filterType === "today" ? "Total Penjualan Hari Ini" : "Total Penjualan",
      value: formatRupiah(stats.penjualanHariIni),
      sub: `${stats.persentasePenjualan} dari periode sebelumnya`,
      icon: FiTrendingUp,
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
      naik: !stats.persentasePenjualan.includes("-"),
    },
    {
      label: filterType === "today" ? "Total Transaksi Hari Ini" : "Total Transaksi",
      value: `${stats.totalTransaksi} Transaksi`,
      sub: `${stats.persentaseTransaksi} dari periode sebelumnya`,
      icon: FiShoppingCart,
      iconBg: "bg-success/10",
      iconColor: "text-success",
      naik: !stats.persentaseTransaksi.includes("-"),
    },
    {
      label: "Selisih Kas",
      value: formatRupiah(stats.selisihKas),
      sub: stats.selisihKas > 0 ? "Terdeteksi selisih" : "Aman",
      icon: FiAlertCircle,
      iconBg: "bg-danger/10",
      iconColor: "text-danger",
      naik: false,
    },
    {
      label: "Produk Hampir Habis",
      value: `${stats.produkHampirHabis} Produk`,
      sub: "Perlu restock segera",
      icon: FiPackage,
      iconBg: "bg-warning/10",
      iconColor: "text-warning",
      naik: false,
    },
  ];

  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const jam = new Date().toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="h-full overflow-y-auto bg-background font-poppins">
      <div className="p-6 max-w-screen-xl mx-auto space-y-6">
        {/* ── HEADER ── */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text">Dashboard</h1>

            <p className="text-sm text-text-secondary mt-0.5 capitalize">
              {today}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* NOTIFICATION */}

            <button
              onClick={() => setShowNotification(true)}
              className="
        relative
        w-12
        h-12
        rounded-2xl
        bg-white
        border
        border-gray-200
        shadow-sm
        hover:shadow-md
        transition
        flex
        items-center
        justify-center
    "
            >
              <FiBell size={22} className="text-slate-700" />

              {notifikasiTerbaru.length > 0 && (
                <span
                  className="
                absolute
                -top-1
                -right-1
                min-w-5
                h-5
                px-1
                rounded-full
                bg-red-500
                text-white
                text-[10px]
                flex
                items-center
                justify-center
                font-bold
            "
                >
                  {notifikasiTerbaru.length}
                </span>
              )}
            </button>

            {/* JAM */}

            <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-2 shadow-sm">
              <FiClock size={14} className="text-primary" />
              <span className="text-sm font-medium text-text">{jam} WIB</span>
            </div>
          </div>
        </div>
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {/* ── FILTER AREA ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border p-4 rounded-3xl shadow-sm">
              <div className="text-sm font-bold text-text">Filter Dashboard</div>
              <div className="flex flex-wrap items-end gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block font-poppins">Periode</label>
                  <select
                    value={filterType}
                    onChange={(e) => handleFilterTypeChange(e.target.value)}
                    className="px-4 py-2 border border-border rounded-xl text-xs font-semibold text-text bg-background outline-none focus:border-primary cursor-pointer min-w-[150px]"
                  >
                    <option value="all">Semua Waktu</option>
                    <option value="today">Hari Ini (1 Hari)</option>
                    <option value="week">1 Minggu Terakhir</option>
                    <option value="month">1 Bulan Terakhir</option>
                    <option value="custom">Kustom Tanggal</option>
                  </select>
                </div>

                {filterType === "custom" && (
                  <>
                    <div className="space-y-1.5 animate-fade-in">
                      <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block font-poppins">Tanggal Mulai</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="px-4 py-2 border border-border rounded-xl text-xs font-medium text-text bg-background outline-none focus:border-primary"
                      />
                    </div>
                    <div className="space-y-1.5 animate-fade-in">
                      <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block font-poppins">Tanggal Akhir</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="px-4 py-2 border border-border rounded-xl text-xs font-medium text-text bg-background outline-none focus:border-primary"
                      />
                    </div>
                  </>
                )}

                {filterType !== "all" && (
                  <button
                    onClick={() => handleFilterTypeChange("all")}
                    className="px-4 py-2 border border-border rounded-xl text-xs font-semibold text-danger hover:bg-danger/10 border-danger/30 transition-colors cursor-pointer bg-background"
                    title="Reset Filter Tanggal"
                  >
                    Reset Filter
                  </button>
                )}
              </div>
            </div>

            {/* ── STAT CARDS ── */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              {statCards.map((card, i) => (
                <StatCard key={i} {...card} />
              ))}
            </div>

            {/* ── CHARTS (Melempar data ke props) ── */}
            <div className="grid grid-cols-1 gap-4">
              <div className="xl:col-span-2">
                <RevenueChart data={revenueData} title={getRevenueChartTitle()} />
              </div>
              <div>
                <CategoryChart data={categoryData} />
              </div>
            </div>


            <NotificationPopup
              open={showNotification}
              onClose={() => setShowNotification(false)}
              notifications={notifikasiTerbaru}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default DashboardOwner;
