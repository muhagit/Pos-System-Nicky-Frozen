import React, { useState, useEffect } from "react";
import api from "../../utils/api";
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
    FiPrinter,
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

    // Detail Modal states
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [detailData, setDetailData] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);

    // Today's shift transactions detail modal state
    const [todayShiftDetail, setTodayShiftDetail] = useState(null); // { shiftName: "Shift 1", transactions: [], loading: false }

    // Time check
    const [currentHour, setCurrentHour] = useState(new Date().getHours());
    useEffect(() => {
        const interval = setInterval(() => setCurrentHour(new Date().getHours()), 60000);
        return () => clearInterval(interval);
    }, []);
    // Bypass restriction for testing: set isTutupBukuAllowed to true directly
    const isTutupBukuAllowed = true; // currentHour >= 21;

    const todayStr = new Date().toISOString().slice(0, 10);
    const hasClosedToday = dailyReports.some(
        (rep) => {
            const repBranch = rep.cabang;
            const userBranch = userInfo?.cabang || "Pusat";
            return repBranch === userBranch && new Date(rep.tanggal_laporan).toISOString().slice(0, 10) === todayStr;
        }
    );

    const formatRupiah = (number) =>
        new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(number || 0);

    // Fetch active shift & today's shift records
    const fetchShiftData = async () => {
        try {
            const { data } = await api.get("/reports/active-shift", config);
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
            const { data } = await api.get("/reports", config);
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

    // Fetch detail for a specific report date (modal)
    const handleShowReportDetail = async (rep) => {
        setIsDetailModalOpen(true);
        setDetailLoading(true);
        setDetailData(null);
        try {
            const dateStr = new Date(rep.tanggal_laporan).toISOString().slice(0, 10);
            const { data } = await api.get(`/reports/detail/${dateStr}`, config);
            setDetailData(data);
        } catch (error) {
            console.error("Gagal mengambil detail:", error);
            Swal.fire("Gagal", "Gagal mengambil detail laporan.", "error");
            setIsDetailModalOpen(false);
        } finally {
            setDetailLoading(false);
        }
    };

    // Fetch and show today's shift transaction details
    const handleShowTodayShiftDetail = async (shiftName) => {
        setTodayShiftDetail({ shiftName, transactions: [], loading: true });
        try {
            const todayStr = new Date().toISOString().slice(0, 10);
            const { data } = await api.get(`/reports/detail/${todayStr}`, config);
            const filteredTx = (data.transactions || []).filter(tx => tx.shift === shiftName);
            setTodayShiftDetail({ shiftName, transactions: filteredTx, loading: false });
        } catch (error) {
            console.error("Gagal mengambil detail transaksi shift:", error);
            Swal.fire("Gagal", "Gagal mengambil detail transaksi shift hari ini.", "error");
            setTodayShiftDetail(null);
        }
    };

    // Print closing book report helper
    const handlePrintReport = async (rep, alreadyLoadedDetail = null) => {
        let printDetail = alreadyLoadedDetail;
        if (!printDetail) {
            Swal.fire({
                title: "Menyiapkan Dokumen...",
                html: "Mohon tunggu sebentar.",
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });
            try {
                const dateStr = new Date(rep.tanggal_laporan).toISOString().slice(0, 10);
                const { data } = await api.get(`/reports/detail/${dateStr}`, config);
                printDetail = data;
                Swal.close();
            } catch (error) {
                console.error("Gagal mengambil detail untuk cetak:", error);
                Swal.fire("Gagal", "Gagal mengambil data laporan.", "error");
                return;
            }
        }

        const formattedDate = new Date(rep.tanggal_laporan).toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "long",
            year: "numeric"
        });

        // Group transactions by shift
        const shift1Tx = (printDetail.transactions || []).filter(tx => tx.shift === "Shift 1");
        const shift2Tx = (printDetail.transactions || []).filter(tx => tx.shift === "Shift 2");
        const otherTx = (printDetail.transactions || []).filter(tx => tx.shift !== "Shift 1" && tx.shift !== "Shift 2");

        const renderTxRows = (txList) => {
            if (txList.length === 0) return `<tr><td colspan="5" style="text-align: center; color: #9ca3af; padding: 8px;">Tidak ada transaksi</td></tr>`;
            return txList.map(tx => `
                <tr style="border-bottom: 1px solid #f3f4f6; font-size: 11px;">
                    <td style="padding: 6px 0; font-family: monospace; font-weight: bold;">${tx.invoice}</td>
                    <td style="padding: 6px 0;">${tx.user_id?.nama_lengkap || "-"}</td>
                    <td style="padding: 6px 0;">${tx.metode_pembayaran}</td>
                    <td style="padding: 6px 0; color: #6b7280;">${new Date(tx.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</td>
                    <td style="padding: 6px 0; text-align: right; font-weight: bold;">Rp ${(tx.total_pembayaran || 0).toLocaleString("id-ID")}</td>
                </tr>
            `).join("");
        };

        const printWindow = window.open("", "_blank");
        printWindow.document.write(`
            <html>
                <head>
                    <title>Laporan Tutup Buku - ${formattedDate}</title>
                    <style>
                        body { font-family: 'Courier New', Courier, monospace; color: #1f2937; padding: 20px; font-size: 12px; line-height: 1.4; }
                        .text-center { text-align: center; }
                        .text-right { text-align: right; }
                        .bold { font-weight: bold; }
                        .divider { border-top: 1px dashed #1f2937; margin: 15px 0; }
                        .double-divider { border-top: 3px double #1f2937; margin: 15px 0; }
                        table { width: 100%; border-collapse: collapse; }
                        th { text-align: left; border-bottom: 1px solid #1f2937; padding-bottom: 5px; font-size: 11px; }
                        .section-title { font-weight: bold; font-size: 13px; text-transform: uppercase; margin-top: 20px; margin-bottom: 8px; background-color: #f3f4f6; padding: 4px; }
                    </style>
                </head>
                <body>
                    <div class="text-center">
                        <h2 style="margin: 0; font-size: 18px;">NICKY FROZEN</h2>
                        <p style="margin: 4px 0 0 0; font-size: 11px;">LAPORAN TUTUP BUKU HARIAN</p>
                        <p style="margin: 2px 0 0 0; font-size: 11px;">Cabang: \${rep.cabang || "-"}</p>
                    </div>

                    <div class="divider"></div>

                    <table>
                        <tr><td>Tanggal</td><td>: \${formattedDate}</td></tr>
                        <tr><td>Pemeriksa</td><td>: \${rep.diperiksa_oleh?.nama_lengkap || "System"}</td></tr>
                        <tr><td>Status</td><td class="bold">: \${rep.status_tutup_buku || "Terkunci"}</td></tr>
                    </table>

                    <div class="divider"></div>

                    <h3 style="margin: 0; font-size: 14px;">RINGKASAN KEUANGAN SISTEM</h3>
                    <table style="margin-top: 8px;">
                        <tr><td>Modal Awal (Shift 1)</td><td class="text-right">Rp \${(rep.modal_awal || 0).toLocaleString("id-ID")}</td></tr>
                        <tr><td>Total Penjualan Cash</td><td class="text-right">Rp \${(rep.total_pendapatan_cash || 0).toLocaleString("id-ID")}</td></tr>
                        <tr><td>Total Penjualan Digital</td><td class="text-right">Rp \${(rep.total_pendapatan_digital || 0).toLocaleString("id-ID")}</td></tr>
                        <tr class="bold"><td>Total Pendapatan Sistem</td><td class="text-right">Rp \${(rep.total_pendapatan_sistem || 0).toLocaleString("id-ID")}</td></tr>
                        <tr class="bold"><td>Ekspektasi Uang Laci Fisik</td><td class="text-right">Rp \${((rep.modal_awal || 0) + (rep.total_pendapatan_cash || 0)).toLocaleString("id-ID")}</td></tr>
                    </table>

                    <div class="divider"></div>

                    <h3 style="margin: 0; font-size: 14px;">AUDIT KAS FISIK</h3>
                    <table style="margin-top: 8px;">
                        <tr class="bold"><td>Total Uang Fisik Laci</td><td class="text-right">Rp \${(rep.total_kas_fisik || 0).toLocaleString("id-ID")}</td></tr>
                        <tr class="bold" style="color: \${rep.selisih < 0 ? "#dc2626" : rep.selisih > 0 ? "#d97706" : "#059669"}">
                            <td>Selisih Kas Laci</td>
                            <td class="text-right">\${rep.selisih > 0 ? "+" : ""}Rp \${(rep.selisih || 0).toLocaleString("id-ID")}</td>
                        </tr>
                    </table>

                    <div class="divider"></div>

                    <h3 style="margin: 0; font-size: 14px;">RINGKASAN SHIFT</h3>
                    \${(printDetail.shifts || []).map(s => \`
                        <div style="margin-top: 8px; border: 1px solid #e5e7eb; padding: 8px; border-radius: 4px;">
                            <div class="bold">\${s.shift} (\${s.user_id?.nama_lengkap || "-"})</div>
                            <div style="display: flex; justify-content: space-between; font-size: 11px; margin-top: 4px;">
                                <span>Tunai: Rp \${(s.total_cash || 0).toLocaleString("id-ID")}</span>
                                <span>Digital: Rp \${(s.total_digital || 0).toLocaleString("id-ID")}</span>
                                <span>Total: Rp \${(s.total_pendapatan || 0).toLocaleString("id-ID")} (\${s.jumlah_transaksi || 0} Trx)</span>
                            </div>
                        </div>
                    \`).join("")}

                    <div class="double-divider"></div>

                    <div class="text-center bold" style="font-size: 13px;">RINCIAN TRANSAKSI DETAIL</div>

                    <div class="section-title">SHIFT 1 (\${shift1Tx.length} Transaksi)</div>
                    <table>
                        <thead>
                            <tr>
                                <th>Invoice</th>
                                <th>Kasir</th>
                                <th>Metode</th>
                                <th>Jam</th>
                                <th class="text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            \${renderTxRows(shift1Tx)}
                        </tbody>
                    </table>

                    <div class="section-title">SHIFT 2 (\${shift2Tx.length} Transaksi)</div>
                    <table>
                        <thead>
                            <tr>
                                <th>Invoice</th>
                                <th>Kasir</th>
                                <th>Metode</th>
                                <th>Jam</th>
                                <th class="text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            \${renderTxRows(shift2Tx)}
                        </tbody>
                    </table>

                    \${otherTx.length > 0 ? \`
                        <div class="section-title">LAINNYA / TANPA SHIFT (\${otherTx.length} Transaksi)</div>
                        <table>
                            <thead>
                                <tr>
                                    <th>Invoice</th>
                                    <th>Kasir</th>
                                    <th>Metode</th>
                                    <th>Jam</th>
                                    <th class="text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                \${renderTxRows(otherTx)}
                            </tbody>
                        </table>
                    \` : ""}

                    <div class="double-divider" style="margin-top: 30px;"></div>
                    <div style="display: flex; justify-content: space-between; margin-top: 50px; text-align: center;">
                        <div style="width: 200px;">
                            <p>Dibuat Oleh,</p>
                            <br/><br/><br/>
                            <p class="bold">____________________</p>
                            <p>\${rep.diperiksa_oleh?.nama_lengkap || "Kasir"}</p>
                        </div>
                        <div style="width: 200px;">
                            <p>Diketahui Oleh,</p>
                            <br/><br/><br/>
                            <p class="bold">____________________</p>
                            <p>Owner / Manager</p>
                        </div>
                    </div>

                    <script>
                        window.onload = function() {
                            window.print();
                            window.onafterprint = function() {
                                window.close();
                            };
                        };
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    // Open tutup buku modal
    const handleOpenClosingModal = () => {
        if (hasClosedToday) {
            Swal.fire({ icon: "warning", title: "Sudah Tutup Buku", text: "Tutup buku harian untuk hari ini sudah dilakukan." });
            return;
        }
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
            await api.post("/reports/tutup-buku", { total_kas_fisik: physicalCash }, config);

            Swal.fire({
                icon: "success",
                title: "Tutup Buku Berhasil!",
                text: "Laporan harian telah berhasil dikunci.",
                confirmButtonColor: "#0891b2",
            }).then(() => {
                fetchReports();
                fetchShiftData();
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
                    disabled={!isTutupBukuAllowed || hasClosedToday}
                    className={`font-bold px-6 py-3.5 rounded-2xl transition flex items-center gap-2 cursor-pointer border-none ${
                        isTutupBukuAllowed && !hasClosedToday
                            ? "bg-primary hover:bg-primary-dark text-white shadow-lg shadow-cyan-500/20"
                            : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    }`}
                >
                    <FiLock size={18} /> {hasClosedToday ? "Sudah Tutup Buku" : "Tutup Buku Harian"}
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
                <div onClick={() => handleShowTodayShiftDetail("Shift 1")}
                    title="Klik untuk melihat rincian transaksi Shift 1 hari ini"
                    className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md hover:scale-[1.01] transition-all duration-200">
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
                <div onClick={() => handleShowTodayShiftDetail("Shift 2")}
                    title="Klik untuk melihat rincian transaksi Shift 2 hari ini"
                    className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md hover:scale-[1.01] transition-all duration-200">
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
                        <p className="text-text-secondary text-sm mt-1">Klik baris untuk melihat detail laporan</p>
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
                                <th className="pb-4">Tanggal</th>
                                <th className="pb-4">Pemeriksa</th>
                                <th className="pb-4 text-right">Modal</th>
                                <th className="pb-4 text-right">Cash</th>
                                <th className="pb-4 text-right">Digital</th>
                                <th className="pb-4 text-right">Total</th>
                                <th className="pb-4 text-right">Fisik Kas</th>
                                <th className="pb-4 text-right">Selisih</th>
                                <th className="pb-4 text-center">Aksi</th>
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

                                    return (
                                        <tr key={rep._id} onClick={() => handleShowReportDetail(rep)}
                                            className="hover:bg-gray-50/50 transition text-sm cursor-pointer">
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
                                            <td className="py-4 text-center" onClick={(e) => e.stopPropagation()}>
                                                <button onClick={() => handlePrintReport(rep)}
                                                    className="p-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-500 hover:text-primary rounded-xl transition cursor-pointer"
                                                    title="Cetak Laporan Tutup Buku"
                                                >
                                                    <FiPrinter size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* DETAIL TUTUP BUKU MODAL */}
            {isDetailModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-3xl mx-4 flex flex-col max-h-[90vh] border border-gray-100 font-poppins text-left">
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-primary/10 text-primary rounded-xl"><FiFileText size={20} /></div>
                                <div>
                                    <h3 className="font-extrabold text-gray-800 text-lg">Detail Laporan Tutup Buku</h3>
                                    {detailData?.report && (
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            Tanggal: <span className="font-bold">{new Date(detailData.report.tanggal_laporan).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}</span> • Cabang: <span className="font-bold">{detailData.report.cabang}</span>
                                        </p>
                                    )}
                                </div>
                            </div>
                            <button onClick={() => setIsDetailModalOpen(false)}
                                className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-600 transition border-none bg-transparent cursor-pointer">
                                <FiX size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {detailLoading ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-2">
                                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                    <p className="text-sm text-gray-500 font-medium">Memuat rincian laporan...</p>
                                </div>
                            ) : detailData ? (
                                <div className="space-y-6">
                                    {/* Financial summary metrics */}
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="bg-gray-50 border border-gray-100 p-4 rounded-2xl">
                                            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Modal Awal (Shift 1)</span>
                                            <h4 className="text-lg font-extrabold text-gray-700 mt-1">{formatRupiah(detailData.report.modal_awal)}</h4>
                                        </div>
                                        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl">
                                            <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">Total Penjualan Tunai</span>
                                            <h4 className="text-lg font-extrabold text-emerald-700 mt-1">{formatRupiah(detailData.report.total_pendapatan_cash)}</h4>
                                        </div>
                                        <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl">
                                            <span className="text-[10px] uppercase font-bold text-blue-600 tracking-wider">Total Penjualan Digital</span>
                                            <h4 className="text-lg font-extrabold text-blue-700 mt-1">{formatRupiah(detailData.report.total_pendapatan_digital)}</h4>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4 bg-gray-50 border border-gray-100 p-4 rounded-2xl">
                                        <div>
                                            <span className="text-xs font-semibold text-gray-400">Total Pendapatan Sistem</span>
                                            <h4 className="text-md font-bold text-gray-800 mt-1">{formatRupiah(detailData.report.total_pendapatan_sistem)}</h4>
                                        </div>
                                        <div>
                                            <span className="text-xs font-semibold text-gray-400">Ekspektasi Kas Laci</span>
                                            <h4 className="text-md font-bold text-gray-800 mt-1">{formatRupiah(detailData.report.modal_awal + detailData.report.total_pendapatan_cash)}</h4>
                                        </div>
                                        <div>
                                            <span className="text-xs font-semibold text-gray-400">Uang Fisik Kasir</span>
                                            <h4 className="text-md font-bold text-gray-800 mt-1">{formatRupiah(detailData.report.total_kas_fisik)}</h4>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-100">
                                        <div>
                                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Selisih Kas Laci</span>
                                            <h4 className={`text-xl font-black mt-1 ${detailData.report.selisih < 0 ? "text-red-500" : detailData.report.selisih > 0 ? "text-amber-500" : "text-emerald-500"}`}>
                                                {detailData.report.selisih > 0 ? "+" : ""}{formatRupiah(detailData.report.selisih)}
                                            </h4>
                                        </div>
                                        <span className={`text-xs font-bold px-4 py-1.5 rounded-full ${detailData.report.selisih < 0 ? "bg-red-50 text-red-600" : detailData.report.selisih > 0 ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
                                            {detailData.report.selisih < 0 ? "Kurang Kas" : detailData.report.selisih > 0 ? "Lebih Kas" : "Sesuai / Balance"}
                                        </span>
                                    </div>

                                    <div className="border-t border-gray-100 pt-4">
                                        <h4 className="font-bold text-gray-700 text-sm uppercase tracking-wider mb-3">Ringkasan Per Shift</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            {detailData.shifts.map(s => (
                                                <div key={s._id} className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="font-bold text-gray-800">{s.shift}</span>
                                                        <span className="text-xs text-gray-400 font-semibold">{s.user_id?.nama_lengkap}</span>
                                                    </div>
                                                    <div className="space-y-1.5 text-xs text-gray-600">
                                                        <div className="flex justify-between"><span>Tunai</span><span className="font-bold text-emerald-600">{formatRupiah(s.total_cash)}</span></div>
                                                        <div className="flex justify-between"><span>Digital</span><span className="font-bold text-blue-600">{formatRupiah(s.total_digital)}</span></div>
                                                        <div className="flex justify-between font-bold text-gray-800"><span>Total</span><span>{formatRupiah(s.total_pendapatan)}</span></div>
                                                        <div className="flex justify-between text-[10px] text-gray-400 pt-1 border-t"><span>Selesai Pada</span><span>{s.waktu_selesai ? new Date(s.waktu_selesai).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "-"}</span></div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Grouped Transaction List */}
                                    <div className="border-t border-gray-100 pt-4">
                                        <h4 className="font-bold text-gray-700 text-sm uppercase tracking-wider mb-4">Rincian Transaksi per Shift ({detailData.transactions.length})</h4>
                                        <div className="space-y-6">
                                            {/* Render Shift 1 */}
                                            {(() => {
                                                const s1Tx = detailData.transactions.filter(t => t.shift === "Shift 1");
                                                return (
                                                    <div>
                                                        <div className="bg-blue-50/50 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-lg mb-2">SHIFT 1 ({s1Tx.length} Transaksi)</div>
                                                        {s1Tx.length === 0 ? (
                                                            <p className="text-xs text-gray-400 pl-3">Tidak ada transaksi di Shift 1</p>
                                                        ) : (
                                                            <div className="overflow-x-auto border border-gray-100 rounded-xl">
                                                                <table className="w-full text-xs text-left">
                                                                    <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] font-bold">
                                                                        <tr>
                                                                            <th className="p-3">Invoice</th>
                                                                            <th className="p-3">Kasir</th>
                                                                            <th className="p-3">Metode</th>
                                                                            <th className="p-3">Waktu</th>
                                                                            <th className="p-3 text-right">Total</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="divide-y divide-gray-100">
                                                                        {s1Tx.map(tx => (
                                                                            <tr key={tx._id} className="hover:bg-gray-50/30">
                                                                                <td className="p-3 font-semibold text-gray-800">{tx.invoice}</td>
                                                                                <td className="p-3 text-gray-600">{tx.user_id?.nama_lengkap || "-"}</td>
                                                                                <td className="p-3">
                                                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${tx.metode_pembayaran === "Cash" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"}`}>
                                                                                        {tx.metode_pembayaran}
                                                                                    </span>
                                                                                </td>
                                                                                <td className="p-3 text-gray-400">{new Date(tx.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</td>
                                                                                <td className="p-3 text-right font-bold text-primary">{formatRupiah(tx.total_pembayaran)}</td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })()}

                                            {/* Render Shift 2 */}
                                            {(() => {
                                                const s2Tx = detailData.transactions.filter(t => t.shift === "Shift 2");
                                                return (
                                                    <div>
                                                        <div className="bg-purple-50/50 text-purple-700 text-xs font-bold px-3 py-1.5 rounded-lg mb-2">SHIFT 2 ({s2Tx.length} Transaksi)</div>
                                                        {s2Tx.length === 0 ? (
                                                            <p className="text-xs text-gray-400 pl-3">Tidak ada transaksi di Shift 2</p>
                                                        ) : (
                                                            <div className="overflow-x-auto border border-gray-100 rounded-xl">
                                                                <table className="w-full text-xs text-left">
                                                                    <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] font-bold">
                                                                        <tr>
                                                                            <th className="p-3">Invoice</th>
                                                                            <th className="p-3">Kasir</th>
                                                                            <th className="p-3">Metode</th>
                                                                            <th className="p-3">Waktu</th>
                                                                            <th className="p-3 text-right">Total</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="divide-y divide-gray-100">
                                                                        {s2Tx.map(tx => (
                                                                            <tr key={tx._id} className="hover:bg-gray-50/30">
                                                                                <td className="p-3 font-semibold text-gray-800">{tx.invoice}</td>
                                                                                <td className="p-3 text-gray-600">{tx.user_id?.nama_lengkap || "-"}</td>
                                                                                <td className="p-3">
                                                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${tx.metode_pembayaran === "Cash" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"}`}>
                                                                                        {tx.metode_pembayaran}
                                                                                    </span>
                                                                                </td>
                                                                                <td className="p-3 text-gray-400">{new Date(tx.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</td>
                                                                                <td className="p-3 text-right font-bold text-primary">{formatRupiah(tx.total_pembayaran)}</td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })()}

                                            {/* Render Other/Legacy */}
                                            {(() => {
                                                const otherTx = detailData.transactions.filter(t => t.shift !== "Shift 1" && t.shift !== "Shift 2");
                                                if (otherTx.length === 0) return null;
                                                return (
                                                    <div>
                                                        <div className="bg-gray-100 text-gray-700 text-xs font-bold px-3 py-1.5 rounded-lg mb-2">LAINNYA / TANPA SHIFT ({otherTx.length} Transaksi)</div>
                                                        <div className="overflow-x-auto border border-gray-100 rounded-xl">
                                                            <table className="w-full text-xs text-left">
                                                                <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] font-bold">
                                                                    <tr>
                                                                        <th className="p-3">Invoice</th>
                                                                        <th className="p-3">Kasir</th>
                                                                        <th className="p-3">Metode</th>
                                                                        <th className="p-3">Waktu</th>
                                                                        <th className="p-3 text-right">Total</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-gray-100">
                                                                    {otherTx.map(tx => (
                                                                        <tr key={tx._id} className="hover:bg-gray-50/30">
                                                                            <td className="p-3 font-semibold text-gray-800">{tx.invoice}</td>
                                                                            <td className="p-3 text-gray-600">{tx.user_id?.nama_lengkap || "-"}</td>
                                                                            <td className="p-3">
                                                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${tx.metode_pembayaran === "Cash" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"}`}>
                                                                                    {tx.metode_pembayaran}
                                                                                </span>
                                                                            </td>
                                                                            <td className="p-3 text-gray-400">{new Date(tx.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</td>
                                                                            <td className="p-3 text-right font-bold text-primary">{formatRupiah(tx.total_pembayaran)}</td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            ) : null}
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-gray-100 bg-gray-50/50 rounded-b-3xl flex justify-between">
                            {detailData?.report ? (
                                <button onClick={() => handlePrintReport(detailData.report, detailData)}
                                    className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold transition shadow-lg shadow-cyan-500/20 cursor-pointer border-none text-sm flex items-center gap-1.5">
                                    <FiPrinter size={16}/> Cetak Laporan
                                </button>
                            ) : <div></div>}
                            <button onClick={() => setIsDetailModalOpen(false)} className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-100 transition cursor-pointer text-sm bg-white">Tutup</button>
                        </div>
                    </div>
                </div>
            )}

            {/* TODAY SHIFT DETAIL MODAL */}
            {todayShiftDetail && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl mx-4 flex flex-col max-h-[80vh] border border-gray-100 font-poppins text-left">
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-primary/10 text-primary rounded-xl"><FiClock size={20} /></div>
                                <div>
                                    <h3 className="font-extrabold text-gray-800 text-lg">Detail Transaksi - {todayShiftDetail.shiftName}</h3>
                                    <p className="text-xs text-gray-400 mt-0.5">Daftar transaksi sukses pada shift ini hari ini</p>
                                </div>
                            </div>
                            <button onClick={() => setTodayShiftDetail(null)}
                                className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-600 transition border-none bg-transparent cursor-pointer">
                                <FiX size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {todayShiftDetail.loading ? (
                                <div className="flex flex-col items-center justify-center py-10 gap-2">
                                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                    <p className="text-sm text-gray-500 font-medium">Memuat data transaksi...</p>
                                </div>
                            ) : todayShiftDetail.transactions.length === 0 ? (
                                <p className="text-sm text-gray-400 text-center py-10">Belum ada transaksi sukses pada shift ini hari ini.</p>
                            ) : (
                                <div className="overflow-x-auto border border-gray-100 rounded-xl">
                                    <table className="w-full text-xs text-left">
                                        <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] font-bold">
                                            <tr>
                                                <th className="p-3">Invoice</th>
                                                <th className="p-3">Kasir</th>
                                                <th className="p-3">Metode</th>
                                                <th className="p-3">Waktu</th>
                                                <th className="p-3 text-right">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {todayShiftDetail.transactions.map(tx => (
                                                <tr key={tx._id} className="hover:bg-gray-50/30">
                                                    <td className="p-3 font-semibold text-gray-800">{tx.invoice}</td>
                                                    <td className="p-3 text-gray-600">{tx.user_id?.nama_lengkap || "-"}</td>
                                                    <td className="p-3">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${tx.metode_pembayaran === "Cash" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"}`}>
                                                            {tx.metode_pembayaran}
                                                        </span>
                                                    </td>
                                                    <td className="p-3 text-gray-400">{new Date(tx.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</td>
                                                    <td className="p-3 text-right font-bold text-primary">{formatRupiah(tx.total_pembayaran)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-gray-100 bg-gray-50/50 rounded-b-3xl flex justify-end">
                            <button onClick={() => setTodayShiftDetail(null)} className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-100 transition cursor-pointer text-sm bg-white">Tutup</button>
                        </div>
                    </div>
                </div>
            )}

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
                                Uang digital <b>({formatRupiah(totalDayDigital)})</b> tercatat otomatis di sistem dan tidak dihitung ke selisih kas laci fisik.
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
