import React, { useState, useEffect } from "react";
import axios from "axios";
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
  const [ringkasanCabang, setRingkasanCabang] = useState([]);
  const [notifikasiTerbaru, setNotifikasiTerbaru] = useState([]);
  const [showNotification, setShowNotification] = useState(false);

  // State baru untuk Chart
  const [revenueData, setRevenueData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const userInfo = JSON.parse(localStorage.getItem("userInfo"));
        const config = {
          headers: { Authorization: `Bearer ${userInfo?.token}` },
        };

        const { data } = await axios.get(
          "http://localhost:5000/api/dashboard/owner",
          config,
        );

        setStats(data.stats);
        setRingkasanCabang(data.cabang);
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

    fetchDashboardData();
  }, []);

  const statCards = [
    {
      label: "Total Penjualan Hari Ini",
      value: formatRupiah(stats.penjualanHariIni),
      sub: `${stats.persentasePenjualan} dari kemarin`,
      icon: FiTrendingUp,
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
      naik: !stats.persentasePenjualan.includes("-"),
    },
    {
      label: "Total Transaksi",
      value: `${stats.totalTransaksi} Transaksi`,
      sub: `${stats.persentaseTransaksi} dari kemarin`,
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
            {/* ── STAT CARDS ── */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              {statCards.map((card, i) => (
                <StatCard key={i} {...card} />
              ))}
            </div>

            {/* ── CHARTS (Melempar data ke props) ── */}
            <div className="grid grid-cols-1 gap-4">
              <div className="xl:col-span-2">
                <RevenueChart data={revenueData} />
              </div>
              <div>
                <CategoryChart data={categoryData} />
              </div>
            </div>

            {/* ── BOTTOM ROW ── */}
            <div className="grid grid-cols-1 gap-4">
              {/* Ringkasan Per Cabang */}
              <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                <div className="mb-4">
                  <h2 className="font-semibold text-text text-sm">
                    Ringkasan Per Cabang
                  </h2>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Data transaksi hari ini
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {ringkasanCabang.length === 0 ? (
                    <p className="text-sm text-gray-500 col-span-2 text-center py-4">
                      Belum ada transaksi hari ini
                    </p>
                  ) : (
                    ringkasanCabang.map((c, i) => (
                      <div
                        key={i}
                        className={`rounded-xl p-4 border ${c.selisih ? "border-danger/30 bg-danger/5" : "border-border bg-background"}`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <p className="font-semibold text-sm text-text">
                            {c.nama}
                          </p>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.selisih ? "bg-danger/10 text-danger" : "bg-success/10 text-success"}`}
                          >
                            {c.selisih ? "Ada Selisih" : "Aman"}
                          </span>
                        </div>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between text-text-secondary">
                            <span>Total Penjualan</span>
                            <span className="font-semibold text-text">
                              {formatRupiah(c.penjualan)}
                            </span>
                          </div>
                          <div className="flex justify-between text-text-secondary">
                            <span>Total Transaksi</span>
                            <span className="font-semibold text-text">
                              {c.transaksi} transaksi
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
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
