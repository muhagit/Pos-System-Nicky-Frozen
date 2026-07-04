import React, { useState, useEffect } from "react";
import API from "../../services/api";
import Swal from "sweetalert2";
import {
    FiRefreshCw,
    FiSearch,
    FiArrowRight,
    FiActivity,
    FiLayers,
    FiCheckCircle,
    FiAlertCircle,
    FiPlus,
    FiEdit3,
    FiClock,
    FiArrowUpRight,
    FiSliders
} from "react-icons/fi";

const AdminBranchSync = () => {
    // States
    const [products, setProducts] = useState([]);
    const [logs, setLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("overview"); // overview, transfer, adjust, logs
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");

    // Form States
    const [transferForm, setTransferForm] = useState({
        produk_id: "",
        dari_cabang: "",
        ke_cabang: "",
        jumlah: "",
        keterangan: ""
    });

    const [adjustForm, setAdjustForm] = useState({
        produk_id: "",
        cabang: "",
        jumlah: "",
        keterangan: ""
    });

    const branches = ["Cabang Jogja", "Cabang Solo"];
    
    // Auth headers
    const userInfo = JSON.parse(localStorage.getItem("userInfo"));
    const config = {
        headers: { Authorization: `Bearer ${userInfo?.token}` }
    };

    // Load Data
    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [prodRes, logRes] = await Promise.all([
                API.get("/products?allBranches=true", config),
                API.get("/products/transfer-logs", config)
            ]);
            setProducts(prodRes.data);
            setLogs(logRes.data);
        } catch (error) {
            console.error("Gagal memuat data branch sync:", error);
            Swal.fire("Error", "Gagal mengambil data dari server", "error");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Helpers
    const getBranchStock = (product, branch) => {
        if (!product || !product.stok_cabang) return 0;
        // stok_cabang is returned as a plain object from JSON serialization of Mongoose Map
        return product.stok_cabang[branch] || 0;
    };

    const getCategories = () => {
        const cats = new Set(products.map(p => p.kategori));
        return ["All", ...Array.from(cats)];
    };

    // Handlers
    const handleTransferSubmit = async (e) => {
        e.preventDefault();
        const { produk_id, dari_cabang, ke_cabang, jumlah, keterangan } = transferForm;

        if (!produk_id || !dari_cabang || !ke_cabang || !jumlah) {
            Swal.fire("Peringatan", "Mohon isi semua field transfer!", "warning");
            return;
        }

        if (dari_cabang === ke_cabang) {
            Swal.fire("Peringatan", "Cabang asal dan tujuan tidak boleh sama!", "warning");
            return;
        }

        const product = products.find(p => p._id === produk_id);
        const sourceStock = getBranchStock(product, dari_cabang);
        if (Number(jumlah) > sourceStock) {
            Swal.fire("Peringatan", `Stok tidak mencukupi! Stok ${product.nama_produk} di ${dari_cabang} adalah ${sourceStock} unit.`, "warning");
            return;
        }

        const result = await Swal.fire({
            title: "Konfirmasi Transfer",
            text: `Apakah Anda yakin ingin mentransfer ${jumlah} unit ${product.nama_produk} dari ${dari_cabang} ke ${ke_cabang}?`,
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Ya, Transfer",
            cancelButtonText: "Batal",
            confirmButtonColor: "#22d3ee"
        });

        if (result.isConfirmed) {
            try {
                const response = await API.post("/products/transfer", transferForm, config);
                Swal.fire({
                    title: "Berhasil!",
                    text: response.data.message,
                    icon: "success",
                    timer: 1500,
                    showConfirmButton: false
                });
                setTransferForm({
                    produk_id: "",
                    dari_cabang: "",
                    ke_cabang: "",
                    jumlah: "",
                    keterangan: ""
                });
                fetchData();
            } catch (error) {
                Swal.fire("Gagal", error.response?.data?.message || "Terjadi kesalahan saat transfer.", "error");
            }
        }
    };

    const handleAdjustSubmit = async (e) => {
        e.preventDefault();
        const { produk_id, cabang, jumlah, keterangan } = adjustForm;

        if (!produk_id || !cabang || jumlah === "" || !keterangan) {
            Swal.fire("Peringatan", "Mohon isi semua field penyesuaian stok termasuk Alasan!", "warning");
            return;
        }

        const product = products.find(p => p._id === produk_id);
        const oldStock = getBranchStock(product, cabang);

        const result = await Swal.fire({
            title: "Konfirmasi Penyesuaian",
            text: `Apakah Anda yakin ingin mengubah stok ${product.nama_produk} di ${cabang} dari ${oldStock} menjadi ${jumlah} unit?`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Ya, Sesuaikan",
            cancelButtonText: "Batal",
            confirmButtonColor: "#ef4444"
        });

        if (result.isConfirmed) {
            try {
                const response = await API.post("/products/adjust", adjustForm, config);
                Swal.fire({
                    title: "Berhasil!",
                    text: response.data.message,
                    icon: "success",
                    timer: 1500,
                    showConfirmButton: false
                });
                setAdjustForm({
                    produk_id: "",
                    cabang: "",
                    jumlah: "",
                    keterangan: ""
                });
                fetchData();
            } catch (error) {
                Swal.fire("Gagal", error.response?.data?.message || "Terjadi kesalahan saat menyesuaikan stok.", "error");
            }
        }
    };

    // Filtering
    const filteredProducts = products.filter((product) => {
        const matchName = product.nama_produk
            .toLowerCase()
            .includes(searchQuery.toLowerCase());
        const matchCategory =
            selectedCategory === "All" || product.kategori === selectedCategory;
        return matchName && matchCategory;
    });

    // Helper: format money
    const formatRupiah = (number) =>
        new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(number);

    return (
        <div className="h-full flex flex-col bg-background font-poppins px-6 py-4 overflow-hidden">
            {/* Header Section */}
            <div className="bg-card p-5 rounded-2xl border border-border shadow-sm mb-4 flex-shrink-0 flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-text">
                        Branch Synchronization
                    </h2>
                    <p className="text-text-secondary text-sm mt-1">
                        Monitor stock status, transfer inventory, and view audit trail across branches
                    </p>
                </div>
                <button
                    onClick={fetchData}
                    disabled={isLoading}
                    className="p-3 rounded-xl bg-gray-50 border border-border hover:bg-gray-100 text-text-secondary transition flex items-center justify-center cursor-pointer"
                >
                    <FiRefreshCw className={`h-5 w-5 ${isLoading ? "animate-spin" : ""}`} />
                </button>
            </div>

            {/* Quick Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 flex-shrink-0">
                <div className="bg-card border border-border p-4 rounded-2xl flex items-center gap-4 shadow-sm">
                    <div className="p-3 bg-cyan-50 rounded-xl text-primary">
                        <FiLayers size={24} />
                    </div>
                    <div>
                        <p className="text-text-secondary text-xs font-medium">Total Products</p>
                        <h4 className="text-xl font-bold text-text mt-0.5">{products.length} Items</h4>
                    </div>
                </div>

                <div className="bg-card border border-border p-4 rounded-2xl flex items-center gap-4 shadow-sm">
                    <div className="p-3 bg-green-50 rounded-xl text-success">
                        <FiCheckCircle size={24} />
                    </div>
                    <div>
                        <p className="text-text-secondary text-xs font-medium">System Synchronization</p>
                        <h4 className="text-xl font-bold text-success mt-0.5">Real-time Online</h4>
                    </div>
                </div>

                <div className="bg-card border border-border p-4 rounded-2xl flex items-center gap-4 shadow-sm">
                    <div className="p-3 bg-amber-50 rounded-xl text-warning">
                        <FiActivity size={24} />
                    </div>
                    <div>
                        <p className="text-text-secondary text-xs font-medium">Stock Movements</p>
                        <h4 className="text-xl font-bold text-text mt-0.5">{logs.length} Operations</h4>
                    </div>
                </div>
            </div>

            {/* Main Tabs Navigation */}
            <div className="flex border-b border-border mb-4 flex-shrink-0">
                <button
                    onClick={() => setActiveTab("overview")}
                    className={`pb-3 px-4 font-semibold text-sm transition-all border-b-2 cursor-pointer ${
                        activeTab === "overview"
                            ? "border-primary text-primary"
                            : "border-transparent text-text-secondary hover:text-text"
                    }`}
                >
                    Overview Stok Cabang
                </button>
                <button
                    onClick={() => setActiveTab("transfer")}
                    className={`pb-3 px-4 font-semibold text-sm transition-all border-b-2 cursor-pointer ${
                        activeTab === "transfer"
                            ? "border-primary text-primary"
                            : "border-transparent text-text-secondary hover:text-text"
                    }`}
                >
                    Transfer Stok
                </button>
                <button
                    onClick={() => setActiveTab("adjust")}
                    className={`pb-3 px-4 font-semibold text-sm transition-all border-b-2 cursor-pointer ${
                        activeTab === "adjust"
                            ? "border-primary text-primary"
                            : "border-transparent text-text-secondary hover:text-text"
                    }`}
                >
                    Stock Opname (Penyesuaian)
                </button>
                <button
                    onClick={() => setActiveTab("logs")}
                    className={`pb-3 px-4 font-semibold text-sm transition-all border-b-2 cursor-pointer ${
                        activeTab === "logs"
                            ? "border-primary text-primary"
                            : "border-transparent text-text-secondary hover:text-text"
                    }`}
                >
                    Audit Mutasi Log
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col p-6">
                {isLoading ? (
                    <div className="flex-1 flex flex-col items-center justify-center">
                        <FiRefreshCw className="animate-spin text-primary h-12 w-12 mb-3" />
                        <p className="text-text-secondary font-medium text-sm">Memuat Data...</p>
                    </div>
                ) : (
                    <>
                        {/* 1. OVERVIEW TAB */}
                        {activeTab === "overview" && (
                            <div className="flex-1 flex flex-col overflow-hidden">
                                {/* Filters */}
                                <div className="flex flex-col md:flex-row gap-3 mb-4 flex-shrink-0">
                                    <div className="relative flex-1">
                                        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                                        <input
                                            type="text"
                                            placeholder="Cari nama produk..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-border bg-background outline-none text-text text-sm focus:border-primary transition"
                                        />
                                    </div>
                                    <select
                                        value={selectedCategory}
                                        onChange={(e) => setSelectedCategory(e.target.value)}
                                        className="py-2.5 px-4 rounded-xl border border-border bg-background outline-none text-text text-sm focus:border-primary transition min-w-[180px]"
                                    >
                                        <option value="All">Semua Kategori</option>
                                        {getCategories().filter(c => c !== "All").map((cat, idx) => (
                                            <option key={idx} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Table */}
                                <div className="flex-1 overflow-y-auto">
                                    <table className="w-full border-collapse">
                                        <thead className="sticky top-0 bg-card z-10">
                                            <tr className="border-b border-border text-left">
                                                <th className="py-3 px-4 text-xs font-semibold text-text-secondary uppercase">Produk</th>
                                                {branches.map((b) => (
                                                    <th key={b} className="py-3 px-4 text-xs font-semibold text-text-secondary uppercase text-center">{b}</th>
                                                ))}
                                                <th className="py-3 px-4 text-xs font-semibold text-text-secondary uppercase text-center">Total Stok</th>
                                                <th className="py-3 px-4 text-xs font-semibold text-text-secondary uppercase text-center">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredProducts.length === 0 ? (
                                                <tr>
                                                    <td colSpan={branches.length + 3} className="text-center py-8 text-text-secondary text-sm">
                                                        Tidak ada produk ditemukan.
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredProducts.map((prod) => {
                                                    const total = prod.stok_saat_ini;
                                                    const minLimit = prod.batas_stok_minimum || 5;
                                                    
                                                    let isLowInAnyBranch = false;
                                                    const branchStocks = branches.map((b) => {
                                                        const stock = getBranchStock(prod, b);
                                                        if (stock <= minLimit) isLowInAnyBranch = true;
                                                        return { name: b, stock };
                                                    });

                                                    // Status check
                                                    let statusBadge = (
                                                        <span className="px-2.5 py-1 bg-green-50 text-success rounded-full text-xs font-semibold inline-block">
                                                            Safe
                                                        </span>
                                                    );
                                                    if (total === 0) {
                                                        statusBadge = (
                                                            <span className="px-2.5 py-1 bg-red-50 text-danger rounded-full text-xs font-semibold inline-block">
                                                                Out of Stock
                                                            </span>
                                                        );
                                                    } else if (isLowInAnyBranch) {
                                                        statusBadge = (
                                                            <span className="px-2.5 py-1 bg-amber-50 text-warning rounded-full text-xs font-semibold inline-block">
                                                                Branch Low
                                                            </span>
                                                        );
                                                    }

                                                    return (
                                                        <tr key={prod._id} className="border-b border-border hover:bg-gray-50/50 transition">
                                                            <td className="py-4 px-4">
                                                                <p className="font-semibold text-text text-sm">{prod.nama_produk}</p>
                                                                <span className="text-xs text-text-secondary bg-gray-100 px-2 py-0.5 rounded-md mt-1 inline-block">
                                                                    {prod.kategori}
                                                                </span>
                                                            </td>
                                                            {branchStocks.map((bs) => (
                                                                <td key={bs.name} className={`py-4 px-4 text-center text-sm font-medium ${bs.stock <= minLimit ? "text-warning" : "text-text"}`}>
                                                                    {bs.stock}
                                                                </td>
                                                            ))}
                                                            <td className="py-4 px-4 text-center text-sm font-bold text-text">
                                                                {total}
                                                            </td>
                                                            <td className="py-4 px-4 text-center">
                                                                {statusBadge}
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

                        {/* 2. TRANSFER TAB */}
                        {activeTab === "transfer" && (
                            <div className="flex-1 flex flex-col md:flex-row gap-8 overflow-y-auto">
                                {/* Form */}
                                <form onSubmit={handleTransferSubmit} className="flex-1 max-w-xl space-y-5">
                                    <div>
                                        <h3 className="text-lg font-bold text-text flex items-center gap-2">
                                            <FiArrowRight className="text-primary" /> Kirim Transfer Barang
                                        </h3>
                                        <p className="text-text-secondary text-xs mt-1">
                                            Pindahkan stok barang fisik dari satu cabang ke cabang lainnya karena alasan operasional.
                                        </p>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-text">Pilih Produk</label>
                                        <select
                                            value={transferForm.produk_id}
                                            onChange={(e) => setTransferForm({ ...transferForm, produk_id: e.target.value })}
                                            className="w-full mt-2 border border-border rounded-xl px-4 py-3 bg-background outline-none text-text text-sm focus:border-primary transition"
                                            required
                                        >
                                            <option value="">-- Pilih Produk --</option>
                                            {products.map(p => (
                                                <option key={p._id} value={p._id}>
                                                    {p.nama_produk} (Total Stok: {p.stok_saat_ini})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium text-text">Cabang Asal (Source)</label>
                                            <select
                                                value={transferForm.dari_cabang}
                                                onChange={(e) => setTransferForm({ ...transferForm, dari_cabang: e.target.value })}
                                                className="w-full mt-2 border border-border rounded-xl px-4 py-3 bg-background outline-none text-text text-sm focus:border-primary transition"
                                                required
                                            >
                                                <option value="">-- Pilih Cabang --</option>
                                                {branches.map(b => (
                                                    <option key={b} value={b}>{b}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-text">Cabang Tujuan (Dest)</label>
                                            <select
                                                value={transferForm.ke_cabang}
                                                onChange={(e) => setTransferForm({ ...transferForm, ke_cabang: e.target.value })}
                                                className="w-full mt-2 border border-border rounded-xl px-4 py-3 bg-background outline-none text-text text-sm focus:border-primary transition"
                                                required
                                            >
                                                <option value="">-- Pilih Cabang --</option>
                                                {branches.map(b => (
                                                    <option key={b} value={b}>{b}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Preview Stok Source */}
                                    {transferForm.produk_id && transferForm.dari_cabang && (
                                        <div className="p-4 bg-cyan-50/50 border border-cyan-100 rounded-xl flex items-center justify-between">
                                            <span className="text-sm font-medium text-cyan-800">
                                                Stok saat ini di {transferForm.dari_cabang}:
                                            </span>
                                            <span className="text-lg font-bold text-primary">
                                                {getBranchStock(products.find(p => p._id === transferForm.produk_id), transferForm.dari_cabang)} unit
                                            </span>
                                        </div>
                                    )}

                                    <div>
                                        <label className="text-sm font-medium text-text">Jumlah Transfer (QTY)</label>
                                        <input
                                            type="number"
                                            min="1"
                                            placeholder="Masukkan jumlah barang..."
                                            value={transferForm.jumlah}
                                            onChange={(e) => setTransferForm({ ...transferForm, jumlah: e.target.value })}
                                            className="w-full mt-2 border border-border rounded-xl px-4 py-3 bg-background outline-none text-text text-sm focus:border-primary transition"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-text">Keterangan / Alasan Transfer</label>
                                        <textarea
                                            placeholder="Tulis alasan transfer, contoh: Stok Sleman kritis, Rebalancing stok..."
                                            value={transferForm.keterangan}
                                            onChange={(e) => setTransferForm({ ...transferForm, keterangan: e.target.value })}
                                            rows="3"
                                            className="w-full mt-2 border border-border rounded-xl px-4 py-3 bg-background outline-none text-text text-sm focus:border-primary transition"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full bg-primary hover:bg-primary-dark text-sidebar font-bold py-3.5 rounded-xl transition cursor-pointer shadow-md shadow-cyan-500/10"
                                    >
                                        Kirim Transfer Stok
                                    </button>
                                </form>

                                {/* Visual Guide / Info */}
                                <div className="flex-1 bg-gray-50 border border-border p-6 rounded-2xl max-w-sm self-start space-y-4">
                                    <h4 className="font-bold text-text flex items-center gap-2">
                                        <FiAlertCircle className="text-warning" /> Panduan Transfer
                                    </h4>
                                    <ul className="text-xs text-text-secondary space-y-2.5 list-disc pl-4 leading-relaxed">
                                        <li>Transfer stok akan memotong stok di <strong>Cabang Asal</strong> dan menambah stok di <strong>Cabang Tujuan</strong> secara langsung.</li>
                                        <li>Transaksi ini akan mencatatkan log mutasi permanen demi transparansi audit internal.</li>
                                        <li>Pastikan fisik barang benar-benar dikirimkan dan jarak tempuh antar cabang (±45 menit) diperhitungkan saat serah terima barang.</li>
                                        <li>Admin bertanggung jawab penuh atas validasi fisik barang saat transfer diproses.</li>
                                    </ul>
                                </div>
                            </div>
                        )}

                        {/* 3. ADJUSTMENT TAB */}
                        {activeTab === "adjust" && (
                            <div className="flex-1 flex flex-col md:flex-row gap-8 overflow-y-auto">
                                {/* Form */}
                                <form onSubmit={handleAdjustSubmit} className="flex-1 max-w-xl space-y-5">
                                    <div>
                                        <h3 className="text-lg font-bold text-text flex items-center gap-2">
                                            <FiSliders className="text-danger" /> Stock Opname / Penyesuaian Manual
                                        </h3>
                                        <p className="text-text-secondary text-xs mt-1">
                                            Sesuaikan stok di cabang tertentu agar cocok dengan stok fisik aktual (misal: karena penyusutan, barang rusak, atau hilang).
                                        </p>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-text">Pilih Produk</label>
                                        <select
                                            value={adjustForm.produk_id}
                                            onChange={(e) => setAdjustForm({ ...adjustForm, produk_id: e.target.value })}
                                            className="w-full mt-2 border border-border rounded-xl px-4 py-3 bg-background outline-none text-text text-sm focus:border-primary transition"
                                            required
                                        >
                                            <option value="">-- Pilih Produk --</option>
                                            {products.map(p => (
                                                <option key={p._id} value={p._id}>
                                                    {p.nama_produk} (Total Stok: {p.stok_saat_ini})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-text">Pilih Cabang</label>
                                        <select
                                            value={adjustForm.cabang}
                                            onChange={(e) => setAdjustForm({ ...adjustForm, cabang: e.target.value })}
                                            className="w-full mt-2 border border-border rounded-xl px-4 py-3 bg-background outline-none text-text text-sm focus:border-primary transition"
                                            required
                                        >
                                            <option value="">-- Pilih Cabang --</option>
                                            {branches.map(b => (
                                                <option key={b} value={b}>{b}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Preview Stok Sebelum */}
                                    {adjustForm.produk_id && adjustForm.cabang && (
                                        <div className="p-4 bg-red-50/50 border border-red-100 rounded-xl flex items-center justify-between">
                                            <span className="text-sm font-medium text-danger">
                                                Stok saat ini di {adjustForm.cabang}:
                                            </span>
                                            <span className="text-lg font-bold text-danger">
                                                {getBranchStock(products.find(p => p._id === adjustForm.produk_id), adjustForm.cabang)} unit
                                            </span>
                                        </div>
                                    )}

                                    <div>
                                        <label className="text-sm font-medium text-text">Stok Fisik Baru (QTY Aktual)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            placeholder="Masukkan jumlah stok aktual saat ini..."
                                            value={adjustForm.jumlah}
                                            onChange={(e) => setAdjustForm({ ...adjustForm, jumlah: e.target.value })}
                                            className="w-full mt-2 border border-border rounded-xl px-4 py-3 bg-background outline-none text-text text-sm focus:border-primary transition"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-text">Alasan Penyesuaian (Wajib)</label>
                                        <textarea
                                            placeholder="Contoh: Menyamakan stok fisik, Ditemukan barang rusak 2 unit, Selisih Pawon..."
                                            value={adjustForm.keterangan}
                                            onChange={(e) => setAdjustForm({ ...adjustForm, keterangan: e.target.value })}
                                            rows="3"
                                            className="w-full mt-2 border border-border rounded-xl px-4 py-3 bg-background outline-none text-text text-sm focus:border-primary transition"
                                            required
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full bg-danger hover:bg-red-600 text-white font-bold py-3.5 rounded-xl transition cursor-pointer shadow-md shadow-danger/10 border-none"
                                    >
                                        Simpan Penyesuaian Stok
                                    </button>
                                </form>

                                {/* Visual Guide / Info */}
                                <div className="flex-1 bg-red-50/30 border border-red-100 p-6 rounded-2xl max-w-sm self-start space-y-4">
                                    <h4 className="font-bold text-danger flex items-center gap-2">
                                        <FiAlertCircle /> Penting! Stock Opname
                                    </h4>
                                    <ul className="text-xs text-text-secondary space-y-2.5 list-disc pl-4 leading-relaxed">
                                        <li>Penyesuaian stok langsung menimpa data stok cabang di database.</li>
                                        <li>Harap lakukan <strong>Stock Opname Fisik</strong> (perhitungan manual di freezer) sebelum menginputkan data penyesuaian.</li>
                                        <li>Fitur ini krusial untuk melacak selisih transaksi harian senilai Rp 6.000 - Rp 20.000.</li>
                                        <li>Pastikan alasan yang dimasukkan jelas demi pertanggungjawaban kepada Owner.</li>
                                    </ul>
                                </div>
                            </div>
                        )}

                        {/* 4. AUDIT LOGS TAB */}
                        {activeTab === "logs" && (
                            <div className="flex-1 flex flex-col overflow-hidden">
                                <div className="flex items-center gap-2 mb-4 flex-shrink-0">
                                    <FiClock className="text-primary" size={20} />
                                    <h3 className="text-lg font-bold text-text">Audit Trail Pergerakan Stok</h3>
                                </div>

                                <div className="flex-1 overflow-y-auto">
                                    <table className="w-full border-collapse">
                                        <thead className="sticky top-0 bg-card z-10">
                                            <tr className="border-b border-border text-left">
                                                <th className="py-3 px-4 text-xs font-semibold text-text-secondary uppercase">Tanggal</th>
                                                <th className="py-3 px-4 text-xs font-semibold text-text-secondary uppercase">Produk</th>
                                                <th className="py-3 px-4 text-xs font-semibold text-text-secondary uppercase text-center">Tipe</th>
                                                <th className="py-3 px-4 text-xs font-semibold text-text-secondary uppercase text-center">Jumlah</th>
                                                <th className="py-3 px-4 text-xs font-semibold text-text-secondary uppercase">Detail Cabang</th>
                                                <th className="py-3 px-4 text-xs font-semibold text-text-secondary uppercase">Petugas (Admin)</th>
                                                <th className="py-3 px-4 text-xs font-semibold text-text-secondary uppercase">Alasan/Catatan</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {logs.length === 0 ? (
                                                <tr>
                                                    <td colSpan="7" className="text-center py-8 text-text-secondary text-sm">
                                                        Belum ada riwayat mutasi stok tercatat.
                                                    </td>
                                                </tr>
                                            ) : (
                                                logs.map((log) => {
                                                    const formattedDate = new Date(log.createdAt).toLocaleString("id-ID", {
                                                        day: "2-digit",
                                                        month: "short",
                                                        year: "numeric",
                                                        hour: "2-digit",
                                                        minute: "2-digit"
                                                    });

                                                    const isTransfer = log.tipe === "Transfer";

                                                    return (
                                                        <tr key={log._id} className="border-b border-border hover:bg-gray-50/50 transition">
                                                            <td className="py-3.5 px-4 text-xs text-text-secondary whitespace-nowrap">
                                                                {formattedDate}
                                                            </td>
                                                            <td className="py-3.5 px-4 text-sm font-semibold text-text">
                                                                {log.produk_id?.nama_produk || "Produk Dihapus"}
                                                            </td>
                                                            <td className="py-3.5 px-4 text-center">
                                                                <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${
                                                                    isTransfer 
                                                                        ? "bg-blue-50 text-blue-600" 
                                                                        : "bg-purple-50 text-purple-600"
                                                                }`}>
                                                                    {log.tipe}
                                                                </span>
                                                            </td>
                                                            <td className="py-3.5 px-4 text-center text-sm font-bold text-text">
                                                                {log.jumlah} Unit
                                                            </td>
                                                            <td className="py-3.5 px-4 text-xs text-text">
                                                                {isTransfer ? (
                                                                    <div className="flex items-center gap-1.5 font-medium">
                                                                        <span>{log.dari_cabang}</span>
                                                                        <FiArrowRight className="text-text-secondary" />
                                                                        <span className="text-primary">{log.ke_cabang}</span>
                                                                    </div>
                                                                ) : (
                                                                    <div className="font-semibold text-danger">
                                                                        Adjustment ({log.ke_cabang})
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td className="py-3.5 px-4 text-xs">
                                                                <p className="font-medium text-text">{log.user_id?.nama_lengkap || "System"}</p>
                                                                <p className="text-text-secondary text-[10px]">{log.user_id?.role || ""}</p>
                                                            </td>
                                                            <td className="py-3.5 px-4 text-xs text-text-secondary max-w-[200px] truncate" title={log.keterangan}>
                                                                {log.keterangan}
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

export default AdminBranchSync;
