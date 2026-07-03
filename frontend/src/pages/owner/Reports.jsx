import { useState, useEffect } from "react";
import api from "../../utils/api";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import Swal from "sweetalert2";

const Reports = () => {
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    totalTransactions: 0,
    cashIncome: 0,
    qrisIncome: 0,
  });

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

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
  const fetchData = async () => {
    try {
      setLoading(true);

      const res = await api.get("/transactions/report");
      const reportRes = await api.get("/reports");

      const data = res.data || {};

      setSummary({
        totalRevenue: data.totalRevenue || 0,
        totalTransactions: data.totalTransactions || 0,
        cashIncome: data.paymentMethods?.Cash || 0,
        qrisIncome: data.paymentMethods?.QRIS || 0,
      });

      setReports(reportRes.data || []);
    } catch (err) {
      alertError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ======================
  // CLOSE BOOK
  // ======================
  const closeBook = async () => {
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
        Pendapatan: r.total_pendapatan_sistem,
        Cabang: r.cabang,
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
            className="bg-primary text-sidebar px-4 py-2 rounded-xl font-semibold"
          >
            Close Daily Book
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
                  <th className="text-left py-3">Date</th>
                  <th className="text-left">Revenue</th>
                  <th className="text-left">Branch</th>
                  <th className="text-left">Status</th>
                </tr>
              </thead>

              <tbody>
                {reports.map((report) => (
                  <tr
                    key={report._id}
                    className="border-b border-border hover:bg-background transition"
                  >
                    <td className="py-3 text-text">
                      {new Date(report.tanggal_laporan).toLocaleDateString("id-ID")}
                    </td>

                    <td className="text-text">
                      {formatRupiah(report.total_pendapatan_sistem)}
                    </td>

                    <td className="text-text-secondary">
                      {report.cabang}
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

      </div>

    </div>
  );
};

export default Reports;