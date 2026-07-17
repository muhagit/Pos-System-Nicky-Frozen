import {
    FiArrowLeft,
    FiSearch,
    FiEye,
    FiArrowUp,
    FiArrowDown,
} from "react-icons/fi";

import { useEffect, useState } from "react";
import API from "../../services/api";
import { useNavigate } from "react-router-dom";

const HistoryPage = () => {
    const navigate = useNavigate();
    const userInfo = JSON.parse(localStorage.getItem("userInfo"));
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTrx, setSelectedTrx] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterDate, setFilterDate] = useState("");
    const [filterCashier, setFilterCashier] = useState("");
    const [filterPayment, setFilterPayment] = useState("");
    const [filterCategory, setFilterCategory] = useState("");
    const [filterShift, setFilterShift] = useState("");
    const [sortBy, setSortBy] = useState("time"); // "time" or "amount"
    const [sortDirection, setSortDirection] = useState("desc"); // "asc" or "desc"
    const [dbCashiers, setDbCashiers] = useState([]);
    const [dbCategories, setDbCategories] = useState([]);
    const itemsPerPage = 8;

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, filterDate, filterCashier, filterPayment, filterCategory, filterShift, sortBy, sortDirection]);

    const filteredCashiers = dbCashiers.filter((user) => {
        if (user.role !== "Kasir") return false;
        if (userInfo?.role === "Owner") return true;
        return user.cabang === userInfo?.cabang;
    });

    const uniquePayments = [...new Set(transactions.map(t => t.payment).filter(Boolean))];
    const filteredTransactions = transactions.filter((trx) => {
        const matchSearch = trx.invoice.toLowerCase().includes(searchQuery.toLowerCase());
        
        let matchDate = true;
        if (filterDate) {
            const trxDateStr = new Date(trx.date).toISOString().split("T")[0];
            matchDate = trxDateStr === filterDate;
        }

        const matchCashier = filterCashier ? trx.customer === filterCashier : true;
        const matchPayment = filterPayment ? trx.payment === filterPayment : true;
        const matchCategory = filterCategory
            ? (trx.details || []).some(item => item.produk_id?.kategori === filterCategory)
            : true;
        const matchShift = filterShift ? trx.shift === filterShift : true;

        return matchSearch && matchDate && matchCashier && matchPayment && matchCategory && matchShift;
    });

    const sortedTransactions = [...filteredTransactions].sort((a, b) => {
        let valA, valB;
        if (sortBy === "time") {
            valA = new Date(a.date).getTime();
            valB = new Date(b.date).getTime();
        } else {
            valA = a.total || 0;
            valB = b.total || 0;
        }

        if (sortDirection === "asc") {
            return valA - valB;
        } else {
            return valB - valA;
        }
    });

    const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
    const getPageNumbers = () => {
        const pages = [];
        if (totalPages <= 3) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            if (currentPage === 1) {
                pages.push(1, 2, 3);
            } else if (currentPage === totalPages) {
                pages.push(totalPages - 2, totalPages - 1, totalPages);
            } else {
                pages.push(currentPage - 1, currentPage, currentPage + 1);
            }
        }
        return pages;
    };
    const paginatedTransactions = sortedTransactions.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const resetAllFilters = () => {
        setSearchQuery("");
        setFilterDate("");
        setFilterCashier("");
        setFilterPayment("");
        setFilterCategory("");
        setFilterShift("");
        setSortBy("time");
        setSortDirection("desc");
    };

    useEffect(() => {
        const fetchFiltersAndTransactions = async () => {
            try {
                const userInfo = JSON.parse(localStorage.getItem("userInfo"));
                const config = {
                    headers: { Authorization: `Bearer ${userInfo?.token}` },
                };
                
                const [trxRes, usersRes, catsRes] = await Promise.all([
                    API.get("/transactions", config),
                    API.get("/users", config),
                    API.get("/categories", config)
                ]);

                setTransactions(trxRes.data);
                setDbCashiers(usersRes.data);
                setDbCategories(catsRes.data);
            } catch (error) {
                console.log("Gagal mengambil data history/filter:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchFiltersAndTransactions();
    }, []);

    return (
        <div className="p-8 bg-background h-screen flex flex-col overflow-hidden font-poppins">

            {/* HEADER */}
            <div className="flex items-center justify-between">

                <div className="flex items-center gap-4">

                    <button
                        onClick={() => navigate("/kasir")}
                        className="bg-white p-3 rounded-2xl shadow-sm cursor-pointer hover:bg-gray-50 transition border-none"
                    >
                        <FiArrowLeft size={22} />
                    </button>

                    <div>

                        <h1 className="text-4xl font-bold text-text">
                            Transaction History
                        </h1>

                        <p className="text-text-secondary mt-1">
                            View all cashier transactions
                        </p>

                    </div>

                </div>

                {/* SEARCH */}
                <div className="bg-white rounded-2xl px-4 py-3 flex items-center gap-3 w-[320px]">

                    <FiSearch className="text-gray-400" />

                    <input
                        type="text"
                        placeholder="Search invoice..."
                        className="outline-none w-full"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />

                </div>

            </div>

            {/* FILTER BAR */}
            <div className="flex flex-wrap items-center gap-2 mt-6 flex-shrink-0 w-full">
                {/* Date Filter */}
                <div className="flex items-center gap-1.5 bg-white rounded-xl px-3 py-1.5 shadow-sm border border-gray-100 flex-shrink-0">
                    <span className="text-xs text-gray-400 font-semibold uppercase">Tanggal</span>
                    <input
                        type="date"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        className="outline-none border-none text-sm text-gray-700 font-medium cursor-pointer"
                    />
                    {filterDate && (
                        <button
                            onClick={() => setFilterDate("")}
                            className="text-gray-400 hover:text-red-500 text-xs font-bold border-none bg-transparent cursor-pointer"
                        >
                            ✕
                        </button>
                    )}
                </div>

                {/* Cashier Filter */}
                <div className="flex items-center gap-1.5 bg-white rounded-xl px-3 py-1.5 shadow-sm border border-gray-100 flex-shrink-0">
                    <span className="text-xs text-gray-400 font-semibold uppercase">Kasir</span>
                    <select
                        value={filterCashier}
                        onChange={(e) => setFilterCashier(e.target.value)}
                        className="outline-none border-none text-sm text-gray-700 font-medium bg-transparent cursor-pointer"
                    >
                        <option value="">Semua Kasir</option>
                        {filteredCashiers.map((u) => (
                            <option key={u._id} value={u.nama_lengkap}>{u.nama_lengkap}</option>
                        ))}
                    </select>
                </div>

                {/* Payment Method Filter */}
                <div className="flex items-center gap-1.5 bg-white rounded-xl px-3 py-1.5 shadow-sm border border-gray-100 flex-shrink-0">
                    <span className="text-xs text-gray-400 font-semibold uppercase">Metode</span>
                    <select
                        value={filterPayment}
                        onChange={(e) => setFilterPayment(e.target.value)}
                        className="outline-none border-none text-sm text-gray-700 font-medium bg-transparent cursor-pointer"
                    >
                        <option value="">Semua Metode</option>
                        {uniquePayments.map((payment) => (
                            <option key={payment} value={payment}>{payment}</option>
                        ))}
                    </select>
                </div>

                {/* Category Filter */}
                <div className="flex items-center gap-1.5 bg-white rounded-xl px-3 py-1.5 shadow-sm border border-gray-100 flex-shrink-0">
                    <span className="text-xs text-gray-400 font-semibold uppercase">Kategori</span>
                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="outline-none border-none text-sm text-gray-700 font-medium bg-transparent cursor-pointer"
                    >
                        <option value="">Semua Kategori</option>
                        {dbCategories.map((cat) => (
                            <option key={cat._id} value={cat.nama_kategori}>{cat.nama_kategori}</option>
                        ))}
                    </select>
                </div>

                {/* Shift Filter */}
                <div className="flex items-center gap-1.5 bg-white rounded-xl px-3 py-1.5 shadow-sm border border-gray-100 flex-shrink-0">
                    <span className="text-xs text-gray-400 font-semibold uppercase">Shift</span>
                    <select
                        value={filterShift}
                        onChange={(e) => setFilterShift(e.target.value)}
                        className="outline-none border-none text-sm text-gray-700 font-medium bg-transparent cursor-pointer"
                    >
                        <option value="">Semua Shift</option>
                        <option value="Shift 1">Shift 1</option>
                        <option value="Shift 2">Shift 2</option>
                    </select>
                </div>
                {/* Sort Order Selector */}
                <div className="flex items-center gap-1 bg-white rounded-xl px-3 py-1 shadow-sm border border-gray-100 flex-shrink-0">
                    <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Urutan</span>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="outline-none border-none text-sm text-gray-700 font-medium bg-transparent cursor-pointer"
                    >
                        <option value="time">Waktu (Date)</option>
                        <option value="amount">Nominal (Total)</option>
                    </select>
                    
                    <button
                        onClick={() => setSortDirection(prev => prev === "asc" ? "desc" : "asc")}
                        className="p-1 hover:bg-gray-50 rounded-lg transition text-gray-500 hover:text-primary cursor-pointer border-none bg-transparent flex items-center justify-center flex-shrink-0"
                        title={sortDirection === "asc" ? "Ascending" : "Descending"}
                    >
                        {sortDirection === "asc" ? <FiArrowUp size={16} /> : <FiArrowDown size={16} />}
                    </button>
                </div>
 
                {/* Reset Filters Button */}
                {(filterDate || filterCashier || filterPayment || filterCategory || filterShift || sortBy !== "time" || sortDirection !== "desc" || searchQuery) && (
                    <button
                        onClick={resetAllFilters}
                        className="text-sm font-semibold text-red-500 hover:text-red-600 transition bg-transparent border-none cursor-pointer flex-shrink-0"
                    >
                        Reset Filter
                    </button>
                )}
            </div>

            {/* TABLE */}
            <div className="bg-white rounded-3xl p-6 mt-8 flex-1 flex flex-col justify-between overflow-hidden shadow-sm">

                {loading ? (
                    <p className="text-center py-10">Loading transactions...</p>
                ) : (
                    <>
                        <div className="overflow-y-auto flex-1 pr-1 custom-scrollbar">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left border-b border-border">
                                        <th className="pb-4">Invoice</th>
                                        <th className="pb-4">Kasir</th>
                                        <th className="pb-4">Shift</th>
                                        <th className="pb-4">Payment</th>
                                        <th className="pb-4">Date</th>
                                        <th className="pb-4">Total</th>
                                        <th className="pb-4">Status</th>
                                        <th className="pb-4 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedTransactions.map((trx) => (
                                        <tr
                                            key={trx.id}
                                            className="border-b border-border hover:bg-gray-50 transition"
                                        >
                                            <td className="py-4 font-semibold">{trx.invoice}</td>
                                            <td>{trx.customer}</td>
                                            <td>
                                                <span className={trx.shift ? "px-2.5 py-1 bg-cyan-50 text-cyan-600 rounded-xl text-xs font-bold" : "text-gray-400 text-xs font-medium"}>
                                                    {trx.shift || "-"}
                                                </span>
                                            </td>
                                            <td>{trx.payment}</td>
                                            <td>{new Date(trx.date).toLocaleString("id-ID")}</td>
                                            <td className="font-semibold text-primary">
                                                Rp {trx.total.toLocaleString()}
                                            </td>
                                            <td>
                                                <span
                                                    className={`px-4 py-2 rounded-xl text-sm font-medium ${
                                                        trx.status === "Success"
                                                            ? "bg-green-100 text-green-600"
                                                            : "bg-yellow-100 text-yellow-600"
                                                    }`}
                                                >
                                                    {trx.status}
                                                </span>
                                            </td>
                                            <td className="text-center">
                                                <button
                                                    onClick={() => setSelectedTrx(trx)}
                                                    className="bg-primary text-white p-3 rounded-xl hover:bg-primary-dark transition cursor-pointer border-none"
                                                >
                                                    <FiEye />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100 flex-shrink-0">
                                <span className="text-sm text-gray-500 font-medium">
                                    Showing {filteredTransactions.length === 0 ? 0 : ((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredTransactions.length)} of {filteredTransactions.length} entries
                                </span>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                        className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 bg-white hover:bg-gray-50 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-none shadow-sm"
                                    >
                                        Previous
                                    </button>
                                    {getPageNumbers().map(page => {
                                        return (
                                            <button
                                                key={page}
                                                onClick={() => setCurrentPage(page)}
                                                className={`w-9 h-9 rounded-xl text-sm font-bold transition cursor-pointer border-none shadow-sm flex items-center justify-center ${currentPage === page ? "bg-primary text-white" : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"}`}
                                            >
                                                {page}
                                            </button>
                                        );
                                    })}
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                        className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 bg-white hover:bg-gray-50 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-none shadow-sm"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}

            </div>

            {/* Receipt Modal Overlay */}
            {selectedTrx && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-poppins">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 relative flex flex-col max-h-[90vh]">
                        {/* Receipt Header */}
                        <div className="text-center border-b border-dashed border-gray-200 pb-4">
                            <h2 className="text-2xl font-bold text-gray-800">Nicky Frozen</h2>
                            <p className="text-xs text-gray-400 mt-1">Sistem Point of Sale (POS)</p>
                            <p className="text-sm font-semibold text-primary mt-2">#{selectedTrx.invoice}</p>
                        </div>

                        {/* Receipt Info */}
                        <div className="py-4 space-y-2 text-xs text-gray-500 border-b border-dashed border-gray-200">
                            <div className="flex justify-between">
                                <span>Tanggal</span>
                                <span className="font-semibold text-gray-700">
                                    {new Date(selectedTrx.date).toLocaleString("id-ID")}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Kasir</span>
                                <span className="font-semibold text-gray-700">{selectedTrx.customer}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Shift</span>
                                <span className="font-semibold text-gray-700">{selectedTrx.shift || "-"}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Metode Pembayaran</span>
                                <span className="font-semibold text-gray-700">{selectedTrx.payment}</span>
                            </div>
                        </div>

                        {/* Receipt Items */}
                        <div className="flex-1 overflow-y-auto py-4 space-y-3 max-h-[250px] my-2 pr-1">
                            {selectedTrx.details && selectedTrx.details.length > 0 ? (
                                selectedTrx.details.map((item, idx) => (
                                    <div key={idx} className="flex justify-between text-sm">
                                        <div className="max-w-[240px] truncate pr-2">
                                            <p className="font-medium text-gray-800">
                                                {item.produk_id?.nama_produk || "Produk Tidak Diketahui"}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-0.5">
                                                {item.kuantitas} x Rp {item.harga_satuan.toLocaleString("id-ID")}
                                            </p>
                                        </div>
                                        <span className="font-semibold text-gray-800">
                                            Rp {(item.subtotal || item.kuantitas * item.harga_satuan).toLocaleString("id-ID")}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-xs text-gray-400 py-4">Tidak ada rincian produk.</p>
                            )}
                        </div>

                        {/* Receipt Total */}
                        <div className="border-t border-dashed border-gray-200 pt-4 mt-auto">
                            <div className="flex justify-between text-lg font-bold text-gray-800">
                                <span>Total Belanja</span>
                                <span className="text-primary">Rp {selectedTrx.total.toLocaleString("id-ID")}</span>
                            </div>
                        </div>

                        {/* Receipt Footer Buttons */}
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => window.print()}
                                className="flex-1 py-3 bg-gray-50 text-gray-700 hover:bg-gray-100 font-semibold rounded-2xl transition border-none cursor-pointer text-sm"
                            >
                                Cetak
                            </button>
                            <button
                                onClick={() => setSelectedTrx(null)}
                                className="flex-1 py-3 bg-primary text-white hover:bg-primary-dark font-semibold rounded-2xl transition border-none cursor-pointer text-sm"
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

export default HistoryPage;