import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import {
    FiSearch,
    FiRefreshCw,
    FiChevronLeft,
    FiChevronRight,
} from "react-icons/fi";

const AdminStock = () => {
    // State untuk Data
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // State untuk Pencarian & Filter
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");

    // State untuk Pagination (Tepat 5 per halaman agar pas di layar)
    const [currentPage, setCurrentPage] = useState(1);
    const productsPerPage = 5;

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

    // Reset ke halaman 1 jika user mengetik pencarian atau mengubah filter
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, selectedCategory]);

    // ================= LOGIKA FILTER & PAGINATION =================
    const filteredProducts = products.filter((product) => {
        const matchName = product.nama_produk
            .toLowerCase()
            .includes(searchQuery.toLowerCase());
        const matchCategory =
            selectedCategory === "All" || product.kategori === selectedCategory;
        return matchName && matchCategory;
    });

    const indexOfLastProduct = currentPage * productsPerPage;
    const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
    const currentProducts = filteredProducts.slice(
        indexOfFirstProduct,
        indexOfLastProduct,
    );
    const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

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

                fetchProducts(); // Refresh tabel
            } catch (error) {
                Swal.fire(
                    "Gagal!",
                    "Terjadi kesalahan saat mengupdate stok.",
                    "error",
                );
            }
        }
    };

    const handleFeatureSoon = (feature) => {
        Swal.fire({
            title: "Segera Hadir!",
            text: `Fitur ${feature} sedang dalam tahap pengembangan.`,
            icon: "info",
            confirmButtonColor: "#22d3ee",
        });
    };

    return (
        <div className="h-full flex flex-col bg-background font-poppins px-6 py-4 overflow-hidden">
            {/* Header Section */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between mb-4 flex-shrink-0">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">
                        Stock Management
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">
                        Manage inventory movements
                    </p>
                </div>
            </div>

            {/* Filter Section (Ditambahkan mirip AdminProducts) */}
            <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 mb-4 flex-shrink-0">
                <div className="relative flex-1">
                    <FiSearch
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                        size={18}
                    />
                    <input
                        type="text"
                        placeholder="Search by product name or SKU..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-primary text-sm"
                    />
                </div>
                <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="py-2 px-4 rounded-xl border border-gray-200 focus:outline-none focus:border-primary text-sm min-w-[200px]"
                >
                    <option value="All">All Categories</option>
                    <option value="Nugget">Nugget</option>
                    <option value="Fish">Fish</option>
                    <option value="Fries">Fries</option>
                    <option value="Meatball">Meatball</option>
                    <option value="Seafood">Seafood</option>
                    <option value="Vegetables">Vegetables</option>
                </select>
            </div>

            {/* Table Section */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm h-fit flex flex-col overflow-hidden">
                <div className="w-full">
                    <table className="w-full text-left table-fixed border-collapse">
                        <thead className="bg-gray-50/50">
                            <tr className="text-gray-500 text-sm border-b border-gray-100">
                                <th className="py-3 px-5 font-medium w-[30%]">
                                    Product Name
                                </th>
                                <th className="py-3 px-4 font-medium w-[15%]">
                                    SKU
                                </th>
                                <th className="py-3 px-4 font-medium w-[15%]">
                                    Category
                                </th>
                                <th className="py-3 px-4 font-medium w-[15%]">
                                    Stock
                                </th>
                                <th className="py-3 px-4 font-medium w-[12%]">
                                    Status
                                </th>
                                <th className="py-3 px-4 font-medium w-[13%] text-center">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td
                                        colSpan="6"
                                        className="py-8 text-center text-gray-400"
                                    >
                                        Loading stock data...
                                    </td>
                                </tr>
                            ) : currentProducts.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan="6"
                                        className="py-8 text-center text-gray-400"
                                    >
                                        Tidak ada produk ditemukan.
                                    </td>
                                </tr>
                            ) : (
                                currentProducts.map((product) => {
                                    const sku = `FRZ-${product._id.substring(18, 24).toUpperCase()}`;
                                    const isCritical =
                                        product.stok_saat_ini <=
                                        product.batas_stok_minimum;

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
                                            <td className="py-3.5 px-4">
                                                <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-xs font-semibold whitespace-nowrap inline-block">
                                                    {product.kategori}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 truncate">
                                                <span className="font-bold text-gray-800">
                                                    {product.stok_saat_ini}
                                                </span>
                                                <span className="text-gray-500 text-sm ml-1">
                                                    units
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <span
                                                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap inline-block ${
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
                                            <td className="py-3.5 px-4">
                                                <div className="flex items-center justify-center gap-4 text-lg">
                                                    <button
                                                        onClick={() =>
                                                            handleUpdateStock(
                                                                product,
                                                                "add",
                                                            )
                                                        }
                                                        className="text-emerald-500 hover:text-emerald-700 transition font-bold cursor-pointer bg-transparent border-none"
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
                                                        className="text-red-500 hover:text-red-700 transition font-bold cursor-pointer bg-transparent border-none"
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

                {/* Pagination Control */}
                {totalPages > 1 && (
                    <div className="p-3 border-t border-gray-100 bg-gray-50/30 flex items-center justify-end gap-2">
                        <button
                            onClick={() => paginate(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="p-2 rounded-lg border border-gray-200 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white transition flex items-center justify-center bg-transparent cursor-pointer"
                        >
                            <FiChevronLeft size={18} />
                        </button>

                        <div className="text-sm text-gray-600 mx-2">
                            Page{" "}
                            <span className="font-semibold text-gray-800">
                                {totalPages === 0 ? 0 : currentPage}
                            </span>{" "}
                            of{" "}
                            <span className="font-semibold text-gray-800">
                                {totalPages}
                            </span>
                        </div>

                        <button
                            onClick={() => paginate(currentPage + 1)}
                            disabled={
                                currentPage === totalPages || totalPages === 0
                            }
                            className="p-2 rounded-lg border border-gray-200 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white transition flex items-center justify-center bg-transparent cursor-pointer"
                        >
                            <FiChevronRight size={18} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminStock;
