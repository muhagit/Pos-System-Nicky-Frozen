import { useEffect, useState } from "react";
import API from "../../services/api"; // Menggunakan instance API axios yang sama dengan kasir
import Swal from "sweetalert2";
import { FiClock, FiEye, FiTrash2 } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

const HoldPage = () => {
    const navigate = useNavigate();
    const [holdTransactions, setHoldTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    // Ambil token kasir dari localStorage
    const userInfo = JSON.parse(localStorage.getItem("userInfo"));
    const config = {
        headers: { Authorization: `Bearer ${userInfo?.token}` },
    };

    // FETCH TRANSAKSI YANG DI-HOLD
    const fetchHold = async () => {
        setLoading(true);
        try {
            // Menyesuaikan dengan base URL instance API Anda
            const res = await API.get("/transactions/hold", config);
            setHoldTransactions(res.data);
        } catch (error) {
            console.log("Gagal mengambil data hold:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHold();
    }, []);

    // FUNGSI UNTUK MENAMPILKAN KONFIRMASI DETAIL SEBELUM OPEN HOLD
    const handleConfirmOpenHold = (transaction) => {
        const itemsHtml = (transaction.detail_transaksi || []).map(item => `
            <div class="flex justify-between items-center text-sm py-2 border-b border-gray-100 last:border-0 text-left">
                <div class="truncate max-w-[200px] text-left">
                    <span class="font-semibold text-gray-800 block">${item.produk_id?.nama_produk || "Produk"}</span>
                    <span class="text-xs text-gray-400 block">${item.kuantitas || item.qty} x Rp ${(item.harga_satuan || item.harga || 0).toLocaleString("id-ID")}</span>
                </div>
                <span class="font-bold text-gray-900">Rp ${(item.subtotal || ((item.harga_satuan || item.harga || 0) * (item.kuantitas || item.qty))).toLocaleString("id-ID")}</span>
            </div>
        `).join("");

        const subtotal = (transaction.detail_transaksi || []).reduce((sum, item) => sum + (item.subtotal || ((item.harga_satuan || item.harga || 0) * (item.kuantitas || item.qty))), 0);
        const tax = subtotal * 0.1;
        const total = subtotal + tax;

        const modalHtml = `
            <div class="text-left font-poppins text-gray-700">
                <div class="mb-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <div class="grid grid-cols-2 gap-y-3 gap-x-2 text-xs">
                        <div>
                            <span class="text-gray-400 font-bold uppercase block tracking-wider mb-0.5">Nama Pelanggan</span>
                            <span class="font-bold text-gray-850 text-sm">${transaction.customer_name || "Tanpa Nama"}</span>
                        </div>
                        <div>
                            <span class="text-gray-400 font-bold uppercase block tracking-wider mb-0.5">Order ID</span>
                            <span class="font-mono font-bold text-gray-800 text-sm">${transaction.order_id || "-"}</span>
                        </div>
                        <div>
                            <span class="text-gray-400 font-bold uppercase block tracking-wider mb-0.5">Kasir</span>
                            <span class="font-semibold text-gray-700">${transaction.kasir || "-"}</span>
                        </div>
                        <div>
                            <span class="text-gray-400 font-bold uppercase block tracking-wider mb-0.5">Cabang</span>
                            <span class="font-semibold text-gray-700">${transaction.cabang || "-"}</span>
                        </div>
                    </div>
                </div>
                
                <span class="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2">Detail Item</span>
                <div class="max-h-48 overflow-y-auto mb-4 border border-gray-100 rounded-2xl p-4 bg-white space-y-1">
                    ${itemsHtml}
                </div>

                <div class="space-y-2 border-t pt-3 text-sm">
                    <div class="flex justify-between text-gray-500">
                        <span>Subtotal</span>
                        <span class="font-semibold text-gray-800">Rp ${subtotal.toLocaleString("id-ID")}</span>
                    </div>
                    <div class="flex justify-between text-gray-500">
                        <span>Pajak (10%)</span>
                        <span class="font-semibold text-gray-800">Rp ${tax.toLocaleString("id-ID")}</span>
                    </div>
                    <div class="flex justify-between font-bold text-lg mt-2 pt-2 border-t text-primary">
                        <span>Total Bayar</span>
                        <span>Rp ${total.toLocaleString("id-ID")}</span>
                    </div>
                </div>
            </div>
        `;

        Swal.fire({
            title: "Konfirmasi Buka Transaksi",
            html: modalHtml,
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Buka Transaksi",
            cancelButtonText: "Batal",
            confirmButtonColor: "#06b6d4", // Cyan 500 / Primary
            cancelButtonColor: "#dc2626", // Red 600
            customClass: {
                popup: "rounded-3xl p-6",
                confirmButton: "rounded-2xl px-6 py-3 font-bold text-white text-sm focus:outline-none mr-2",
                cancelButton: "rounded-2xl px-6 py-3 font-bold text-white text-sm focus:outline-none"
            }
        }).then((result) => {
            if (result.isConfirmed) {
                handleOpenHold(transaction);
            }
        });
    };

    // 1. FUNGSI UNTUK MEMBUKA KEMBALI TRANSAKSI KE KASIR
    const handleOpenHold = (transaction) => {
        // 1. Simpan data belanjaan ke localStorage
        localStorage.setItem(
            "restoreCartItems",
            JSON.stringify(transaction.detail_transaksi),
        );
        localStorage.setItem(
            "restorePaymentMethod",
            transaction.metode_pembayaran || "",
        );

        // 2. SIMPAN ORDER ID ASLI (Tambahkan baris ini)
        localStorage.setItem("restoreOrderId", transaction.order_id);
        localStorage.setItem("restoreSnapToken", transaction.snap_token || "");


        // 3. Arahkan kembali ke kasir
        navigate("/kasir");
    };

    // 2. FUNGSI UNTUK MENGHAPUS TRANSAKSI HOLD
    const handleDeleteHold = async (id, withConfirm = true) => {
        const executeDelete = async () => {
            try {
                await API.delete(`/transactions/${id}`, config);
                if (withConfirm) {
                    Swal.fire(
                        "Terhapus!",
                        "Transaksi hold berhasil dihapus.",
                        "success",
                    );
                }
                // Refresh data setelah dihapus
                fetchHold();
            } catch (error) {
                Swal.fire("Gagal", "Gagal menghapus transaksi.", "error");
            }
        };

        if (withConfirm) {
            Swal.fire({
                title: "Apakah Anda yakin?",
                text: "Transaksi yang ditunda ini akan dihapus permanen!",
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#3085d6",
                cancelButtonColor: "#d33",
                confirmButtonText: "Ya, Hapus!",
            }).then((result) => {
                if (result.isConfirmed) {
                    executeDelete();
                }
            });
        } else {
            // Jika dipanggil dari handleOpenHold, langsung hapus tanpa modal konfirmasi
            executeDelete();
        }
    };

    return (
        <div className="p-8 bg-background h-screen overflow-y-auto font-poppins">
            {/* HEADER */}
            <div>
                <h1 className="text-4xl font-bold text-text">
                    Hold Transactions
                </h1>
                <p className="text-text-secondary mt-2">
                    Manage pending cashier transactions
                </p>
            </div>

            {/* CONTENT */}
            {loading ? (
                <div className="flex items-center gap-2 mt-8 text-text-secondary">
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p>Loading transactions...</p>
                </div>
            ) : holdTransactions.length === 0 ? (
                <div className="mt-8 bg-white p-8 rounded-3xl text-center text-text-secondary shadow-sm">
                    📭 No hold transactions available.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                    {holdTransactions.map((hold) => (
                        <div
                            key={hold._id}
                            className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between"
                        >
                            {/* TOP */}
                            <div className="flex items-center justify-between">
                                <div className="bg-yellow-100 text-yellow-600 p-4 rounded-2xl">
                                    <FiClock size={24} />
                                </div>
                                <span className="bg-yellow-100 text-yellow-600 px-4 py-2 rounded-xl text-sm font-semibold">
                                    HOLD
                                </span>
                            </div>

                            {/* CONTENT */}
                            <div className="mt-6">
                                <h2 className="text-xl font-bold text-text truncate" title={hold.customer_name || "Tanpa Nama"}>
                                    {hold.customer_name || "Tanpa Nama"}
                                </h2>
                                <p className="text-text-secondary mt-1 text-xs font-mono">
                                    ID: {hold.order_id || "No Order ID"}
                                </p>
                                <p className="text-text-secondary mt-1 text-sm">
                                    Kasir: {hold.kasir || "Tidak Diketahui"}
                                </p>
                            </div>

                            {/* INFO */}
                            <div className="space-y-3 mt-6 border-t border-b border-gray-50 py-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-text-secondary">
                                        Date
                                    </span>
                                    <span className="font-medium text-text">
                                        {hold.createdAt
                                            ? new Date(
                                                  hold.createdAt,
                                              ).toLocaleString("id-ID")
                                            : new Date().toLocaleDateString(
                                                  "id-ID",
                                              )}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-text-secondary">
                                        Cabang
                                    </span>
                                    <span className="font-medium text-text">
                                        {hold.cabang}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center pt-2">
                                    <span className="text-text-secondary text-sm">
                                        Total
                                    </span>
                                    <span className="font-bold text-xl text-primary">
                                        Rp{" "}
                                        {(
                                            hold.total_pembayaran || 0
                                        ).toLocaleString("id-ID")}
                                    </span>
                                </div>
                            </div>

                            {/* ACTION */}
                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => handleConfirmOpenHold(hold)}
                                    className="flex-1 bg-primary text-white py-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-primary-dark transition font-semibold text-sm"
                                >
                                    <FiEye />
                                    Open
                                </button>
                                <button
                                    onClick={() => handleDeleteHold(hold._id)}
                                    className="bg-red-50 text-red-500 px-5 rounded-2xl hover:bg-red-100 transition flex items-center justify-center"
                                >
                                    <FiTrash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default HoldPage;
