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
                                <h2 className="text-xl font-bold text-text truncate">
                                    {hold.order_id || "No Order ID"}
                                </h2>
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
                                    onClick={() => handleOpenHold(hold)}
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
