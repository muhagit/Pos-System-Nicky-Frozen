import { useEffect, useState } from "react";
import api from "../../utils/api";
import {
  FiCalendar,
  FiDollarSign,
  FiCreditCard,
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
} from "react-icons/fi";

const ClosingBook = () => {
  const [data, setData] = useState({
  totalTransaksi: 0,
  totalPendapatan: 0,

  cash: {
    transaksi: 0,
    nominal: 0,
  },

  qris: {
    transaksi: 0,
    nominal: 0,
  },

  gopay: {
    transaksi: 0,
    nominal: 0,
  },

  selisihKas: {
    status: false,
    detail: "Belum dilakukan tutup buku",
  },
});

const [now, setNow] = useState(new Date());
const [isClosed, setIsClosed] = useState(false);
const fetchReport = async () => {
  try {
    const res = await api.get("/transactions/report");

    const report = res.data;

    // Check if daily report already exists for today in this branch
    const reportsRes = await api.get("/reports");
    const userInfo = JSON.parse(localStorage.getItem("userInfo"));
    const userBranch = userInfo?.cabang || "Pusat";
    const todayStr = new Date().toISOString().slice(0, 10);
    const hasClosedToday = reportsRes.data?.some(
      (rep) => rep.cabang === userBranch && new Date(rep.tanggal_laporan).toISOString().slice(0, 10) === todayStr
    );

    setData({
      totalTransaksi: report.totalTransactions || 0,
      totalPendapatan: report.totalRevenue || 0,

      cash: {
        transaksi: report.paymentMethods?.Cash || 0,
        nominal: 0,
      },

      qris: {
        transaksi: report.paymentMethods?.QRIS || 0,
        nominal: 0,
      },

      gopay: {
        transaksi: report.paymentMethods?.Transfer || 0,
        nominal: 0,
      },

      selisihKas: {
        status: false,
        detail: "Belum dilakukan tutup buku",
      },
    });

    setIsClosed(hasClosedToday);
  } catch (err) {
    console.log(err);
  }
};
 
useEffect(() => {
  fetchReport();
}, []);


  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hour = now.getHours();
  // Bypass auto close for testing
  const autoTrigger = false; // hour >= 21;

  useEffect(() => {
    if (autoTrigger && !isClosed) {
      setIsClosed(true);
    }
  }, [autoTrigger]);

  // ======================
  // CARD COMPONENT STYLE
  // ======================
  const Card = ({ icon, title, value, subtitle, color }) => {
    const colorMap = {
      primary: "bg-primary/10 text-primary",
      success: "bg-success/10 text-success",
      warning: "bg-warning/10 text-warning",
      danger: "bg-danger/10 text-danger",
    };

    return (
      <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
        {/* ICON BESAR */}
        <div
          className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl ${colorMap[color]}`}
        >
          {icon}
        </div>

        {/* TEXT */}
        <div>
          <p className="text-text-secondary text-sm">{title}</p>
          <h2 className="text-2xl font-bold text-text">{value}</h2>
          {subtitle && (
            <p className="text-xs text-text-secondary mt-1">{subtitle}</p>
          )}
        </div>
      </div>
    );
  };
const handleClosingBook = async () => {
  try {
    const userInfo = JSON.parse(localStorage.getItem("userInfo"));

    await api.post("/reports/tutup-buku", {
      diperiksa_oleh: userInfo._id,
      cabang: userInfo.cabang,
      total_kas_fisik: data.totalPendapatan,
      tanggal_laporan: new Date(),
    });

    await fetchReport();
    alert("Tutup buku berhasil");
  } catch (err) {
    console.log(err);
    alert("Gagal tutup buku");
  }
};

  return (
    <div className="p-6 space-y-6">
      {/* ======================
          HEADER
      ====================== */}
      <div className="bg-card border border-border rounded-2xl p-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text flex items-center gap-2">
            <FiCalendar className="text-primary" />
            Closing Book Harian
          </h1>

          <p className="text-text-secondary mt-1 flex items-center gap-2">
            <FiClock className="text-warning" />
            {now.toLocaleDateString()} - {now.toLocaleTimeString()}
          </p>
        </div>

        <div
          className={`px-4 py-2 rounded-xl font-semibold ${
            autoTrigger
              ? "bg-primary/10 text-primary"
              : "bg-warning/10 text-warning"
          }`}
        >
          {autoTrigger ? "AUTO MODE ACTIVE" : "MANUAL MODE"}
        </div>
      </div>

      {/* ======================
          MAIN STATS
      ====================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card
          icon={<FiDollarSign />}
          title="Total Transaksi"
          value={data.totalTransaksi}
          color="primary"
        />

        <Card
          icon={<FiDollarSign />}
          title="Total Pendapatan"
          value={`Rp ${data.totalPendapatan.toLocaleString()}`}
          color="success"
        />

        <Card
          icon={<FiCreditCard />}
          title="Payment Method"
          value="Cash • QRIS • GoPay"
          color="warning"
        />
      </div>

      {/* ======================
          PAYMENT DETAIL
      ====================== */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <h3 className="font-semibold text-text flex items-center gap-2">
          <FiCreditCard className="text-primary" />
          Detail Transaksi Per Metode
        </h3>

        <div className="flex justify-between text-text-secondary">
          <span>Cash ({data.cash.transaksi} transaksi)</span>
          <span className="text-text font-medium">
            Rp {data.cash.nominal.toLocaleString()}
          </span>
        </div>

        <div className="flex justify-between text-text-secondary">
          <span>QRIS ({data.qris.transaksi} transaksi)</span>
          <span className="text-text font-medium">
            Rp {data.qris.nominal.toLocaleString()}
          </span>
        </div>

        <div className="flex justify-between text-text-secondary">
          <span>GoPay ({data.gopay.transaksi} transaksi)</span>
          <span className="text-text font-medium">
            Rp {data.gopay.nominal.toLocaleString()}
          </span>
        </div>
      </div>

      {/* ======================
          SELISIH KAS
      ====================== */}
      <div
        className={`bg-card border rounded-2xl p-5 flex items-center gap-4 ${
          data.selisihKas.status ? "border-danger" : "border-success"
        }`}
      >
        <div
          className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl ${
            data.selisihKas.status
              ? "bg-danger/10 text-danger"
              : "bg-success/10 text-success"
          }`}
        >
          {data.selisihKas.status ? <FiAlertTriangle /> : <FiCheckCircle />}
        </div>

        <div>
          <p className="text-text font-semibold">
            {data.selisihKas.status ? "Selisih Kas Terdeteksi" : "Kas Seimbang"}
          </p>

          <p className="text-text-secondary text-sm mt-1">
            {data.selisihKas.detail}
          </p>
        </div>
      </div>

      {/* ======================
          ACTION
      ====================== */}
      <div className="bg-card border border-border rounded-2xl p-6 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-text">Kontrol Tutup Buku</h3>

          <p className="text-sm text-text-secondary">
            Auto jam 21.00 + manual tersedia
          </p>
        </div>

        <button
  onClick={handleClosingBook}
  disabled={isClosed}
          className={`px-5 py-3 rounded-xl font-semibold transition-all ${
            isClosed
              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
              : "bg-primary text-sidebar hover:bg-primary-dark"
          }`}
        >
          {isClosed ? "Sudah Ditutup" : "Tutup Buku"}
        </button>
      </div>
    </div>
  );
};

export default ClosingBook;
