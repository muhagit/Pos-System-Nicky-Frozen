import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import {
    FiFileText,
    FiLock,
    FiAlertCircle,
    FiRefreshCw,
    FiX,
    FiClock,
    FiDollarSign,
    FiCreditCard,
    FiChevronDown,
    FiChevronUp,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";

const ReportPage = () => {
    const navigate = useNavigate();
    const userInfo = JSON.parse(localStorage.getItem("userInfo"));
    const config = { headers: { Authorization: `Bearer ${userInfo?.token}` } };

    const [dailyReports, setDailyReports] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isClosingModalOpen, setIsClosingModalOpen] = useState(false);

    // Shift data from API
    const [todayShifts, setTodayShifts] = useState([]);
    const [activeShift, setActiveShift] = useState(null);

    // Closing form states
    const [physicalCashInput, setPhysicalCashInput] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Detail expansion
    const [expandedReportId, setExpandedReportId] = useState(null);
    const [detailData, setDetailData] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);

    // Time check
    const [currentHour, setCurrentHour] = useState(new Date().getHours());
    useEffect(() => {
        const interval = setInterval(() => setCurrentHour(new Date().getHours()), 60000);
        return () => clearInterval(interval);
    }, []);
    // Bypass restriction for testing: set isTutupBukuAllowed to true directly
    const isTutupBukuAllowed = true; // currentHour >= 21;

    const formatRupiah = (number) =>
        new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(number || 0);

    // Fetch active shift & today's shift records
    const fetchShiftData = async () => {
        try {
            const { data } = await axios.get("http://localhost:5000/api/reports/active-shift", config);
            setActiveShift(data.activeShift);
            setTodayShifts(data.todayShifts || []);
        } catch (error) {
            console.error("Gagal mengambil data shift:", error);
        }
    };

    // Fetch tutup buku history
    const fetchReports = async () => {
        setIsLoading(true);
        try {
            const { data } = await axios.get("http://localhost:5000/api/reports", config);
            setDailyReports(data);
        } catch (error) {
            console.error("Gagal mengambil riwayat laporan:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchShiftData();
        fetchReports();
    }, []);

    // Fetch detail for a specific report date
    const handleToggleDetail = async (reportId, tanggal) => {
        if (expandedReportId === reportId) {
            setExpandedReportId(null);
            setDetailData(null);
            return;
        }

        setExpandedReportId(reportId);
        setDetailLoading(true);
        try {
            const dateStr = new Date(tanggal).toISOString().slice(0, 10);
            const { data } = await axios.get(`http://localhost:5000/api/reports/detail/${dateStr}`, config);
            setDetailData(data);
        } catch (error) {
            console.error("Gagal mengambil detail:", error);
        } finally {
            setDetailLoading(false);
        }
    };

    // Open tutup buku modal
    const handleOpenClosingModal = () => {
        if (!isTutupBukuAllowed) {
            Swal.fire({ icon: "warning", title: "Belum Waktunya", text: "Tutup buku hanya bisa dilakukan setelah pukul 21:00." });
            return;
        }
        // Check that all shifts are closed
        if (activeShift) {
            Swal.fire({ icon: "warning", title: "Shift Masih Aktif", text: "Akhiri shift terlebih dahulu sebelum melakukan tutup buku." });
            return;
        }
        const closedShifts = todayShifts.filter(s => s.status === "Selesai");
        if (closedShifts.length === 0) {
            Swal.fire({ icon: "warning", title: "Tidak Ada Data", text: "Belum ada shift yang selesai hari ini." });
            return;
        }
        setIsClosingModalOpen(true);
    };

    // Submit tutup buku
    const handleConfirmClosing = async () => {
        const physicalCash = Number(physicalCashInput);
        if (physicalCashInput === "" || isNaN(physicalCash) || physicalCash < 0) {
            Swal.fire("Peringatan", "Masukkan uang fisik kasir yang valid!", "warning");
            return;
        }

        setIsSubmitting(true);
        try {
            await axios.post("http://localhost:5000/api/reports/tutup-buku", { total_kas_fisik: physicalCash }, config);

            Swal.fire({
                icon: "success",
                title: "Tutup Buku Berhasil!",
                text: "Laporan harian telah dikunci. Anda akan dialihkan keluar sistem.",
                confirmButtonColor: "#0891b2",
            }).then(() => {
                localStorage.removeItem("userInfo");
                navigate("/");
            });
        } catch (error) {
            Swal.fire("Gagal!", error.response?.data?.message || "Gagal menyimpan laporan tutup buku.", "error");
        } finally {
            setIsSubmitting(false);
            setIsClosingModalOpen(false);
        }
    };

    // Compute modal values from today's closed shifts
    const closedShifts = todayShifts.filter(s => s.status === "Selesai");
    const shift1Record = closedShifts.find(s => s.shift === "Shift 1");
    const shift2Record = closedShifts.find(s => s.shift === "Shift 2");
    const modalAwal = shift1Record?.modal_awal || 0;
    const totalDayCash = closedShifts.reduce((sum, s) => sum + (s.total_cash || 0), 0);
    const totalDayDigital = closedShifts.reduce((sum, s) => sum + (s.total_digital || 0), 0);
    const totalDayRevenue = totalDayCash + totalDayDigital;
    const expectedDrawerCash = modalAwal + totalDayCash;
    const physicalCashVal = Number(physicalCashInput) || 0;
    const currentVariance = physicalCashVal - expectedDrawerCash;

    return (
        <div className="p-8 bg-background h-screen overflow-y-auto font-poppins text-left">
            {/* HEADER */}
            <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-gray-100 shadow-sm mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-800 flex items-center gap-2">
                        <FiFileText className="text-primary" /> Laporan & Tutup Buku
                    </h1>
                    <p className="text-text-secondary text-sm mt-1">
                        Performa penjualan harian per shift & audit kas harian.
                    </p>
                </div>
                <button
                    onClick={handleOpenClosingModal}
                    disabled={!isTutupBukuAllowed}
                    className={`font-bold px-6 py-3.5 rounded-2xl transition flex items-center gap-2 cursor-pointer border-none ${
                        isTutupBukuAllowed
                            ? "bg-primary hover:bg-primary-dark text-white shadow-lg shadow-cyan-500/20"
                            : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    }`}
                >
                    <FiLock size={18} /> Tutup Buku Harian
                </button>
            </div>

            {/* TIME RESTRICTION */}
            {!isTutupBukuAllowed && (
                <div className="bg-amber-50 border border-amber-200/50 p-4 rounded-2xl mb-6 flex items-center gap-3 text-amber-700 text-sm font-medium">
                    <FiClock size={18} />
                    Tutup buku tersedia setelah pukul <b>21:00</b>. Saat ini: <b>{new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</b>
                </div>
            )}

            {/* TODAY'S SHIFT PERFORMANCE */}
            <div className="grid grid-cols-2 gap-6 mb-8">
                {/* Shift 1 */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><FiClock size={20} /></div>
                        <div>
                            <h3 className="font-bold text-gray-800 text-lg">Shift 1</h3>
                            <p className="text-xs text-gray-400">08:00 - 15:00 • {shift1Record ? (
                                <span className="text-emerald-600 font-bold">Selesai</span>
                            ) : activeShift?.shift === "Shift 1" ? (
                                <span className="text-blue-600 font-bold">Aktif</span>
                            ) : (
                                <span className="text-gray-400">Belum dimulai</span>
                            )}</p>
                        </div>
                    </div>
                    {shift1Record ? (
                        <div className="space-y-3">
                            <div className="flex justify-between"><span className="text-xs font-bold text-gray-500 uppercase">Total Penjualan</span><span className="text-lg font-extrabold text-gray-800">{formatRupiah(shift1Record.total_pendapatan)}</span></div>
                            <div className="flex justify-between"><span className="text-xs text-gray-400 flex items-center gap-1"><FiDollarSign size={12}/> Tunai</span><span className="font-bold text-emerald-600 text-sm">{formatRupiah(shift1Record.total_cash)}</span></div>
                            <div className="flex justify-between"><span className="text-xs text-gray-400 flex items-center gap-1"><FiCreditCard size={12}/> Digital</span><span className="font-bold text-blue-600 text-sm">{formatRupiah(shift1Record.total_digital)}</span></div>
                            <hr className="border-gray-100"/>
                            <div className="flex justify-between"><span className="text-xs text-gray-400">Kasir</span><span className="font-bold text-gray-700 text-sm">{shift1Record.user_id?.nama_lengkap || "-"}</span></div>
                            <div className="flex justify-between"><span className="text-xs text-gray-400">Transaksi</span><span className="font-bold text-gray-700 text-sm">{shift1Record.jumlah_transaksi} Trx</span></div>
                        </div>
                    ) : (
                        <p className="text-sm text-gray-400 py-4 text-center">Belum ada data shift 1 hari ini.</p>
                    )}
                </div>

                {/* Shift 2 */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl"><FiClock size={20} /></div>
                        <div>
                            <h3 className="font-bold text-gray-800 text-lg">Shift 2</h3>
                            <p className="text-xs text-gray-400">15:00 - 22:00 • {shift2Record ? (
                                <span className="text-emerald-600 font-bold">Selesai</span>
                            ) : activeShift?.shift === "Shift 2" ? (
                                <span className="text-blue-600 font-bold">Aktif</span>
                            ) : (
                                <span className="text-gray-400">Belum dimulai</span>
                            )}</p>
                        </div>
                    </div>
                    {shift2Record ? (
                        <div className="space-y-3">
                            <div className="flex justify-between"><span className="text-xs font-bold text-gray-500 uppercase">Total Penjualan</span><span className="text-lg font-extrabold text-gray-800">{formatRupiah(shift2Record.total_pendapatan)}</span></div>
                            <div className="flex justify-between"><span className="text-xs text-gray-400 flex items-center gap-1"><FiDollarSign size={12}/> Tunai</span><span className="font-bold text-emerald-600 text-sm">{formatRupiah(shift2Record.total_cash)}</span></div>
                            <div className="flex justify-between"><span className="text-xs text-gray-400 flex items-center gap-1"><FiCreditCard size={12}/> Digital</span><span className="font-bold text-blue-600 text-sm">{formatRupiah(shift2Record.total_digital)}</span></div>
                            <hr className="border-gray-100"/>
                            <div className="flex justify-between"><span className="text-xs text-gray-400">Kasir</span><span className="font-bold text-gray-700 text-sm">{shift2Record.user_id?.nama_lengkap || "-"}</span></div>
                            <div className="flex justify-between"><span className="text-xs text-gray-400">Transaksi</span><span className="font-bold text-gray-700 text-sm">{shift2Record.jumlah_transaksi} Trx</span></div>
                        </div>
                    ) : (
                        <p className="text-sm text-gray-400 py-4 text-center">Belum ada data shift 2 hari ini.</p>
                    )}
                </div>
            </div>

            {/* DAILY TOTAL SUMMARY */}
            {closedShifts.length > 0 && (
                <div className="bg-gradient-to-r from-cyan-600 to-teal-600 rounded-3xl p-6 mb-8 text-white shadow-lg shadow-cyan-600/20">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-cyan-100">Total Hari Ini (Gabungan Shift)</p>
                            <h2 className="text-3xl font-extrabold mt-1">{formatRupiah(totalDayRevenue)}</h2>
                        </div>
                        <div className="flex gap-6">
                            <div className="text-right">
                                <p className="text-[10px] uppercase text-cyan-200 font-bold">Tunai</p>
                                <p className="text-lg font-bold">{formatRupiah(totalDayCash)}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] uppercase text-cyan-200 font-bold">Digital</p>
                                <p className="text-lg font-bold">{formatRupiah(totalDayDigital)}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] uppercase text-cyan-200 font-bold">Modal Awal</p>
                                <p className="text-lg font-bold">{formatRupiah(modalAwal)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TUTUP BUKU HISTORY TABLE */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Riwayat Tutup Buku</h2>
                        <p className="text-text-secondary text-sm mt-1">Klik baris untuk melihat detail transaksi</p>
                    </div>
                    <button onClick={() => { fetchReports(); fetchShiftData(); }} disabled={isLoading}
                        className="p-3 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 text-gray-500 transition cursor-pointer">
                        <FiRefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-100 text-gray-500 text-xs uppercase font-bold tracking-wider">
                                <th className="pb-4 w-8"></th>
                                <th className="pb-4">Tanggal</th>
                                <th className="pb-4">Pemeriksa</th>
                                <th className="pb-4 text-right">Modal</th>
                                <th className="pb-4 text-right">Cash</th>
                                <th className="pb-4 text-right">Digital</th>
                                <th className="pb-4 text-right">Total</th>
                                <th className="pb-4 text-right">Fisik Kas</th>
                                <th className="pb-4 text-right">Selisih</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr><td colSpan="9" className="py-8 text-center text-text-secondary text-sm">Memuat...</td></tr>
                            ) : dailyReports.length === 0 ? (
                                <tr><td colSpan="9" className="py-8 text-center text-text-secondary text-sm">Belum ada riwayat tutup buku.</td></tr>
                            ) : (
                                dailyReports.map((rep) => {
                                    const formattedDate = new Date(rep.tanggal_laporan).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
                                    const isExpanded = expandedReportId === rep._id;

                                    return (
                                        <React.Fragment key={rep._id}>
                                            <tr onClick={() => handleToggleDetail(rep._id, rep.tanggal_laporan)}
                                                className="hover:bg-gray-50/50 transition text-sm cursor-pointer">
                                                <td className="py-4 text-gray-400">{isExpanded ? <FiChevronUp size={16}/> : <FiChevronDown size={16}/>}</td>
                                                <td className="py-4 font-medium text-gray-800">{formattedDate}</td>
                                                <td className="py-4 font-semibold text-gray-800">{rep.diperiksa_oleh?.nama_lengkap || "System"}</td>
                                                <td className="py-4 text-right text-gray-600">{formatRupiah(rep.modal_awal)}</td>
                                                <td className="py-4 text-right text-emerald-600 font-bold">{formatRupiah(rep.total_pendapatan_cash)}</td>
                                                <td className="py-4 text-right text-blue-600 font-bold">{formatRupiah(rep.total_pendapatan_digital)}</td>
                                                <td className="py-4 text-right font-bold text-gray-800">{formatRupiah(rep.total_pendapatan_sistem)}</td>
                                                <td className="py-4 text-right font-bold text-gray-800">{formatRupiah(rep.total_kas_fisik)}</td>
                                                <td className={`py-4 text-right font-extrabold ${rep.selisih < 0 ? "text-red-500" : rep.selisih > 0 ? "text-amber-500" : "text-emerald-500"}`}>
                                                    {rep.selisih > 0 ? "+" : ""}{formatRupiah(rep.selisih)}
                                                </td>
                                            </tr>

                                            {/* DETAIL ROW */}
                                            {isExpanded && (
                                                <tr>
                                                    <td colSpan="9" className="bg-gray-50 p-6">
                                                        {detailLoading ? (
                                                            <p className="text-sm text-gray-400 text-center">Memuat detail...</p>
                                                        ) : detailData ? (
                                                            <div className="space-y-4">
                                                                {/* Shift Breakdown */}
                                                                <h4 className="font-bold text-gray-700 text-sm uppercase tracking-wider">Breakdown Per Shift</h4>
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    {detailData.shifts.map(s => (
                                                                        <div key={s._id} className="bg-white p-4 rounded-2xl border border-gray-100">
                                                                            <div className="flex justify-between items-center mb-2">
                                                                                <span className="font-bold text-gray-800">{s.shift}</span>
                                                                                <span className="text-xs text-gray-400">{s.user_id?.nama_lengkap}</span>
                                                                            </div>
                                                                            <div className="space-y-1 text-sm">
                                                                                <div className="flex justify-between"><span className="text-gray-400">Tunai</span><span className="font-bold text-emerald-600">{formatRupiah(s.total_cash)}</span></div>
                                                                                <div className="flex justify-between"><span className="text-gray-400">Digital</span><span className="font-bold text-blue-600">{formatRupiah(s.total_digital)}</span></div>
                                                                                <div className="flex justify-between"><span className="text-gray-400">Total</span><span className="font-extrabold text-gray-800">{formatRupiah(s.total_pendapatan)}</span></div>
                                                                                <div className="flex justify-between"><span className="text-gray-400">Transaksi</span><span className="font-bold">{s.jumlah_transaksi} Trx</span></div>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>

                                                                {/* Transaction List */}
                                                                <h4 className="font-bold text-gray-700 text-sm uppercase tracking-wider mt-4">Daftar Transaksi ({detailData.transactions.length})</h4>
                                                                <div className="max-h-[300px] overflow-y-auto">
                                                                    <table className="w-full text-sm">
                                                                        <thead>
                                                                            <tr className="border-b border-gray-200 text-gray-500 text-xs uppercase">
                                                                                <th className="pb-2 text-left">Invoice</th>
                                                                                <th className="pb-2 text-left">Kasir</th>
                                                                                <th className="pb-2 text-left">Pembayaran</th>
                                                                                <th className="pb-2 text-left">Jam</th>
                                                                                <th className="pb-2 text-right">Total</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody className="divide-y divide-gray-100">
                                                                            {detailData.transactions.map(tx => (
                                                                                <tr key={tx._id} className="text-xs">
                                                                                    <td className="py-2 font-semibold text-gray-800">{tx.invoice}</td>
                                                                                    <td className="py-2 text-gray-600">{tx.user_id?.nama_lengkap || "-"}</td>
                                                                                    <td className="py-2">
                                                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${tx.metode_pembayaran === "Cash" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"}`}>
                                                                                            {tx.metode_pembayaran}
                                                                                        </span>
                                                                                    </td>
                                                                                    <td className="py-2 text-gray-400">{new Date(tx.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</td>
                                                                                    <td className="py-2 text-right font-bold text-primary">{formatRupiah(tx.total_pembayaran)}</td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            </div>
                                                        ) : null}
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* TUTUP BUKU MODAL */}
            {isClosingModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg mx-4 flex flex-col max-h-[90vh] border border-gray-100">
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-primary/10 text-primary rounded-xl"><FiLock size={20} /></div>
                                <div>
                                    <h3 className="font-extrabold text-gray-800 text-lg">Tutup Buku Harian</h3>
                                    <p className="text-xs text-gray-500 mt-0.5">Cabang: <span className="font-bold text-primary">{userInfo?.cabang}</span> • {new Date().toLocaleDateString("id-ID")}</p>
                                </div>
                            </div>
                            <button onClick={() => setIsClosingModalOpen(false)}
                                className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-600 transition border-none bg-transparent cursor-pointer">
                                <FiX size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {/* Combined revenue summary */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-gray-50 border border-gray-100 p-3 rounded-2xl">
                                    <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500">Total Hari Ini</span>
                                    <h4 className="text-sm font-bold text-gray-800 mt-1">{formatRupiah(totalDayRevenue)}</h4>
                                </div>
                                <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-2xl">
                                    <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600">Tunai</span>
                                    <h4 className="text-sm font-bold text-emerald-700 mt-1">{formatRupiah(totalDayCash)}</h4>
                                </div>
                                <div className="bg-blue-50 border border-blue-100 p-3 rounded-2xl">
                                    <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600">Digital (E-Wallet)</span>
                                    <h4 className="text-sm font-bold text-blue-700 mt-1">{formatRupiah(totalDayDigital)}</h4>
                                </div>
                            </div>

                            {/* Per-shift breakdown */}
                            <div className="grid grid-cols-2 gap-3">
                                {closedShifts.map(s => (
                                    <div key={s._id} className="bg-gray-50 border border-gray-100 p-3 rounded-2xl">
                                        <span className="text-[10px] uppercase font-bold text-gray-500">{s.shift}</span>
                                        <p className="text-sm font-bold text-gray-800 mt-1">{formatRupiah(s.total_pendapatan)}</p>
                                        <p className="text-[10px] text-gray-400">{s.user_id?.nama_lengkap} • {s.jumlah_transaksi} Trx</p>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-blue-50 border border-blue-100 p-3 rounded-2xl text-xs text-blue-700 font-medium">
                                Pendapatan digital <b>({formatRupiah(totalDayDigital)})</b> tercatat otomatis di sistem dan tidak dihitung ke selisih kas laci fisik.
                            </div>

                            {/* Expected drawer */}
                            <div className="bg-gray-50 border border-gray-100 p-4 rounded-2xl">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Ekspektasi Uang Fisik Di Laci</span>
                                <h3 className="text-2xl font-extrabold text-primary mt-1">{formatRupiah(expectedDrawerCash)}</h3>
                                <p className="text-[10px] text-gray-400 mt-0.5">= Modal Awal ({formatRupiah(modalAwal)}) + Cash Sales ({formatRupiah(totalDayCash)})</p>
                            </div>

                            {/* Physical cash input */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Total Uang Fisik Di Kasir (Rp)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">Rp</span>
                                    <input type="number" placeholder="Hitung uang laci dan masukkan nominal" value={physicalCashInput}
                                        onChange={(e) => setPhysicalCashInput(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 outline-none text-sm font-semibold focus:border-primary focus:bg-white transition" />
                                </div>
                            </div>

                            {/* Live variance */}
                            <div className="bg-gray-50 border border-gray-100 p-4 rounded-2xl flex items-center justify-between">
                                <div>
                                    <span className="text-xs font-bold text-gray-500">Live Selisih Kas</span>
                                    <h4 className={`text-lg font-bold mt-1 ${currentVariance < 0 ? "text-red-500" : currentVariance > 0 ? "text-amber-500" : "text-emerald-500"}`}>
                                        {currentVariance > 0 ? "+" : ""}{formatRupiah(currentVariance)}
                                    </h4>
                                </div>
                                <span className={`text-xs font-bold px-3 py-1 rounded-full ${currentVariance < 0 ? "bg-red-50 text-red-600" : currentVariance > 0 ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
                                    {currentVariance < 0 ? "Kurang" : currentVariance > 0 ? "Lebih" : "Balance"}
                                </span>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-gray-100 flex items-center justify-between bg-gray-50/50 rounded-b-3xl">
                            <button onClick={() => setIsClosingModalOpen(false)} className="px-5 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-100 transition cursor-pointer text-sm bg-white">Batal</button>
                            <button onClick={handleConfirmClosing} disabled={isSubmitting}
                                className="px-6 py-3 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold transition shadow-lg shadow-cyan-500/20 cursor-pointer border-none text-sm flex items-center gap-1.5">
                                {isSubmitting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <><FiLock size={16}/> Simpan & Kunci</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReportPage;
