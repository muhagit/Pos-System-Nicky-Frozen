import React, { useState, useEffect } from "react";
import axios from "axios";
import RevenueChart from "../../components/owner/RevenueChart";

const formatRupiah = (angka) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(angka);
};

const formatRelativeTime = (dateString) => {
  if (!dateString) return "Belum sinkron";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);

  if (diffSec < 60) return "Baru saja";
  if (diffMin < 60) return `${diffMin} menit yang lalu`;
  if (diffHour < 24) return `${diffHour} jam yang lalu`;
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const Branches = () => {
  const [ringkasanCabang, setRingkasanCabang] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBranchesData = async () => {
      try {
        const userInfo = JSON.parse(localStorage.getItem("userInfo"));
        const config = {
          headers: { Authorization: `Bearer ${userInfo?.token}` },
        };

        const { data } = await axios.get(
          "http://localhost:5000/api/dashboard/owner",
          config,
        );

        setRingkasanCabang(data.cabang || []);
        setRevenueData(data.revenueData || []);
        setIsLoading(false);
      } catch (error) {
        console.error("Gagal mengambil data cabang:", error);
        setIsLoading(false);
      }
    };

    fetchBranchesData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen bg-background overflow-y-auto font-poppins">
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text">Branch Monitoring</h1>
        <p className="text-text-secondary mt-1">
          Monitor synchronization and sales performance across branches
        </p>
      </div>

      {/* SYNC STATUS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {ringkasanCabang.map((c, idx) => (
          <div key={idx} className="bg-card border border-border rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-text">{c.nama}</h2>
                <p className="text-text-secondary text-sm mt-1">
                  Last Sync: {formatRelativeTime(c.lastSync)}
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  c.isOnline ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
                }`}
              >
                {c.isOnline ? "Online" : "Offline"}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* BRANCH SUMMARY */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-8">
        {ringkasanCabang.map((c, idx) => (
          <div key={idx} className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-text">{c.nama}</h2>
                <p className="text-text-secondary text-sm mt-1">
                  Daily sales overview
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  c.selisih ? "bg-danger/10 text-danger" : "bg-success/10 text-success"
                }`}
              >
                {c.selisih ? "Warning" : "Safe"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-5 mt-6">
              <div>
                <p className="text-text-secondary text-sm">Revenue</p>
                <h3 className="text-2xl font-bold text-text mt-1">
                  {formatRupiah(c.penjualan)}
                </h3>
              </div>

              <div>
                <p className="text-text-secondary text-sm">Transactions</p>
                <h3 className="text-2xl font-bold text-text mt-1">
                  {c.transaksi}
                </h3>
              </div>

              <div>
                <p className="text-text-secondary text-sm">Cash Total</p>
                <h3 className="text-xl font-semibold text-text mt-1">
                  {formatRupiah(c.kas)}
                </h3>
              </div>

              <div>
                <p className="text-text-secondary text-sm">Cash Difference</p>
                <h3
                  className={`font-semibold mt-1 ${
                    c.selisih ? "text-danger" : "text-success"
                  }`}
                >
                  {c.selisih ? formatRupiah(c.nominalSelisih) : "No Difference"}
                </h3>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* SALES COMPARISON */}
      <div className="mt-8">
        <RevenueChart data={revenueData} />
      </div>
    </div>
  );
};

export default Branches;