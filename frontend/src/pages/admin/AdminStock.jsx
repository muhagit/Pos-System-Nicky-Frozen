import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { FiPlus, FiMinus, FiRefreshCw } from "react-icons/fi";

const AdminStock = () => {
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Ambil token dari localStorage
    const userInfo = JSON.parse(localStorage.getItem("userInfo"));
    const config = { headers: { Authorization: `Bearer ${userInfo?.token}` } };

    // ================= 1. READ (Ambil Data) =================
    const fetchProducts = async () => {
        try {
            const { data } = await axios.get(
                "http://localhost:5000/api/products",
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

    // ================= 2. QUICK ACTION (Tambah/Kurangi Stok) =================
    const handleUpdateStock = async (product, type) => {
        const isAddition = type === "add";
        const actionText = isAddition ? "ditambahkan" : "dikurangi";

        const { value: quantity } = await Swal.fire({
            title: isAddition ? "Tambah Stok" : "Kurangi Stok",
            text: `Berapa jumlah stok yang ingin ${actionText} untuk ${product.nama_produk}?`,
            input: "number",
            inputAttributes: {
                min: 1,
                step: 1,
            },
            showCancelButton: true,
            confirmButtonText: "Simpan",
            cancelButtonText: "Batal",
            confirmButtonColor: isAddition ? "#10b981" : "#ef4444",
            inputValidator: (value) => {
                if (!value || value <= 0) {
                    return "Jumlah harus lebih dari 0!";
                }
                if (!isAddition && parseInt(value) > product.stok_saat_ini) {
                    return "Pengurangan tidak boleh melebihi stok saat ini!";
                }
            },
        });

        if (quantity) {
            const newStock = isAddition
                ? product.stok_saat_ini + parseInt(quantity)
                : product.stok_saat_ini - parseInt(quantity);

            try {
                // Gunakan endpoint PUT yang sama dengan edit produk, tapi kita hanya timpa stoknya
                await axios.put(
                    `http://localhost:5000/api/products/${product._id}`,
                    {
                        ...product,
                        stok_saat_ini: newStock,
                    },
                    config,
                );

                Swal.fire({
                    title: "Berhasil!",
                    text: `Stok berhasil ${actionText} sebanyak ${quantity} unit.`,
                    icon: "success",
                    timer: 1500,
                    showConfirmButton: false,
                });

                fetchProducts(); // Refresh tabel setelah update
            } catch (error) {
                Swal.fire(
                    "Gagal!",
                    "Terjadi kesalahan saat mengupdate stok.",
                    "error",
                );
            }
        }
    };

    // Placeholder untuk tombol header
    const handleFeatureSoon = (feature) => {
        Swal.fire({
            title: "Segera Hadir!",
            text: `Fitur ${feature} sedang dalam tahap pengembangan.`,
            icon: "info",
            confirmButtonColor: "#22d3ee",
        });
    };

    return (
        <div className="h-full flex flex-col bg-background font-poppins px-8 py-6 overflow-y-auto">
            {/* Header Section */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">
                        Stock Management
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">
                        Manage inventory movements
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => handleFeatureSoon("Add Stock")}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition shadow-md shadow-emerald-500/30"
                    >
                        <FiPlus size={20} /> Add Stock
                    </button>
                    <button
                        onClick={() => handleFeatureSoon("Reduce Stock")}
                        className="bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition shadow-md shadow-red-500/30"
                    >
                        <FiMinus size={20} /> Reduce Stock
                    </button>
                    <button
                        onClick={() => handleFeatureSoon("Transfer Branch")}
                        className="bg-primary hover:bg-cyan-500 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition shadow-md shadow-cyan-500/30"
                    >
                        <FiRefreshCw size={20} /> Transfer
                    </button>
                </div>
            </div>

            {/* Table Section */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex-1 flex flex-col">
                <div className="p-5 border-b border-gray-100">
                    <h3 className="font-bold text-gray-800 text-lg">
                        Current Stock Levels
                    </h3>
                </div>
                <div className="overflow-x-auto flex-1 p-2">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50/50">
                            <tr className="text-gray-500 text-sm border-b border-gray-100">
                                <th className="py-4 px-6 font-medium">
                                    Product
                                </th>
                                <th className="py-4 px-4 font-medium">SKU</th>
                                <th className="py-4 px-4 font-medium">Stock</th>
                                <th className="py-4 px-4 font-medium">
                                    Status
                                </th>
                                <th className="py-4 px-6 font-medium text-center">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td
                                        colSpan="5"
                                        className="py-8 text-center text-gray-400"
                                    >
                                        Loading stock data...
                                    </td>
                                </tr>
                            ) : products.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan="5"
                                        className="py-8 text-center text-gray-400"
                                    >
                                        Tidak ada produk ditemukan.
                                    </td>
                                </tr>
                            ) : (
                                products.map((product) => {
                                    const sku = `FRZ-${product._id.substring(18, 24).toUpperCase()}`;
                                    const isCritical =
                                        product.stok_saat_ini <=
                                        product.batas_stok_minimum;

                                    return (
                                        <tr
                                            key={product._id}
                                            className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition"
                                        >
                                            <td className="py-4 px-6 font-semibold text-gray-800">
                                                {product.nama_produk}
                                            </td>
                                            <td className="py-4 px-4 text-gray-500 text-sm">
                                                {sku}
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className="font-bold text-gray-800">
                                                    {product.stok_saat_ini}
                                                </span>
                                                <span className="text-gray-500 text-sm ml-1">
                                                    units
                                                </span>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span
                                                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                        isCritical
                                                            ? "bg-red-100 text-red-600"
                                                            : "bg-emerald-100 text-emerald-600"
                                                    }`}
                                                >
                                                    {isCritical
                                                        ? "Critical"
                                                        : "Normal"}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center justify-center gap-4 text-lg">
                                                    <button
                                                        onClick={() =>
                                                            handleUpdateStock(
                                                                product,
                                                                "add",
                                                            )
                                                        }
                                                        className="text-emerald-500 hover:text-emerald-700 transition font-bold"
                                                        title="Add Stock"
                                                    >
                                                        +
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            handleUpdateStock(
                                                                product,
                                                                "reduce",
                                                            )
                                                        }
                                                        className="text-red-500 hover:text-red-700 transition font-bold"
                                                        title="Reduce Stock"
                                                    >
                                                        −
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

export default AdminStock;
