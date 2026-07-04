import React, { useState, useEffect } from "react";
import API from "../../services/api";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    BarChart,
    Bar,
    Cell,
    PieChart,
    Pie,
    Legend
} from "recharts";
import {
    FiRefreshCw,
    FiCalendar,
    FiDollarSign,
    FiShoppingCart,
    FiActivity,
    FiFileText,
    FiDownload,
    FiPieChart,
    FiTrendingUp,
    FiAlertCircle,
    FiCheckCircle,
    FiChevronRight,
    FiLayers
} from "react-icons/fi";

const AdminReports = () => {
    // States for data
    const [transactions, setTransactions] = useState([]);
    const [dailyReports, setDailyReports] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // States for filter
    const [filterPreset, setFilterPreset] = useState("7days"); // 7days, 30days, thisMonth, custom
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [selectedBranch, setSelectedBranch] = useState("Semua Cabang"); // For Owner selection
    const [activeTab, setActiveTab] = useState("overview"); // overview, charts, products, closingBook

    const userInfo = JSON.parse(localStorage.getItem("userInfo"));
    const isOwner = userInfo?.role === "Owner";
    const userBranch = isOwner ? selectedBranch : (userInfo?.cabang || "Cabang Jogja");

    const config = {
        headers: { Authorization: `Bearer ${userInfo?.token}` }
    };

    // Helper: Format Date to YYYY-MM-DD in local time
    const getLocalDateString = (dateObj) => {
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, "0");
        const day = String(dateObj.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

    // Initialize date picker constraints
    useEffect(() => {
        const end = new Date();
        const start = new Date();
        if (filterPreset === "7days") {
            start.setDate(end.getDate() - 7);
        } else if (filterPreset === "30days") {
            start.setDate(end.getDate() - 30);
        } else if (filterPreset === "thisMonth") {
            start.setDate(1);
        }
        setStartDate(getLocalDateString(start));
        setEndDate(getLocalDateString(end));
    }, [filterPreset]);

    // Load Data
    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [trxRes, logRes] = await Promise.all([
                API.get("/transactions", config),
                API.get("/reports", config)
            ]);
            setTransactions(trxRes.data);
            setDailyReports(logRes.data);
        } catch (error) {
            console.error("Gagal memuat laporan:", error);
            Swal.fire("Error", "Gagal mengambil data laporan dari server", "error");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Filter Data client-side based on Date and Branch
    const getFilteredTransactions = () => {
        return transactions.filter((trx) => {
            // Filter by Date
            const localTrxDate = getLocalDateString(new Date(trx.date));
            const matchDate = localTrxDate >= startDate && localTrxDate <= endDate;
            
            // Filter by Branch
            const matchBranch = 
                isOwner && selectedBranch === "Semua Cabang"
                    ? true
                    : trx.details?.[0]?.produk_id 
                        ? true // If it has details, match the transaction branch
                        : true; 
            
            // Check if transaction branch matches selected branch
            const actualTrxBranch = trx.cabang || (trx.details?.[0]?.produk_id ? "Cabang Jogja" : ""); // fallback
            const matchBranchExact = isOwner && selectedBranch !== "Semua Cabang" 
                ? actualTrxBranch === selectedBranch 
                : actualTrxBranch === userBranch;

            return matchDate && matchBranchExact;
        });
    };

    const getFilteredReports = () => {
        return dailyReports.filter((rep) => {
            const localRepDate = getLocalDateString(new Date(rep.tanggal_laporan));
            const matchDate = localRepDate >= startDate && localRepDate <= endDate;
            
            const matchBranchExact = isOwner && selectedBranch !== "Semua Cabang" 
                ? rep.cabang === selectedBranch 
                : rep.cabang === userBranch;
            
            return matchDate && matchBranchExact;
        });
    };

    const filteredTransactions = getFilteredTransactions();
    const filteredReports = getFilteredReports();

    // Metric Calculations
    const totalRevenue = filteredTransactions.reduce((sum, trx) => sum + trx.total, 0);
    const totalTransactions = filteredTransactions.length;
    const aov = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    // Variance Sum
    const totalVariance = filteredReports.reduce((sum, rep) => sum + rep.selisih, 0);

    // Payment split
    const paymentBreakdown = filteredTransactions.reduce(
        (acc, trx) => {
            const method = trx.payment || "Cash";
            if (acc[method] !== undefined) {
                acc[method] += trx.total;
            }
            return acc;
        },
        { Cash: 0, QRIS: 0, Transfer: 0, Card: 0 }
    );

    // Recharts Data Helpers
    const getSalesTrend = () => {
        const sorted = [...filteredTransactions].sort((a, b) => new Date(a.date) - new Date(b.date));
        const grouped = {};
        sorted.forEach((trx) => {
            const dateStr = new Date(trx.date).toLocaleDateString("id-ID", {
                day: "2-digit",
                month: "short"
            });
            grouped[dateStr] = (grouped[dateStr] || 0) + trx.total;
        });
        return Object.keys(grouped).map((date) => ({
            date,
            "Omzet": grouped[date]
        }));
    };

    const getBestSellers = () => {
        const counts = {};
        filteredTransactions.forEach((trx) => {
            if (trx.details) {
                trx.details.forEach((item) => {
                    const name = item.produk_id?.nama_produk || "Produk Dihapus";
                    counts[name] = (counts[name] || 0) + (item.kuantitas || 0);
                });
            }
        });
        return Object.keys(counts)
            .map((name) => ({
                name,
                "Kuantitas": counts[name]
            }))
            .sort((a, b) => b.Kuantitas - a.Kuantitas)
            .slice(0, 5);
    };

    const getCategoryData = () => {
        const counts = {};
        filteredTransactions.forEach((trx) => {
            if (trx.details) {
                trx.details.forEach((item) => {
                    const cat = item.produk_id?.kategori || "Lain-lain";
                    counts[cat] = (counts[cat] || 0) + (item.kuantitas || 0);
                });
            }
        });
        return Object.keys(counts).map((name) => ({
            name,
            value: counts[name]
        }));
    };

    // Color Palette for Pie Chart
    const COLORS = ["#06b6d4", "#3b82f6", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"];

    // Format Rupiah helper
    const formatRupiah = (number) =>
        new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0
        }).format(number);

    // Helper: Trigger native file download via backend form echo submission
    const triggerFileDownload = (base64Data, filename, contentType) => {
        // Create or get hidden iframe to prevent page reload/navigation
        let iframe = document.getElementById("download-iframe");
        if (!iframe) {
            iframe = document.createElement("iframe");
            iframe.id = "download-iframe";
            iframe.style.display = "none";
            document.body.appendChild(iframe);
        }

        const form = document.createElement("form");
        form.method = "POST";
        form.action = "http://localhost:5000/api/reports/download-echo";
        form.target = "download-iframe";
        form.style.display = "none";

        const inputData = document.createElement("input");
        inputData.type = "hidden";
        inputData.name = "base64Data";
        inputData.value = base64Data;
        form.appendChild(inputData);

        const inputFilename = document.createElement("input");
        inputFilename.type = "hidden";
        inputFilename.name = "filename";
        inputFilename.value = filename;
        form.appendChild(inputFilename);

        const inputType = document.createElement("input");
        inputType.type = "hidden";
        inputType.name = "contentType";
        inputType.value = contentType;
        form.appendChild(inputType);

        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
    };

    // EXPORTS
    const handleExportExcel = () => {
        if (filteredTransactions.length === 0) {
            Swal.fire("Peringatan", "Tidak ada data untuk diekspor!", "warning");
            return;
        }

        // Sheet 1: Transactions
        const txData = filteredTransactions.map((trx) => ({
            "Invoice": trx.invoice,
            "Kasir / Petugas": trx.customer,
            "Metode Pembayaran": trx.payment,
            "Total Belanja (Rp)": trx.total,
            "Tanggal Transaksi": new Date(trx.date).toLocaleString("id-ID"),
            "Status": trx.status
        }));

        // Sheet 2: Products
        const prodSummary = {};
        filteredTransactions.forEach((trx) => {
            if (trx.details) {
                trx.details.forEach((item) => {
                    const name = item.produk_id?.nama_produk || "Produk Dihapus";
                    const cat = item.produk_id?.kategori || "Lain-lain";
                    if (!prodSummary[name]) {
                        prodSummary[name] = { Kategori: cat, Qty: 0, Revenue: 0 };
                    }
                    prodSummary[name].Qty += item.kuantitas || 0;
                    prodSummary[name].Revenue += (item.kuantitas || 0) * (item.harga_satuan || 0);
                });
            }
        });
        const prData = Object.keys(prodSummary).map((name) => ({
            "Nama Produk": name,
            "Kategori": prodSummary[name].Kategori,
            "Jumlah Terjual (Unit)": prodSummary[name].Qty,
            "Total Pendapatan (Rp)": prodSummary[name].Revenue
        })).sort((a, b) => b["Jumlah Terjual (Unit)"] - a["Jumlah Terjual (Unit)"]);

        // Sheet 3: Closing Book
        const clData = filteredReports.map((rep) => ({
            "Tanggal Laporan": new Date(rep.tanggal_laporan).toLocaleDateString("id-ID"),
            "Pemeriksa (Admin)": rep.diperiksa_oleh?.nama_lengkap || "System",
            "Role": rep.diperiksa_oleh?.role || "",
            "Pendapatan Sistem (Rp)": rep.total_pendapatan_sistem,
            "Uang Fisik Kas (Rp)": rep.total_kas_fisik,
            "Selisih Kas (Rp)": rep.selisih,
            "Status": rep.status_tutup_buku
        }));

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(txData), "Riwayat Transaksi");
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(prData), "Kinerja Produk");
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(clData), "Riwayat Tutup Buku");

        const wbout = XLSX.write(wb, { bookType: "xlsx", type: "base64" });
        triggerFileDownload(
            wbout, 
            `Laporan_Nicky_Frozen_${userBranch.replace(" ", "_")}_${startDate}_to_${endDate}.xlsx`,
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        
        Swal.fire({
            title: "Berhasil!",
            text: "Laporan Excel berhasil diunduh.",
            icon: "success",
            timer: 1500,
            showConfirmButton: false
        });
    };

    const handleExportPDF = () => {
        if (filteredTransactions.length === 0) {
            Swal.fire("Peringatan", "Tidak ada data untuk diekspor!", "warning");
            return;
        }

        const doc = new jsPDF();
        
        // Header
        doc.setFont("helvetica", "bold");
        doc.setFontSize(18);
        doc.setTextColor(31, 41, 55); // Gray 800
        doc.text(`LAPORAN KINERJA CABANG - NICKY FROZEN`, 14, 22);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);
        doc.setTextColor(75, 85, 99); // Gray 600
        doc.text(`Cabang: ${userBranch}`, 14, 30);
        doc.text(`Periode: ${startDate} s/d ${endDate}`, 14, 36);
        doc.text(`Tanggal Unduh: ${new Date().toLocaleString("id-ID")}`, 14, 42);
        
        // Divider
        doc.setDrawColor(209, 213, 219); // Gray 300
        doc.line(14, 48, 196, 48);
        
        // Financial Metrics Title
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(14, 116, 144); // Cyan 700
        doc.text("1. RINGKASAN DATA KEUANGAN", 14, 58);
        
        // Details
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.setTextColor(31, 41, 55);
        doc.text(`Total Omzet Pendapatan: ${formatRupiah(totalRevenue)}`, 14, 68);
        doc.text(`Total Jumlah Transaksi: ${totalTransactions} Transaksi`, 14, 75);
        doc.text(`Rata-rata Nilai Belanja (AOV): ${formatRupiah(aov)}`, 14, 82);
        doc.text(`Total Selisih Kas Fisik (Tutup Buku): ${formatRupiah(totalVariance)}`, 14, 89);
        
        // Payment split
        doc.setFont("helvetica", "bold");
        doc.text("Pembagian Metode Pembayaran:", 14, 100);
        doc.setFont("helvetica", "normal");
        doc.text(`- Tunai (Cash): ${formatRupiah(paymentBreakdown.Cash)}`, 20, 107);
        doc.text(`- QRIS Online: ${formatRupiah(paymentBreakdown.QRIS)}`, 20, 114);
        doc.text(`- Transfer Bank: ${formatRupiah(paymentBreakdown.Transfer)}`, 20, 121);
        doc.text(`- Kartu Kredit/Debit: ${formatRupiah(paymentBreakdown.Card)}`, 20, 128);

        // Best sellers Title
        doc.line(14, 136, 196, 136);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(14, 116, 144);
        doc.text("2. PRODUK TERLARIS (TOP 5)", 14, 146);
        
        // List top items
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.setTextColor(31, 41, 55);
        let yOffset = 156;
        const bSellers = getBestSellers();
        if (bSellers.length === 0) {
            doc.text("Tidak ada data produk terjual.", 14, yOffset);
        } else {
            bSellers.forEach((item, index) => {
                doc.text(`${index + 1}. ${item.name} (${item.Kuantitas} unit terjual)`, 14, yOffset);
                yOffset += 7;
            });
        }

        // Save
        const pdfBase64 = doc.output("datauristring").split(",")[1];
        triggerFileDownload(
            pdfBase64,
            `Laporan_Cabang_${userBranch.replace(" ", "_")}_${startDate}_to_${endDate}.pdf`,
            "application/pdf"
        );
        
        Swal.fire({
            title: "Berhasil!",
            text: "Laporan PDF berhasil diunduh.",
            icon: "success",
            timer: 1500,
            showConfirmButton: false
        });
    };

    return (
        <div className="h-full flex flex-col bg-background font-poppins px-6 py-4 overflow-hidden">
            {/* Header Section */}
            <div className="bg-card p-5 rounded-2xl border border-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 flex-shrink-0">
                <div>
                    <h2 className="text-2xl font-bold text-text flex items-center gap-2">
                        <FiTrendingUp className="text-primary" /> Reports & Analytics
                    </h2>
                    <p className="text-text-secondary text-sm mt-1">
                        Monitor branch performance, sales charts, and cash reconciliations.
                    </p>
                </div>
                
                {/* Filters grid */}
                <div className="flex flex-wrap items-center gap-3">
                    {/* Branch Filter for Owner */}
                    {isOwner && (
                        <select
                            value={selectedBranch}
                            onChange={(e) => setSelectedBranch(e.target.value)}
                            className="py-2.5 px-4 rounded-xl border border-border bg-background outline-none text-text text-sm focus:border-primary transition"
                        >
                            <option value="Semua Cabang">Semua Cabang</option>
                            <option value="Cabang Jogja">Cabang Jogja</option>
                            <option value="Cabang Solo">Cabang Solo</option>
                        </select>
                    )}

                    {/* Presets */}
                    <select
                        value={filterPreset}
                        onChange={(e) => setFilterPreset(e.target.value)}
                        className="py-2.5 px-4 rounded-xl border border-border bg-background outline-none text-text text-sm focus:border-primary transition"
                    >
                        <option value="7days">7 Hari Terakhir</option>
                        <option value="30days">30 Hari Terakhir</option>
                        <option value="thisMonth">Bulan Ini</option>
                        <option value="custom">Rentang Kustom</option>
                    </select>

                    {/* Custom Date Pickers */}
                    {filterPreset === "custom" && (
                        <div className="flex items-center gap-2">
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="py-2 px-3 rounded-xl border border-border bg-background outline-none text-text text-xs focus:border-primary"
                            />
                            <span className="text-text-secondary text-xs">s/d</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="py-2 px-3 rounded-xl border border-border bg-background outline-none text-text text-xs focus:border-primary"
                            />
                        </div>
                    )}

                    <button
                        onClick={fetchData}
                        disabled={isLoading}
                        className="p-3 rounded-xl bg-gray-50 border border-border hover:bg-gray-100 text-text-secondary transition flex items-center justify-center cursor-pointer"
                    >
                        <FiRefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                    </button>

                    {/* Export dropdown */}
                    <div className="flex items-center gap-1">
                        <button
                            onClick={handleExportExcel}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border-none shadow-md shadow-emerald-500/10"
                        >
                            <FiDownload size={15} /> Excel
                        </button>
                        <button
                            onClick={handleExportPDF}
                            className="bg-primary hover:bg-primary-dark text-sidebar px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border-none shadow-md shadow-cyan-500/10"
                        >
                            <FiFileText size={15} /> PDF
                        </button>
                    </div>
                </div>
            </div>

            {/* General Stats Grids */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 flex-shrink-0">
                {/* Cards */}
                <div className="bg-card border border-border p-5 rounded-2xl flex items-center gap-4 shadow-sm relative overflow-hidden">
                    <div className="p-3 bg-cyan-50 rounded-xl text-primary z-10">
                        <FiDollarSign size={24} />
                    </div>
                    <div className="z-10">
                        <p className="text-text-secondary text-xs font-medium">Total Pendapatan</p>
                        <h4 className="text-lg font-bold text-text mt-0.5">{formatRupiah(totalRevenue)}</h4>
                    </div>
                    <div className="absolute right-[-10px] bottom-[-20px] text-cyan-50/30 font-bold text-7xl select-none pointer-events-none">Rp</div>
                </div>

                <div className="bg-card border border-border p-5 rounded-2xl flex items-center gap-4 shadow-sm relative overflow-hidden">
                    <div className="p-3 bg-green-50 rounded-xl text-success z-10">
                        <FiShoppingCart size={24} />
                    </div>
                    <div className="z-10">
                        <p className="text-text-secondary text-xs font-medium">Jumlah Transaksi</p>
                        <h4 className="text-lg font-bold text-text mt-0.5">{totalTransactions} Items</h4>
                    </div>
                    <div className="absolute right-[-10px] bottom-[-25px] text-green-50/30 font-bold text-7xl select-none pointer-events-none">Trx</div>
                </div>

                <div className="bg-card border border-border p-5 rounded-2xl flex items-center gap-4 shadow-sm relative overflow-hidden">
                    <div className="p-3 bg-blue-50 rounded-xl text-blue-600 z-10">
                        <FiActivity size={24} />
                    </div>
                    <div className="z-10">
                        <p className="text-text-secondary text-xs font-medium">Rata-rata Belanja (AOV)</p>
                        <h4 className="text-lg font-bold text-text mt-0.5">{formatRupiah(aov)}</h4>
                    </div>
                    <div className="absolute right-[-10px] bottom-[-20px] text-blue-50/30 font-bold text-7xl select-none pointer-events-none">Avg</div>
                </div>

                <div className="bg-card border border-border p-5 rounded-2xl flex items-center gap-4 shadow-sm relative overflow-hidden">
                    <div className="p-3 bg-rose-50 rounded-xl text-danger z-10">
                        <FiAlertCircle size={24} />
                    </div>
                    <div className="z-10">
                        <p className="text-text-secondary text-xs font-medium">Selisih Kas Tutup Buku</p>
                        <h4 className={`text-lg font-bold mt-0.5 ${totalVariance < 0 ? "text-danger" : totalVariance > 0 ? "text-amber-500" : "text-success"}`}>
                            {formatRupiah(totalVariance)}
                        </h4>
                    </div>
                    <div className="absolute right-[-10px] bottom-[-20px] text-rose-50/30 font-bold text-7xl select-none pointer-events-none">Sel</div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-border mb-4 flex-shrink-0">
                <button
                    onClick={() => setActiveTab("overview")}
                    className={`pb-3 px-4 font-semibold text-sm transition-all border-b-2 cursor-pointer ${
                        activeTab === "overview"
                            ? "border-primary text-primary"
                            : "border-transparent text-text-secondary hover:text-text"
                    }`}
                >
                    Ringkasan Utama
                </button>
                <button
                    onClick={() => setActiveTab("charts")}
                    className={`pb-3 px-4 font-semibold text-sm transition-all border-b-2 cursor-pointer ${
                        activeTab === "charts"
                            ? "border-primary text-primary"
                            : "border-transparent text-text-secondary hover:text-text"
                    }`}
                >
                    Analitik Penjualan
                </button>
                <button
                    onClick={() => setActiveTab("products")}
                    className={`pb-3 px-4 font-semibold text-sm transition-all border-b-2 cursor-pointer ${
                        activeTab === "products"
                            ? "border-primary text-primary"
                            : "border-transparent text-text-secondary hover:text-text"
                    }`}
                >
                    Kinerja Produk
                </button>
                <button
                    onClick={() => setActiveTab("closingBook")}
                    className={`pb-3 px-4 font-semibold text-sm transition-all border-b-2 cursor-pointer ${
                        activeTab === "closingBook"
                            ? "border-primary text-primary"
                            : "border-transparent text-text-secondary hover:text-text"
                    }`}
                >
                    Riwayat Tutup Buku
                </button>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col p-6">
                {isLoading ? (
                    <div className="flex-1 flex flex-col items-center justify-center">
                        <FiRefreshCw className="animate-spin text-primary h-12 w-12 mb-3" />
                        <p className="text-text-secondary font-medium text-sm">Memuat Data Laporan...</p>
                    </div>
                ) : filteredTransactions.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-300">
                            <FiPieChart size={40} />
                        </div>
                        <h4 className="text-lg font-bold text-text mb-1">Belum Ada Data Transaksi</h4>
                        <p className="text-text-secondary text-sm max-w-sm">
                            Tidak ditemukan riwayat transaksi pada cabang dan periode yang dipilih. Coba pilih preset rentang waktu lain.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Tab 1: OVERVIEW */}
                        {activeTab === "overview" && (
                            <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-y-auto">
                                {/* Left column: chart summary */}
                                <div className="flex-1 flex flex-col">
                                    <h3 className="text-md font-bold text-text mb-4">Grafik Pertumbuhan Omzet</h3>
                                    <div className="flex-1 min-h-[300px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={getSalesTrend()}>
                                                <defs>
                                                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                                                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                                <XAxis dataKey="date" stroke="#9ca3af" fontSize={11} tickLine={false} />
                                                <YAxis 
                                                    stroke="#9ca3af" 
                                                    fontSize={11} 
                                                    tickLine={false} 
                                                    axisLine={false}
                                                    tickFormatter={(v) => `Rp ${v / 1000}k`}
                                                />
                                                <Tooltip 
                                                    formatter={(v) => [formatRupiah(v), "Omzet"]}
                                                    contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb" }}
                                                />
                                                <Area type="monotone" dataKey="Omzet" stroke="#06b6d4" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSales)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Right column: Payment split and top products list */}
                                <div className="w-full md:w-[360px] flex flex-col gap-6">
                                    {/* Payment Reconciliations */}
                                    <div className="bg-gray-50 border border-border rounded-2xl p-5">
                                        <h3 className="text-sm font-bold text-text mb-4">Metode Pembayaran</h3>
                                        <div className="space-y-3">
                                            {Object.entries(paymentBreakdown).map(([method, amount]) => {
                                                const percentage = totalRevenue > 0 ? (amount / totalRevenue) * 100 : 0;
                                                return (
                                                    <div key={method} className="space-y-1">
                                                        <div className="flex items-center justify-between text-xs">
                                                            <span className="font-semibold text-text">{method}</span>
                                                            <span className="text-text-secondary">{formatRupiah(amount)} ({percentage.toFixed(1)}%)</span>
                                                        </div>
                                                        <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                                                            <div 
                                                                className={`h-full rounded-full ${
                                                                    method === "QRIS" ? "bg-cyan-500" :
                                                                    method === "Cash" ? "bg-green-500" :
                                                                    method === "Transfer" ? "bg-blue-500" : "bg-amber-500"
                                                                }`}
                                                                style={{ width: `${percentage}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Quick list: Best sellers */}
                                    <div className="bg-gray-50 border border-border rounded-2xl p-5 flex-1">
                                        <h3 className="text-sm font-bold text-text mb-3">Produk Terlaris</h3>
                                        <div className="divide-y divide-gray-200">
                                            {getBestSellers().map((item, idx) => (
                                                <div key={idx} className="py-2.5 flex items-center justify-between">
                                                    <div className="flex items-center gap-2 overflow-hidden">
                                                        <span className="text-xs font-bold text-primary bg-cyan-50 h-5 w-5 rounded flex items-center justify-center shrink-0">
                                                            {idx + 1}
                                                        </span>
                                                        <p className="text-xs font-semibold text-text truncate" title={item.name}>{item.name}</p>
                                                    </div>
                                                    <span className="text-xs font-bold text-text-secondary shrink-0">{item.Kuantitas} Unit</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tab 2: CHARTS DETAIL */}
                        {activeTab === "charts" && (
                            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-y-auto">
                                {/* Sales Trend Chart */}
                                <div className="border border-border p-5 rounded-2xl flex flex-col bg-white">
                                    <h3 className="text-md font-bold text-text mb-4">Tren Pendapatan Harian</h3>
                                    <div className="h-[300px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={getSalesTrend()}>
                                                <defs>
                                                    <linearGradient id="colorSalesDetail" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                                <XAxis dataKey="date" stroke="#9ca3af" fontSize={11} />
                                                <YAxis 
                                                    stroke="#9ca3af" 
                                                    fontSize={11} 
                                                    tickFormatter={(v) => `Rp ${v / 1000}k`}
                                                />
                                                <Tooltip formatter={(v) => [formatRupiah(v), "Omzet"]} />
                                                <Area type="monotone" dataKey="Omzet" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSalesDetail)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Pie Chart Payment Breakdown */}
                                <div className="border border-border p-5 rounded-2xl flex flex-col bg-white">
                                    <h3 className="text-md font-bold text-text mb-4">Proporsi Pembayaran</h3>
                                    <div className="flex-1 flex items-center justify-center min-h-[300px]">
                                        <div className="w-[260px] h-[260px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={Object.entries(paymentBreakdown).map(([name, value]) => ({ name, value }))}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={60}
                                                        outerRadius={80}
                                                        paddingAngle={4}
                                                        dataKey="value"
                                                    >
                                                        {Object.entries(paymentBreakdown).map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip formatter={(v) => formatRupiah(v)} />
                                                    <Legend layout="horizontal" verticalAlign="bottom" align="center" iconSize={10} iconType="circle" wrapperStyle={{ fontSize: "11px" }} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tab 3: PRODUCTS & CATEGORIES */}
                        {activeTab === "products" && (
                            <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-y-auto">
                                {/* Best selling bar chart */}
                                <div className="flex-1 border border-border p-5 rounded-2xl bg-white">
                                    <h3 className="text-md font-bold text-text mb-4 flex items-center gap-2">
                                        <FiLayers className="text-primary" /> Top 5 Produk Paling Laris (Kuantitas)
                                    </h3>
                                    <div className="h-[300px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart 
                                                data={getBestSellers()} 
                                                layout="vertical"
                                                margin={{ left: 30, right: 30 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                                                <XAxis type="number" stroke="#9ca3af" fontSize={11} />
                                                <YAxis type="category" dataKey="name" stroke="#9ca3af" fontSize={11} width={120} />
                                                <Tooltip />
                                                <Bar dataKey="Kuantitas" fill="#06b6d4" radius={[0, 8, 8, 0]}>
                                                    {getBestSellers().map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Category Performance chart */}
                                <div className="w-full lg:w-[380px] border border-border p-5 rounded-2xl bg-white flex flex-col">
                                    <h3 className="text-md font-bold text-text mb-4">Penjualan per Kategori</h3>
                                    <div className="h-[240px] flex items-center justify-center">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={getCategoryData()}
                                                    cx="50%"
                                                    cy="50%"
                                                    outerRadius={80}
                                                    fill="#8884d8"
                                                    dataKey="value"
                                                    label={(entry) => entry.name}
                                                >
                                                    {getCategoryData().map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip formatter={(v) => [`${v} unit`, "Terjual"]} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    
                                    {/* Breakdown categories list */}
                                    <div className="mt-4 divide-y divide-gray-100 flex-1 overflow-y-auto max-h-[150px]">
                                        {getCategoryData().map((item, idx) => (
                                            <div key={idx} className="py-2 flex items-center justify-between text-xs">
                                                <span className="font-semibold text-text-secondary flex items-center gap-1.5">
                                                    <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                                                    {item.name}
                                                </span>
                                                <span className="font-bold text-text">{item.value} Unit</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tab 4: TUTUP BUKU HISTORY */}
                        {activeTab === "closingBook" && (
                            <div className="flex-1 flex flex-col overflow-hidden">
                                <div className="flex items-center justify-between mb-4 flex-shrink-0">
                                    <h3 className="text-md font-bold text-text flex items-center gap-2">
                                        <FiFileText className="text-rose-500" /> Riwayat Audit Tutup Buku Harian
                                    </h3>
                                    <span className="text-xs text-text-secondary">
                                        Menampilkan {filteredReports.length} laporan penutupan kas cabang
                                    </span>
                                </div>

                                <div className="flex-1 overflow-y-auto">
                                    <table className="w-full border-collapse text-left">
                                        <thead className="sticky top-0 bg-card z-10">
                                            <tr className="border-b border-border text-xs text-text-secondary uppercase">
                                                <th className="py-3 px-4 font-semibold w-[20%]">Tanggal</th>
                                                <th className="py-3 px-4 font-semibold w-[25%]">Pemeriksa (Admin)</th>
                                                <th className="py-3 px-4 font-semibold w-[15%] text-right">Sistem</th>
                                                <th className="py-3 px-4 font-semibold w-[15%] text-right">Kas Fisik</th>
                                                <th className="py-3 px-4 font-semibold w-[15%] text-right">Selisih</th>
                                                <th className="py-3 px-4 font-semibold w-[10%] text-center">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {filteredReports.length === 0 ? (
                                                <tr>
                                                    <td colSpan="6" className="text-center py-8 text-text-secondary text-sm">
                                                        Belum ada rekaman tutup buku pada periode ini.
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredReports.map((rep) => {
                                                    const formattedDate = new Date(rep.tanggal_laporan).toLocaleDateString("id-ID", {
                                                        day: "2-digit",
                                                        month: "short",
                                                        year: "numeric"
                                                    });

                                                    const isDiff = rep.selisih !== 0;

                                                    return (
                                                        <tr key={rep._id} className="hover:bg-gray-50/50 transition text-sm">
                                                            <td className="py-3.5 px-4 font-medium text-text">
                                                                {formattedDate}
                                                            </td>
                                                            <td className="py-3.5 px-4">
                                                                <p className="font-semibold text-text">{rep.diperiksa_oleh?.nama_lengkap || "System"}</p>
                                                                <p className="text-[10px] text-text-secondary">{rep.diperiksa_oleh?.role || "Petugas"}</p>
                                                            </td>
                                                            <td className="py-3.5 px-4 text-right text-text">
                                                                {formatRupiah(rep.total_pendapatan_sistem)}
                                                            </td>
                                                            <td className="py-3.5 px-4 text-right font-medium text-text">
                                                                {formatRupiah(rep.total_kas_fisik)}
                                                            </td>
                                                            <td className={`py-3.5 px-4 text-right font-bold ${
                                                                rep.selisih < 0 
                                                                    ? "text-danger" 
                                                                    : rep.selisih > 0 
                                                                        ? "text-amber-500" 
                                                                        : "text-success"
                                                            }`}>
                                                                {rep.selisih > 0 ? "+" : ""}
                                                                {formatRupiah(rep.selisih)}
                                                            </td>
                                                            <td className="py-3.5 px-4 text-center">
                                                                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                                                    rep.status_tutup_buku === "Terkunci" 
                                                                        ? "bg-gray-100 text-gray-600" 
                                                                        : "bg-green-50 text-success"
                                                                }`}>
                                                                    {rep.status_tutup_buku}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default AdminReports;
