import React, { useState, useEffect } from "react";
import api from "../../utils/api";
import Swal from "sweetalert2";
import { FiAlertTriangle, FiCalendar, FiTrash2 } from "react-icons/fi";

const AdminExpired = () => {
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const userInfo = JSON.parse(localStorage.getItem("userInfo"));
    const config = { headers: { Authorization: `Bearer ${userInfo?.token}` } };

    // ================= 1. READ (Ambil Data) =================
    const fetchProducts = async () => {
        try {
            const { data } = await api.get(
                "/products",
                config,
            );
            setProducts(data);
            setIsLoading(false);
        } catch (error) {
            console.error("Gagal mengambil produk:", error);
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    // ================= 2. DELETE (Hapus Data) =================
    const handleDelete = (id) => {
        Swal.fire({
            title: "Buang Produk Ini?",
            text: "Produk akan dihapus permanen dari sistem.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
            cancelButtonColor: "#9ca3af",
            confirmButtonText: "Ya, Hapus!",
            cancelButtonText: "Batal",
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await api.delete(
                        `/products/${id}`,
                        config,
                    );
                    Swal.fire(
                        "Terhapus!",
                        "Produk berhasil dihapus.",
                        "success",
                    );
                    fetchProducts();
                } catch (error) {
                    Swal.fire("Gagal!", "Gagal menghapus produk.", "error");
                }
            }
        });
    };

    // ================= LOGIKA PERHITUNGAN EXPIRED =================
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset jam agar hitungan hari presisi

    const processedProducts = products.map((product) => {
        const expDate = new Date(product.tanggal_expired);
        expDate.setHours(0, 0, 0, 0);

        const diffTime = expDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Konversi milidetik ke hari

        let status = "Normal";
        if (diffDays < 0) {
            status = "Expired";
        } else if (diffDays <= 30) {
            // Batas peringatan: 30 Hari
            status = "Expiring Soon";
        }

        return { ...product, diffDays, expiryStatus: status };
    });

    // Urutkan dari yang paling mendesak (Expired -> Soon -> Normal)
    processedProducts.sort((a, b) => a.diffDays - b.diffDays);

    // Hitung jumlah untuk Summary Cards
    const countExpired = processedProducts.filter(
        (p) => p.expiryStatus === "Expired",
    ).length;
    const countSoon = processedProducts.filter(
        (p) => p.expiryStatus === "Expiring Soon",
    ).length;
    const countNormal = processedProducts.filter(
        (p) => p.expiryStatus === "Normal",
    ).length;

    return (
        <div className="h-full flex flex-col bg-background font-poppins px-6 py-4 overflow-hidden">
            {/* Header Section */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm mb-4 flex-shrink-0">
                <h2 className="text-2xl font-bold text-gray-800">
                    Expired Product Monitoring
                </h2>
                <p className="text-gray-500 text-sm mt-1">
                    Track and manage expiring products
                </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4 mb-4 flex-shrink-0">
                {/* Card 1: Expired */}
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-gray-600 font-medium text-sm">
                            Expired
                        </span>
                        <FiAlertTriangle className="text-red-500" size={20} />
                    </div>
                    <span className="text-4xl font-bold text-red-600">
                        {countExpired}
                    </span>
                </div>

                {/* Card 2: Expiring Soon */}
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-gray-600 font-medium text-sm">
                            Expiring Soon
                        </span>
                        <FiCalendar className="text-amber-500" size={20} />
                    </div>
                    <span className="text-4xl font-bold text-amber-500">
                        {countSoon}
                    </span>
                </div>

                {/* Card 3: Normal */}
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-gray-600 font-medium text-sm">
                            Normal
                        </span>
                        <FiCalendar className="text-emerald-500" size={20} />
                    </div>
                    <span className="text-4xl font-bold text-emerald-500">
                        {countNormal}
                    </span>
                </div>
            </div>

            {/* Table Section */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex-1 flex flex-col overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex-shrink-0">
                    <h3 className="font-bold text-gray-800 text-lg">
                        Expiry Timeline
                    </h3>
                </div>

                {/* Area tabel dibuat scrollable jika datanya panjang */}
                <div className="w-full flex-1 overflow-y-auto">
                    <table className="w-full text-left table-fixed border-collapse">
                        <thead className="bg-gray-50/50 sticky top-0 z-10">
                            <tr className="text-gray-500 text-sm border-b border-gray-100">
                                <th className="py-3 px-5 font-medium w-[25%]">
                                    Product Name
                                </th>
                                <th className="py-3 px-4 font-medium w-[15%]">
                                    SKU
                                </th>
                                <th className="py-3 px-4 font-medium w-[15%]">
                                    Expiry Date
                                </th>
                                <th className="py-3 px-4 font-medium w-[15%]">
                                    Days Left
                                </th>
                                <th className="py-3 px-4 font-medium w-[12%]">
                                    Stock
                                </th>
                                <th className="py-3 px-4 font-medium w-[12%]">
                                    Status
                                </th>
                                <th className="py-3 px-4 font-medium w-[8%] text-center">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td
                                        colSpan="7"
                                        className="py-8 text-center text-gray-400"
                                    >
                                        Memuat data expiry...
                                    </td>
                                </tr>
                            ) : processedProducts.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan="7"
                                        className="py-8 text-center text-gray-400"
                                    >
                                        Tidak ada produk ditemukan.
                                    </td>
                                </tr>
                            ) : (
                                processedProducts.map((product) => {
                                    const sku = `FRZ-${product._id.substring(18, 24).toUpperCase()}`;
                                    const isExpired =
                                        product.expiryStatus === "Expired";
                                    const isSoon =
                                        product.expiryStatus ===
                                        "Expiring Soon";

                                    // Teks hari tersisa (Jika minus, tampilkan 'Expired')
                                    const daysLeftText = isExpired
                                        ? "Expired"
                                        : `${product.diffDays} days`;

                                    return (
                                        <tr
                                            key={product._id}
                                            className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition"
                                        >
                                            <td
                                                className="py-3.5 px-5 font-semibold text-gray-800 truncate"
                                                title={product.nama_produk}
                                            >
                                                {product.nama_produk}
                                            </td>
                                            <td className="py-3.5 px-4 text-gray-500 text-sm truncate">
                                                {sku}
                                            </td>
                                            <td className="py-3.5 px-4 text-gray-500 text-sm truncate">
                                                {new Date(
                                                    product.tanggal_expired,
                                                ).toLocaleDateString("id-ID")}
                                            </td>
                                            <td className="py-3.5 px-4 truncate">
                                                <span
                                                    className={`font-bold ${isExpired ? "text-red-500" : "text-gray-800"}`}
                                                >
                                                    {daysLeftText}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 text-gray-500 text-sm truncate">
                                                {product.stok_saat_ini} units
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <span
                                                    className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap inline-block ${
                                                        isExpired
                                                            ? "bg-red-100 text-red-600"
                                                            : isSoon
                                                              ? "bg-amber-100 text-amber-700"
                                                              : "bg-emerald-100 text-emerald-700"
                                                    }`}
                                                >
                                                    {product.expiryStatus}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <div className="flex items-center justify-center">
                                                    <button
                                                        onClick={() =>
                                                            handleDelete(
                                                                product._id,
                                                            )
                                                        }
                                                        className="text-red-500 hover:text-red-700 transition cursor-pointer bg-transparent border-none"
                                                        title="Delete"
                                                    >
                                                        <FiTrash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminExpired;
