import { useState, useEffect } from "react";
import api from "../../utils/api";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import Swal from "sweetalert2";
import { FiChevronLeft, FiChevronRight, FiX, FiClock, FiDollarSign } from "react-icons/fi";

const Reports = () => {
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    totalTransactions: 0,
    cashIncome: 0,
    qrisIncome: 0,
  });

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [branchBreakdown, setBranchBreakdown] = useState({});

  // State untuk Paginasi Laporan
  const [currentPage, setCurrentPage] = useState(1);
  const reportsPerPage = 5;

  // State untuk Detail Modal
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [detailData, setDetailData] = useState(null);

  const userInfo = JSON.parse(localStorage.getItem("userInfo"));
  const userBranch = userInfo?.cabang || "Pusat";
  const todayStr = new Date().toISOString().slice(0, 10);
  const hasClosedToday = reports.some(
    (rep) => rep.cabang === userBranch && new Date(rep.tanggal_laporan).toISOString().slice(0, 10) === todayStr
  );

  // ======================
  // FORMAT RUPIAH
  // ======================
  const formatRupiah = (angka) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(angka || 0);
  };

  // ======================
  // SWEET ALERT HELPER
  // ======================
  const alertSuccess = (msg) => {
    Swal.fire({
      icon: "success",
      title: "Berhasil",
      text: msg,
      timer: 1500,
      showConfirmButton: false,
    });
  };

  const alertError = (msg) => {
    Swal.fire({
      icon: "error",
      title: "Oops...",
      text: msg,
    });
  };

  // ======================
  // FETCH DATA
  // ======================
  const fetchData = async (branch = selectedBranch) => {
    try {
      setLoading(true);

      const params = {};
      if (branch) {
        params.cabang = branch;
      }

      const res = await api.get("/transactions/report", { params });
      const reportRes = await api.get("/reports", { params });

      const data = res.data || {};

      setSummary({
        totalRevenue: data.totalRevenue || 0,
        totalTransactions: data.totalTransactions || 0,
        cashIncome: data.paymentMethods?.Cash || 0,
        qrisIncome: data.paymentMethods?.QRIS || 0,
      });

      setReports(reportRes.data || []);
      setBranchBreakdown(data.branchBreakdown || {});
    } catch (err) {
      alertError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(selectedBranch);
  }, [selectedBranch]);

  const handleBranchChange = (branch) => {
    setSelectedBranch(branch);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [reports, selectedBranch]);

  // ================= LOGIKA PAGINATION =================
  const indexOfLastReport = currentPage * reportsPerPage;
  const indexOfFirstReport = indexOfLastReport - reportsPerPage;
  const currentReports = reports.slice(
    indexOfFirstReport,
    indexOfLastReport
  );
  const totalPages = Math.ceil(reports.length / reportsPerPage);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // ================= FETCH REPORT DETAIL =================
  const handleViewDetail = async (report) => {
    try {
      setModalLoading(true);
      setShowDetailModal(true);
      setDetailData(null);

      const tanggalObj = new Date(report.tanggal_laporan);
      const tanggalStr = tanggalObj.toISOString().slice(0, 10); // YYYY-MM-DD

      const res = await api.get(`/reports/detail/${tanggalStr}`, {
        params: { cabang: report.cabang }
      });

      setDetailData({
        ...res.data,
        reportInfo: report
      });
    } catch (err) {
      alertError(err.response?.data?.message || err.message);
      setShowDetailModal(false);
    } finally {
      setModalLoading(false);
    }
  };

  // ======================
  // CLOSE BOOK
  // ======================
  const closeBook = async () => {
    if (hasClosedToday) {
      alertError("Tutup buku harian untuk hari ini sudah dilakukan.");
      return;
    }
    try {
      const userInfo = JSON.parse(localStorage.getItem("userInfo"));

      if (!userInfo?._id) {
        alertError("User belum login");
        return;
      }

      await api.post("/reports/tutup-buku", {
        diperiksa_oleh: userInfo._id,
        cabang: "Pusat",
        total_kas_fisik: summary.totalRevenue,
        tanggal_laporan: new Date(),
      });

      alertSuccess("Tutup buku berhasil!");
      fetchData();
    } catch (err) {
      alertError(err.response?.data?.message || err.message);
    }
  };

  // ======================
  // EXPORT PDF
  // ======================
  const exportPDF = async () => {
    const input = document.getElementById("report-table");
    if (!input) return;

    const canvas = await html2canvas(input);
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");

    const imgWidth = 190;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);
    pdf.save("financial-report.pdf");

    alertSuccess("Export PDF berhasil");
  };

  // ======================
  // EXPORT EXCEL
  // ======================
  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      reports.map((r) => ({
        Tanggal: new Date(r.tanggal_laporan).toLocaleDateString("id-ID"),
        Cabang: r.cabang,
        "Modal Awal": r.modal_awal,
        "Pendapatan Tunai": r.total_pendapatan_cash,
        "Pendapatan Digital": r.total_pendapatan_digital,
        "Total Pendapatan (Sistem)": r.total_pendapatan_sistem,
        "Kas Fisik Laci": r.total_kas_fisik,
        "Selisih Kas": r.selisih,
        Status: r.status_tutup_buku,
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Reports");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const data = new Blob([excelBuffer], {
      type: "application/octet-stream",
    });

    saveAs(data, "financial-report.xlsx");

    alertSuccess("Export Excel berhasil");
  };

  return (
    <div className="p-6 min-h-screen bg-background overflow-y-auto">

      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-text">
            Financial Reports
          </h1>
          <p className="text-text-secondary mt-1">
            Daily financial summary and transaction reports
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={exportPDF}
            className="bg-primary px-4 py-2 rounded-xl text-sidebar font-semibold"
          >
            Export PDF
          </button>

          <button
            onClick={exportExcel}
            className="bg-success px-4 py-2 rounded-xl text-white font-semibold"
          >
            Export Excel
          </button>
        </div>
      </div>

      {/* FILTER CABANG */}
      <div className="flex items-center gap-2 mb-6 bg-card border border-border p-1.5 rounded-2xl shadow-sm w-fit">
        <button
          onClick={() => handleBranchChange("")}
          className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
            selectedBranch === ""
              ? "bg-primary text-sidebar shadow-sm"
              : "text-text-secondary hover:text-text hover:bg-background"
          }`}
        >
          Semua Cabang
        </button>
        <button
          onClick={() => handleBranchChange("Cabang Solo")}
          className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
            selectedBranch === "Cabang Solo"
              ? "bg-primary text-sidebar shadow-sm"
              : "text-text-secondary hover:text-text hover:bg-background"
          }`}
        >
          Cabang Solo
        </button>
        <button
          onClick={() => handleBranchChange("Cabang Jogja")}
          className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
            selectedBranch === "Cabang Jogja"
              ? "bg-primary text-sidebar shadow-sm"
              : "text-text-secondary hover:text-text hover:bg-background"
          }`}
        >
          Cabang Jogja
        </button>
      </div>

      {/* SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

        <div className="bg-card p-5 rounded-2xl border border-border">
          <p className="text-text-secondary text-sm">Total Revenue</p>
          <h2 className="text-xl font-bold text-text mt-2">
            {formatRupiah(summary.totalRevenue)}
          </h2>
        </div>

        <div className="bg-card p-5 rounded-2xl border border-border">
          <p className="text-text-secondary text-sm">Transactions</p>
          <h2 className="text-xl font-bold text-text mt-2">
            {summary.totalTransactions}
          </h2>
        </div>

        <div className="bg-card p-5 rounded-2xl border border-border">
          <p className="text-text-secondary text-sm">Cash Income</p>
          <h2 className="text-xl font-bold text-text mt-2">
            {formatRupiah(summary.cashIncome)}
          </h2>
        </div>

        <div className="bg-card p-5 rounded-2xl border border-border">
          <p className="text-text-secondary text-sm">QRIS Income</p>
          <h2 className="text-xl font-bold text-text mt-2">
            {formatRupiah(summary.qrisIncome)}
          </h2>
        </div>

      </div>

      {/* DETAIL PER CABANG */}
      <div className="bg-card p-6 rounded-2xl border border-border mt-8">
        <h3 className="font-semibold text-text text-sm mb-4">
          Ringkasan Transaksi Per Cabang
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Cabang Solo */}
          <div className="bg-background p-4 rounded-xl border border-border space-y-2">
            <h4 className="font-bold text-text text-sm">Cabang Solo</h4>
            <div className="flex justify-between text-xs text-text-secondary">
              <span>Total Pendapatan:</span>
              <span className="font-semibold text-text">
                {formatRupiah(branchBreakdown["Cabang Solo"]?.revenue || 0)}
              </span>
            </div>
            <div className="flex justify-between text-xs text-text-secondary">
              <span>Total Transaksi:</span>
              <span className="font-semibold text-text">
                {branchBreakdown["Cabang Solo"]?.transactions || 0} transaksi
              </span>
            </div>
            <div className="flex justify-between text-xs text-text-secondary">
              <span>Digital:</span>
              <span className="font-semibold text-text">
                {formatRupiah(
                  (branchBreakdown["Cabang Solo"]?.qris || 0) +
                    (branchBreakdown["Cabang Solo"]?.transfer || 0) +
                    (branchBreakdown["Cabang Solo"]?.card || 0)
                )}
              </span>
            </div>
            <div className="flex justify-between text-xs text-text-secondary">
              <span>Tunai (Cash):</span>
              <span className="font-semibold text-text">
                {formatRupiah(branchBreakdown["Cabang Solo"]?.cash || 0)}
              </span>
            </div>
          </div>

          {/* Cabang Jogja */}
          <div className="bg-background p-4 rounded-xl border border-border space-y-2">
            <h4 className="font-bold text-text text-sm">Cabang Jogja</h4>
            <div className="flex justify-between text-xs text-text-secondary">
              <span>Total Pendapatan:</span>
              <span className="font-semibold text-text">
                {formatRupiah(branchBreakdown["Cabang Jogja"]?.revenue || 0)}
              </span>
            </div>
            <div className="flex justify-between text-xs text-text-secondary">
              <span>Total Transaksi:</span>
              <span className="font-semibold text-text">
                {branchBreakdown["Cabang Jogja"]?.transactions || 0} transaksi
              </span>
            </div>
            <div className="flex justify-between text-xs text-text-secondary">
              <span>Digital:</span>
              <span className="font-semibold text-text">
                {formatRupiah(
                  (branchBreakdown["Cabang Jogja"]?.qris || 0) +
                    (branchBreakdown["Cabang Jogja"]?.transfer || 0) +
                    (branchBreakdown["Cabang Jogja"]?.card || 0)
                )}
              </span>
            </div>
            <div className="flex justify-between text-xs text-text-secondary">
              <span>Tunai (Cash):</span>
              <span className="font-semibold text-text">
                {formatRupiah(branchBreakdown["Cabang Jogja"]?.cash || 0)}
              </span>
            </div>
          </div>

          {/* Total Gabungan */}
          <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 space-y-2">
            <h4 className="font-bold text-primary text-sm">Total Gabungan Kedua Cabang</h4>
            <div className="flex justify-between text-xs text-primary/80">
              <span>Total Pendapatan:</span>
              <span className="font-semibold text-text">
                {formatRupiah(
                  (branchBreakdown["Cabang Solo"]?.revenue || 0) +
                  (branchBreakdown["Cabang Jogja"]?.revenue || 0)
                )}
              </span>
            </div>
            <div className="flex justify-between text-xs text-primary/80">
              <span>Total Transaksi:</span>
              <span className="font-semibold text-text">
                {(branchBreakdown["Cabang Solo"]?.transactions || 0) +
                 (branchBreakdown["Cabang Jogja"]?.transactions || 0)} transaksi
              </span>
            </div>
            <div className="flex justify-between text-xs text-primary/80">
              <span>Digital:</span>
              <span className="font-semibold text-text">
                {formatRupiah(
                  (branchBreakdown["Cabang Solo"]?.qris || 0) +
                  (branchBreakdown["Cabang Solo"]?.transfer || 0) +
                  (branchBreakdown["Cabang Solo"]?.card || 0) +
                  (branchBreakdown["Cabang Jogja"]?.qris || 0) +
                  (branchBreakdown["Cabang Jogja"]?.transfer || 0) +
                  (branchBreakdown["Cabang Jogja"]?.card || 0)
                )}
              </span>
            </div>
            <div className="flex justify-between text-xs text-primary/80">
              <span>Tunai (Cash):</span>
              <span className="font-semibold text-text">
                {formatRupiah(
                  (branchBreakdown["Cabang Solo"]?.cash || 0) +
                  (branchBreakdown["Cabang Jogja"]?.cash || 0)
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div
        id="report-table"
        className="bg-card mt-8 p-6 rounded-2xl border border-border"
      >

        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-text">
              Daily Transactions
            </h2>
            <p className="text-text-secondary text-sm">
              Financial transaction records
            </p>
          </div>

          <button
            onClick={closeBook}
            disabled={hasClosedToday}
            className={`px-4 py-2 rounded-xl font-semibold transition-all ${
              hasClosedToday
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-primary text-sidebar hover:bg-primary-dark"
            }`}
          >
            {hasClosedToday ? "Book Already Closed" : "Close Daily Book"}
          </button>
        </div>

        <div className="overflow-x-auto">

          {loading ? (
            <div className="text-center py-10 text-text-secondary">
              Loading...
            </div>
          ) : (
            <table className="w-full">

              <thead>
                <tr className="border-b border-border text-text-secondary text-sm">
                  <th className="text-left py-3">Tanggal</th>
                  <th className="text-left">Cabang</th>
                  <th className="text-left">Modal Awal</th>
                  <th className="text-left">Pendapatan Tunai</th>
                  <th className="text-left">Pendapatan Digital</th>
                  <th className="text-left">Total Pendapatan (Sistem)</th>
                  <th className="text-left">Kas Fisik Laci</th>
                  <th className="text-left">Selisih Kas</th>
                  <th className="text-left">Status</th>
                </tr>
              </thead>

              <tbody>
                {currentReports.map((report) => (
                  <tr
                    key={report._id}
                    onClick={() => handleViewDetail(report)}
                    className="border-b border-border hover:bg-background transition cursor-pointer"
                    title="Klik untuk melihat rincian transaksi"
                  >
                    <td className="py-3 text-text">
                      {new Date(report.tanggal_laporan).toLocaleDateString("id-ID")}
                    </td>

                    <td className="text-text-secondary font-medium">
                      {report.cabang}
                    </td>

                    <td className="text-text">
                      {formatRupiah(report.modal_awal)}
                    </td>

                    <td className="text-text">
                      {formatRupiah(report.total_pendapatan_cash)}
                    </td>

                    <td className="text-text">
                      {formatRupiah(report.total_pendapatan_digital)}
                    </td>

                    <td className="text-text font-semibold">
                      {formatRupiah(report.total_pendapatan_sistem)}
                    </td>

                    <td className="text-text">
                      {formatRupiah(report.total_kas_fisik)}
                    </td>

                    <td className={`font-semibold ${report.selisih < 0 ? "text-danger" : report.selisih > 0 ? "text-warning" : "text-success"}`}>
                      {report.selisih === 0 ? "Aman" : formatRupiah(report.selisih)}
                    </td>

                    <td className="text-success">
                      {report.status_tutup_buku}
                    </td>
                  </tr>
                ))}
              </tbody>

            </table>
          )}

        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="p-3 border-t border-border mt-4 flex items-center justify-end gap-2 bg-transparent">
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-border text-text-secondary disabled:opacity-40 disabled:cursor-not-allowed hover:bg-background transition flex items-center justify-center bg-transparent cursor-pointer"
            >
              <FiChevronLeft size={18} />
            </button>
            <div className="text-sm text-text-secondary mx-2">
              Page{" "}
              <span className="font-semibold text-text">
                {totalPages === 0 ? 0 : currentPage}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-text">
                {totalPages}
              </span>
            </div>
            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={
                currentPage === totalPages || totalPages === 0
              }
              className="p-2 rounded-lg border border-border text-text-secondary disabled:opacity-40 disabled:cursor-not-allowed hover:bg-background transition flex items-center justify-center bg-transparent cursor-pointer"
            >
              <FiChevronRight size={18} />
            </button>
          </div>
        )}

      </div>

      {/* MODAL DETAIL LAPORAN */}
      {showDetailModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-card border border-border rounded-3xl shadow-xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-fade-in text-left">
            {/* Header */}
            <div className="px-6 py-5 border-b border-border flex justify-between items-center bg-background/50">
              <div>
                <h3 className="font-bold text-xl text-text">
                  Detail Laporan Harian
                </h3>
                <p className="text-sm text-text-secondary mt-0.5">
                  {detailData?.reportInfo?.cabang} • {detailData?.reportInfo?.tanggal_laporan ? new Date(detailData.reportInfo.tanggal_laporan).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : ""}
                </p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-text-secondary hover:text-danger transition cursor-pointer bg-transparent border-none p-1 rounded-lg hover:bg-background"
              >
                <FiX size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {modalLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  <p className="text-text-secondary mt-4 text-sm">Mengambil detail laporan...</p>
                </div>
              ) : !detailData ? (
                <p className="text-center py-10 text-text-secondary">Gagal memuat data detail.</p>
              ) : (
                <>
                  {/* Info Ringkasan Tutup Buku */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-background p-4 rounded-2xl border border-border">
                      <p className="text-text-secondary text-xs">Total Pendapatan Sistem</p>
                      <h4 className="text-base font-bold text-text mt-1">
                        {formatRupiah(detailData.report?.total_pendapatan_sistem || detailData.reportInfo?.total_pendapatan_sistem)}
                      </h4>
                    </div>
                    <div className="bg-background p-4 rounded-2xl border border-border">
                      <p className="text-text-secondary text-xs">Kas Fisik Terkumpul</p>
                      <h4 className="text-base font-bold text-text mt-1">
                        {formatRupiah(detailData.report?.total_kas_fisik || detailData.reportInfo?.total_kas_fisik)}
                      </h4>
                    </div>
                    <div className="bg-background p-4 rounded-2xl border border-border">
                      <p className="text-text-secondary text-xs">Selisih Kas</p>
                      <h4 className={`text-base font-bold mt-1 ${
                        (detailData.report?.selisih || detailData.reportInfo?.selisih) < 0 
                          ? "text-danger" 
                          : (detailData.report?.selisih || detailData.reportInfo?.selisih) > 0 
                          ? "text-warning" 
                          : "text-success"
                      }`}>
                        {formatRupiah(detailData.report?.selisih || detailData.reportInfo?.selisih || 0)}
                      </h4>
                    </div>
                    <div className="bg-background p-4 rounded-2xl border border-border">
                      <p className="text-text-secondary text-xs">Modal Awal</p>
                      <h4 className="text-base font-bold text-text mt-1">
                        {formatRupiah(detailData.report?.modal_awal || detailData.reportInfo?.modal_awal || 0)}
                      </h4>
                    </div>
                  </div>

                  {/* Riwayat Shift Harian */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-text text-sm flex items-center gap-2">
                      <FiClock className="text-primary" />
                      Laporan Per Shift Harian
                    </h4>
                    {!detailData.shifts || detailData.shifts.length === 0 ? (
                      <p className="text-xs text-text-secondary bg-background p-4 rounded-xl border border-border text-center">
                        Tidak ada catatan shift aktif untuk tanggal ini.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {detailData.shifts.map((shift) => (
                          <div key={shift._id} className="bg-background p-4 rounded-2xl border border-border space-y-3">
                            <div className="flex justify-between items-center border-b border-border pb-2">
                              <span className="font-bold text-sm text-text">{shift.shift}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${shift.status === "Selesai" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
                                {shift.status}
                              </span>
                            </div>
                            <div className="space-y-1.5 text-xs">
                              <div className="flex justify-between text-text-secondary">
                                <span>Kasir Penanggung Jawab:</span>
                                <span className="font-medium text-text">{shift.user_id?.nama_lengkap || "Unknown"}</span>
                              </div>
                              <div className="flex justify-between text-text-secondary">
                                <span>Modal Awal:</span>
                                <span className="font-medium text-text">{formatRupiah(shift.modal_awal)}</span>
                              </div>
                              <div className="flex justify-between text-text-secondary">
                                <span>Total Pendapatan:</span>
                                <span className="font-medium text-text">{formatRupiah(shift.total_pendapatan)}</span>
                              </div>
                              <div className="flex justify-between text-text-secondary">
                                <span>Digital:</span>
                                <span className="font-medium text-text">{formatRupiah(shift.total_digital)}</span>
                              </div>
                              <div className="flex justify-between text-text-secondary">
                                <span>Tunai (Cash):</span>
                                <span className="font-medium text-text">{formatRupiah(shift.total_cash)}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Rincian Transaksi */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-text text-sm flex items-center gap-2">
                      <FiDollarSign className="text-success" />
                      Daftar Transaksi Terkunci
                    </h4>
                    {!detailData.transactions || detailData.transactions.length === 0 ? (
                      <p className="text-xs text-text-secondary bg-background p-4 rounded-xl border border-border text-center">
                        Tidak ada riwayat transaksi pada tanggal ini.
                      </p>
                    ) : (
                      <div className="border border-border rounded-2xl overflow-hidden bg-background">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-card border-b border-border text-text-secondary">
                            <tr>
                              <th className="py-2.5 px-4">Invoice</th>
                              <th className="py-2.5 px-2">Waktu</th>
                              <th className="py-2.5 px-2">Kasir</th>
                              <th className="py-2.5 px-2">Pembayaran</th>
                              <th className="py-2.5 px-4 text-right">Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {detailData.transactions.map((trx) => (
                              <tr key={trx._id} className="hover:bg-card/50 transition">
                                <td className="py-3 px-4 font-semibold text-text">
                                  <div>{trx.invoice}</div>
                                  <div className="mt-1 space-y-1">
                                    {trx.detail_transaksi?.map((item, idx) => (
                                      <div key={idx} className="text-[10px] text-text-secondary font-normal pl-2 border-l border-border">
                                        {item.produk_id?.nama_produk || "Produk"} x{item.kuantitas} ({formatRupiah(item.harga_satuan)})
                                      </div>
                                    ))}
                                  </div>
                                </td>
                                <td className="py-3 px-2 text-text-secondary">
                                  {new Date(trx.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                                </td>
                                <td className="py-3 px-2 text-text">
                                  {trx.user_id?.nama_lengkap || "Walk-In"}
                                </td>
                                <td className="py-3 px-2">
                                  <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-[10px] font-semibold">
                                    {trx.metode_pembayaran}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-right font-bold text-text">
                                  {formatRupiah(trx.total_pembayaran)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-border px-6 py-4 bg-background/50 flex justify-end">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-5 py-2.5 bg-primary text-sidebar font-semibold rounded-xl hover:bg-primary-dark transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Reports;