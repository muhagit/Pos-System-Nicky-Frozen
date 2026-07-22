import React, { useState, useEffect, useCallback } from "react";
import api from "../../utils/api";
import Swal from "sweetalert2";
import {
    FiSearch,
    FiPlus,
    FiEdit,
    FiTrash2,
    FiX,
    FiChevronLeft,
    FiChevronRight,
} from "react-icons/fi";

const AdminProducts = () => {
    // State untuk Data
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // State untuk Pencarian & Filter (Backend)
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");

    // State untuk Pagination (Client-side)
    const [currentPage, setCurrentPage] = useState(1);
    const productsPerPage = 5;

    // State untuk Modal (Tambah/Edit)
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState(null);
    const [imageFile, setImageFile] = useState(null); // State khusus untuk file gambar
    const [categories, setCategories] = useState([]);
    const [formData, setFormData] = useState({
        nama_produk: "",
        sku: "",
        kategori: "Nugget",
        harga: "",
        stok_saat_ini: "",
        batas_stok_minimum: "",
        tanggal_expired: "",
    });

    const userInfo = JSON.parse(localStorage.getItem("userInfo"));

    // ================= 1. READ =================
    const fetchProducts = useCallback(async () => {
        setIsLoading(true);
        try {
            const config = {
                headers: { Authorization: `Bearer ${userInfo?.token}` },
            };
            let url = "/products?";
            if (searchQuery) url += `search=${searchQuery}&`;
            if (selectedCategory !== "All")
                url += `kategori=${selectedCategory}`;

            const { data } = await api.get(url, config);
            setProducts(data);
        } catch (error) {
            console.error("Gagal mengambil produk:", error);
        } finally {
            setIsLoading(false);
        }
    }, [searchQuery, selectedCategory]);

    const fetchCategories = useCallback(async () => {
        try {
            const config = {
                headers: { Authorization: `Bearer ${userInfo?.token}` },
            };
            const { data } = await api.get("/categories", config);
            setCategories(data);
        } catch (error) {
            console.error("Gagal mengambil kategori:", error);
        }
    }, [userInfo?.token]);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchProducts();
            setCurrentPage(1);
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [fetchProducts]);

    // ================= LOGIKA PAGINATION =================
    const indexOfLastProduct = currentPage * productsPerPage;
    const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
    const currentProducts = products.slice(
        indexOfFirstProduct,
        indexOfLastProduct,
    );
    const totalPages = Math.ceil(products.length / productsPerPage);
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    // ================= 2. DELETE =================
    const handleDelete = (id) => {
        Swal.fire({
            title: "Yakin ingin menghapus?",
            text: "Data tidak bisa dikembalikan!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
            cancelButtonColor: "#9ca3af",
            confirmButtonText: "Ya, Hapus!",
            cancelButtonText: "Batal",
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const config = {
                        headers: { Authorization: `Bearer ${userInfo?.token}` },
                    };
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

    // ================= 3. SAVE (Create/Update dgn Gambar) =================
    const handleSave = async (e) => {
        e.preventDefault();

        // 1. Buat FormData karena kita mengirim File
        const submitData = new FormData();
        submitData.append("nama_produk", formData.nama_produk);
        submitData.append("sku", formData.sku);
        submitData.append("kategori", formData.kategori);
        submitData.append("harga", formData.harga);
        submitData.append("stok_saat_ini", formData.stok_saat_ini);
        submitData.append("batas_stok_minimum", formData.batas_stok_minimum);
        submitData.append("tanggal_expired", formData.tanggal_expired);

        // Append gambar HANYA jika admin memilih gambar baru
        if (imageFile) {
            submitData.append("gambar", imageFile);
        }

        // 2. Setup Headers khusus Multipart
        const multipartConfig = {
            headers: {
                Authorization: `Bearer ${userInfo?.token}`,
                "Content-Type": "multipart/form-data",
            },
        };

        try {
            if (isEditing) {
                await api.put(
                    `/products/${currentId}`,
                    submitData,
                    multipartConfig,
                );
                Swal.fire("Berhasil!", "Data produk diperbarui.", "success");
            } else {
                await api.post(
                    "/products",
                    submitData,
                    multipartConfig,
                );
                Swal.fire("Berhasil!", "Produk baru ditambahkan.", "success");
            }
            closeModal();
            fetchProducts();
        } catch (error) {
            Swal.fire(
                "Gagal!",
                error.response?.data?.message || "Terjadi kesalahan.",
                "error",
            );
        }
    };

    // ================= PENDUKUNG MODAL =================
    const openModal = (product = null) => {
        setImageFile(null); // Reset input file setiap modal dibuka
        if (product) {
            setIsEditing(true);
            setCurrentId(product._id);
            setFormData({
                nama_produk: product.nama_produk,
                sku: product.sku || "",
                kategori: product.kategori,
                harga: product.harga,
                stok_saat_ini: product.stok_saat_ini,
                batas_stok_minimum: product.batas_stok_minimum,
                tanggal_expired: new Date(product.tanggal_expired)
                    .toISOString()
                    .split("T")[0],
            });
        } else {
            setIsEditing(false);
            setCurrentId(null);
            setFormData({
                nama_produk: "",
                sku: "",
                kategori: categories[0]?.nama_kategori || "",
                harga: "",
                stok_saat_ini: "",
                batas_stok_minimum: "",
                tanggal_expired: "",
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => setIsModalOpen(false);

    const formatRupiah = (number) =>
        new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(number);

    return (
        <div className="h-full flex flex-col bg-background font-poppins px-6 py-4 overflow-hidden">
            {/* Header Section */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between mb-4 flex-shrink-0">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">
                        Product Management
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">
                        {products.length} total products found
                    </p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="bg-primary hover:bg-cyan-500 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition shadow-md shadow-cyan-500/30 cursor-pointer border-none"
                >
                    <FiPlus size={20} /> Add Product
                </button>
            </div>

            {/* Filter Section */}
            <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 mb-4 flex-shrink-0">
                <div className="relative flex-1">
                    <FiSearch
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                        size={18}
                    />
                    <input
                        type="text"
                        placeholder="Search by product name..."
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
                    {categories.map((cat) => (
                        <option key={cat._id} value={cat.nama_kategori}>
                            {cat.nama_kategori}
                        </option>
                    ))}
                </select>
            </div>

            {/* Table Section */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm h-fit flex flex-col overflow-hidden">
                <div className="w-full">
                    <table className="w-full text-left table-fixed border-collapse">
                        <thead className="bg-gray-50/50">
                            <tr className="text-gray-500 text-sm border-b border-gray-100">
                                <th className="py-3 px-5 font-medium w-[25%]">
                                    Product Name
                                </th>
                                <th className="py-3 px-4 font-medium w-[12%]">
                                    SKU
                                </th>
                                <th className="py-3 px-4 font-medium w-[12%]">
                                    Category
                                </th>
                                <th className="py-3 px-4 font-medium w-[10%]">
                                    Stock
                                </th>
                                <th className="py-3 px-4 font-medium w-[13%]">
                                    Price
                                </th>
                                <th className="py-3 px-4 font-medium w-[10%]">
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
                                        <div className="flex justify-center items-center gap-2">
                                            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                            Loading products...
                                        </div>
                                    </td>
                                </tr>
                            ) : currentProducts.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan="7"
                                        className="py-8 text-center text-gray-400"
                                    >
                                        Tidak ada produk ditemukan.
                                    </td>
                                </tr>
                            ) : (
                                currentProducts.map((product) => {
                                    const sku = product.sku || `FRZ-${product._id.substring(18, 24).toUpperCase()}`;
                                    const isCritical =
                                        product.stok_saat_ini <= 0;
                                    const isLow =
                                        product.stok_saat_ini <=
                                        product.batas_stok_minimum &&
                                        product.stok_saat_ini > 0;

                                    return (
                                        <tr
                                            key={product._id}
                                            className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition"
                                        >
                                            <td className="py-3.5 px-5 flex items-center gap-3 overflow-hidden">
                                                {/* Thumbnail Gambar Produk */}
                                                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden border border-gray-200">
                                                    {product.gambar ? (
                                                        <img
                                                            src={`${import.meta.env.VITE_API_URL || "http://localhost:5000"}${product.gambar}`}
                                                            alt={
                                                                product.nama_produk
                                                            }
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <span className="text-[10px] text-gray-400">
                                                            No Img
                                                        </span>
                                                    )}
                                                </div>
                                                <span
                                                    className="font-semibold text-gray-800 truncate"
                                                    title={product.nama_produk}
                                                >
                                                    {product.nama_produk}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 text-gray-500 text-sm truncate">
                                                {sku}
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-xs font-semibold whitespace-nowrap inline-block">
                                                    {product.kategori}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 text-gray-700 truncate">
                                                <span className="font-bold">
                                                    {product.stok_saat_ini}
                                                </span>{" "}
                                                <span className="text-sm">
                                                    units
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 font-bold text-gray-800 truncate">
                                                {formatRupiah(product.harga)}
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <span
                                                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap inline-block ${isCritical
                                                            ? "bg-red-100 text-red-600"
                                                            : isLow
                                                                ? "bg-amber-100 text-amber-600"
                                                                : "bg-emerald-100 text-emerald-600"
                                                        }`}
                                                >
                                                    {isCritical
                                                        ? "Critical"
                                                        : isLow
                                                            ? "Low Stock"
                                                            : "In Stock"}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <div className="flex items-center justify-center gap-3">
                                                    <button
                                                        onClick={() =>
                                                            openModal(product)
                                                        }
                                                        className="text-blue-500 hover:text-blue-700 transition cursor-pointer border-none bg-transparent"
                                                        title="Edit"
                                                    >
                                                        <FiEdit size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            handleDelete(
                                                                product._id,
                                                            )
                                                        }
                                                        className="text-red-500 hover:text-red-700 transition cursor-pointer border-none bg-transparent"
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

                {/* Pagination */}
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

            {/* Modal Form */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-fade-in">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-lg text-gray-800">
                                {isEditing ? "Edit Product" : "Add New Product"}
                            </h3>
                            <button
                                onClick={closeModal}
                                className="text-gray-400 hover:text-red-500 transition cursor-pointer bg-transparent border-none"
                            >
                                <FiX size={24} />
                            </button>
                        </div>

                        <form
                            onSubmit={handleSave}
                            className="p-6 flex flex-col gap-4"
                        >
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">
                                    Product Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.nama_produk}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            nama_produk: e.target.value,
                                        })
                                    }
                                    className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:border-primary"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">
                                    SKU Code
                                </label>
                                <input
                                    type="text"
                                    placeholder="E.g. FRZ-CHKN01"
                                    value={formData.sku}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            sku: e.target.value,
                                        })
                                    }
                                    className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:border-primary"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                                        Category
                                    </label>
                                    <select
                                        value={formData.kategori}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                kategori: e.target.value,
                                            })
                                        }
                                        className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:border-primary"
                                    >
                                        {categories.map((cat) => (
                                            <option key={cat._id} value={cat.nama_kategori}>
                                                {cat.nama_kategori}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                                        Price (Rp)
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        value={formData.harga}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                harga: e.target.value,
                                            })
                                        }
                                        className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:border-primary"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                                        Current Stock
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        value={formData.stok_saat_ini}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                stok_saat_ini: e.target.value,
                                            })
                                        }
                                        className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:border-primary"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                                        Min. Stock Alert
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        value={formData.batas_stok_minimum}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                batas_stok_minimum:
                                                    e.target.value,
                                            })
                                        }
                                        className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:border-primary"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                                        Expiry Date
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.tanggal_expired}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                tanggal_expired: e.target.value,
                                            })
                                        }
                                        className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:border-primary"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                                        Product Image
                                    </label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) =>
                                            setImageFile(e.target.files[0])
                                        }
                                        className="w-full border border-gray-300 rounded-xl px-3 py-1.5 focus:outline-none focus:border-primary text-sm file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                                    />
                                </div>
                            </div>

                            <div className="mt-4 flex gap-3 justify-end">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-5 py-2 rounded-xl font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition cursor-pointer border-none"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 rounded-xl font-medium text-white bg-primary hover:bg-cyan-500 transition shadow-md shadow-cyan-500/30 cursor-pointer border-none"
                                >
                                    {isEditing ? "Save Changes" : "Add Product"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminProducts;
