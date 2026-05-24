import {
  FiTrendingUp,
  FiShoppingCart,
  FiAlertCircle,
  FiPackage,
  FiClock,
} from "react-icons/fi";

import StatCard from "../../components/owner/StatCard";
import RevenueChart from "../../components/owner/RevenueChart";
import CategoryChart from "../../components/owner/CategoryChart";


const statCards = [
  {
    label: "Total Penjualan Hari Ini",
    value: "Rp 9.200.000",
    sub: "12% dari kemarin",
    icon: FiTrendingUp,
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
    naik: true,
  },
  {
    label: "Total Transaksi",
    value: "84 Transaksi",
    sub: "5% dari kemarin",
    icon: FiShoppingCart,
    iconBg: "bg-success/10",
    iconColor: "text-success",
    naik: true,
  },
  {
    label: "Selisih Kas",
    value: "Rp 12.000",
    sub: "Terdeteksi di Cabang B",
    icon: FiAlertCircle,
    iconBg: "bg-danger/10",
    iconColor: "text-danger",
    naik: false,
  },
  {
    label: "Produk Hampir Habis",
    value: "3 Produk",
    sub: "Perlu restock segera",
    icon: FiPackage,
    iconBg: "bg-warning/10",
    iconColor: "text-warning",
    naik: false,
  },
];

const ringkasanCabang = [
  {
    nama: "Cabang A",
    penjualan: "Rp 5.100.000",
    transaksi: 47,
    kas: "Rp 5.100.000",
    selisih: false,
    nominalSelisih: null,
  },
  {
    nama: "Cabang B",
    penjualan: "Rp 4.100.000",
    transaksi: 37,
    kas: "Rp 4.088.000",
    selisih: true,
    nominalSelisih: "Rp 12.000",
  },
];

const notifikasiTerbaru = [
  {
    id: 1,
    tipe: "expired",
    pesan: "Ayam Crispy mendekati expired (H-2)",
    cabang: "Cabang A",
    waktu: "10 menit lalu",
  },
  {
    id: 2,
    tipe: "selisih",
    pesan: "Selisih kas terdeteksi Rp12.000",
    cabang: "Cabang B",
    waktu: "1 jam lalu",
  },
  {
    id: 3,
    tipe: "stok",
    pesan: "Stok Nugget hampir habis (sisa 5)",
    cabang: "Cabang A",
    waktu: "2 jam lalu",
  },
];

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

// ── MAIN COMPONENT ────────────────────────────────────────
const DashboardOwner = () => {
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
          <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-2 shadow-sm">
            <FiClock size={14} className="text-primary" />
            <span className="text-sm font-medium text-text">{jam} WIB</span>
          </div>
        </div>

        {/* ── STAT CARDS ── */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {statCards.map((card, i) => (
            <StatCard key={i} {...card} />
          ))}
        </div>

        {/* ── CHARTS ── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2">
            <RevenueChart />
          </div>
          <div>
            <CategoryChart />
          </div>
        </div>

        {/* ── BOTTOM ROW ── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {/* Ringkasan Per Cabang */}
          <div className="xl:col-span-2 bg-card border border-border rounded-2xl p-5 shadow-sm">
            <div className="mb-4">
              <h2 className="font-semibold text-text text-sm">
                Ringkasan Per Cabang
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">
                Data transaksi hari ini
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {ringkasanCabang.map((c, i) => (
                <div
                  key={i}
                  className={`rounded-xl p-4 border ${
                    c.selisih
                      ? "border-danger/30 bg-danger/5"
                      : "border-border bg-background"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-semibold text-sm text-text">{c.nama}</p>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        c.selisih
                          ? "bg-danger/10 text-danger"
                          : "bg-success/10 text-success"
                      }`}
                    >
                      {c.selisih ? "Ada Selisih" : "Aman"}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-text-secondary">
                      <span>Total Penjualan</span>
                      <span className="font-semibold text-text">
                        {c.penjualan}
                      </span>
                    </div>
                    <div className="flex justify-between text-text-secondary">
                      <span>Total Transaksi</span>
                      <span className="font-semibold text-text">
                        {c.transaksi} transaksi
                      </span>
                    </div>
                    <div className="flex justify-between text-text-secondary">
                      <span>Total Kas</span>
                      <span
                        className={`font-semibold ${c.selisih ? "text-danger" : "text-text"}`}
                      >
                        {c.kas}
                      </span>
                    </div>
                    {c.selisih && (
                      <div className="flex justify-between border-t border-danger/20 pt-2 mt-1">
                        <span className="text-danger font-medium">Selisih</span>
                        <span className="font-semibold text-danger">
                          {c.nominalSelisih}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notifikasi Terbaru */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold text-text text-sm">
                  Notifikasi Terbaru
                </h2>
                <p className="text-xs text-text-secondary mt-0.5">
                  Belum dibaca
                </p>
              </div>
              <span className="text-[10px] bg-danger text-white font-bold px-2 py-0.5 rounded-full">
                {notifikasiTerbaru.length}
              </span>
            </div>

            <div className="space-y-3">
              {notifikasiTerbaru.map((n) => {
                const s = notifStyle[n.tipe];
                return (
                  <div
                    key={n.id}
                    className={`flex items-start gap-3 p-3 rounded-xl border ${s.bg} ${s.border}`}
                  >
                    <div
                      className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${s.dot}`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className={`text-[10px] font-bold ${s.text}`}>
                          {s.label}
                        </span>
                        <span className="text-[10px] text-text-secondary">
                          · {n.cabang}
                        </span>
                      </div>
                      <p className="text-xs text-text font-medium leading-snug">
                        {n.pesan}
                      </p>
                      <p className="text-[10px] text-text-secondary mt-1">
                        {n.waktu}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOwner;