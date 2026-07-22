import { useEffect, useState, useCallback } from "react";
import api from "../../utils/api";
import Swal from "sweetalert2";
import { FiSearch, FiPlus, FiEdit2, FiTrash2, FiArrowLeft, FiArrowRight } from "react-icons/fi";

const AdminCategories = () => {
    const [categories, setCategories] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState("latest");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(false);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState(null);
    const [namaKategori, setNamaKategori] = useState("");

    const userInfo = JSON.parse(localStorage.getItem("userInfo"));

    const fetchCategories = useCallback(async () => {
        setIsLoading(true);
        try {
            const config = {
                headers: { Authorization: `Bearer ${userInfo?.token}` },
            };
            let url = `/categories?search=${searchQuery}&sort=${sortBy}`;
            const { data } = await api.get(url, config);
            setCategories(data);
            setTotalPages(Math.ceil(data.length / 5)); // 5 items per page
        } catch (error) {
            console.error("Gagal memuat kategori:", error);
        } finally {
            setIsLoading(false);
        }
    }, [searchQuery, sortBy, userInfo?.token]);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchCategories();
            setCurrentPage(1);
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [fetchCategories]);

    const openModal = (category = null) => {
        if (category) {
            setIsEditing(true);
            setCurrentId(category._id);
            setNamaKategori(category.nama_kategori);
        } else {
            setIsEditing(false);
            setCurrentId(null);
            setNamaKategori("");
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!namaKategori.trim()) {
            Swal.fire("Peringatan", "Nama kategori tidak boleh kosong", "warning");
            return;
        }

        try {
            const config = {
                headers: { Authorization: `Bearer ${userInfo?.token}` },
            };
            const payload = { nama_kategori: namaKategori.trim() };

            if (isEditing) {
                await api.put(`/categories/${currentId}`, payload, config);
                Swal.fire({
                    title: "Berhasil!",
                    text: "Kategori berhasil diperbarui.",
                    icon: "success",
                    timer: 1500,
                    showConfirmButton: false,
                });
            } else {
                await api.post("/categories", payload, config);
                Swal.fire({
                    title: "Berhasil!",
                    text: "Kategori baru berhasil ditambahkan.",
                    icon: "success",
                    timer: 1500,
                    showConfirmButton: false,
                });
            }
            setIsModalOpen(false);
            fetchCategories();
        } catch (error) {
            Swal.fire({
                title: "Gagal!",
                text: error.response?.data?.message || "Terjadi kesalahan sistem.",
                icon: "error",
                confirmButtonColor: "#ef4444",
            });
        }
    };

    const handleDelete = async (id, name) => {
        const result = await Swal.fire({
            title: "Hapus Kategori?",
            text: `Apakah Anda yakin ingin menghapus kategori "${name}"?`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Ya, Hapus!",
            cancelButtonText: "Batal",
        });

        if (result.isConfirmed) {
            try {
                const config = {
                    headers: { Authorization: `Bearer ${userInfo?.token}` },
                };
                await api.delete(`/categories/${id}`, config);
                Swal.fire({
                    title: "Terhapus!",
                    text: "Kategori berhasil dihapus.",
                    icon: "success",
                    timer: 1500,
                    showConfirmButton: false,
                });
                fetchCategories();
            } catch (error) {
                Swal.fire({
                    title: "Gagal Menghapus!",
                    text: error.response?.data?.message || "Terjadi kesalahan sistem.",
                    icon: "error",
                    confirmButtonColor: "#ef4444",
                });
            }
        }
    };

    // Pagination Logic
    const itemsPerPage = 5;
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentCategories = categories.slice(indexOfFirstItem, indexOfLastItem);

    return (
        <div className="p-6 font-poppins min-h-[85vh] bg-[#f5f7fb]">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-[#021b3a]">Category Management</h1>
                    <p className="text-sm font-medium text-gray-500 mt-1">
                        Kelola data kategori produk katalog toko Anda
                    </p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="bg-primary hover:bg-primary-dark text-white px-5 py-3 rounded-2xl font-bold transition-all shadow-md shadow-cyan-500/10 flex items-center gap-2 border-none cursor-pointer"
                >
                    <FiPlus size={20} />
                    Add Category
                </button>
            </div>

            {/* Filter Card */}
            <div className="bg-white rounded-3xl p-5 shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center">
                <div className="flex-1 relative w-full">
                    <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search categories by name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full border border-gray-200 rounded-2xl pl-11 pr-4 py-3.5 outline-none focus:border-primary text-sm font-medium"
                    />
                </div>
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="border border-gray-200 rounded-2xl px-4 py-3.5 outline-none focus:border-primary text-sm font-semibold bg-gray-50 cursor-pointer w-full md:w-auto min-w-[180px]"
                >
                    <option value="latest">Latest Created</option>
                    <option value="oldest">Oldest Created</option>
                    <option value="asc">Alphabetical (A - Z)</option>
                    <option value="desc">Alphabetical (Z - A)</option>
                </select>
            </div>

            {/* Table */}
            <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-gray-400 uppercase text-[11px] font-bold tracking-wider border-b border-gray-100">
                                <th className="py-4 px-6">No</th>
                                <th className="py-4 px-6">Category Name</th>
                                <th className="py-4 px-6">Created Date</th>
                                <th className="py-4 px-6 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm font-medium text-slate-700">
                            {isLoading ? (
                                <tr>
                                    <td colSpan="4" className="py-8 text-center text-gray-400">
                                        Loading categories...
                                    </td>
                                </tr>
                            ) : currentCategories.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="py-8 text-center text-gray-400">
                                        No categories found.
                                    </td>
                                </tr>
                            ) : (
                                currentCategories.map((cat, idx) => (
                                    <tr key={cat._id} className="hover:bg-gray-50/50 transition">
                                        <td className="py-4 px-6 text-gray-400">{indexOfFirstItem + idx + 1}</td>
                                        <td className="py-4 px-6 font-bold text-slate-800">{cat.nama_kategori}</td>
                                        <td className="py-4 px-6 text-gray-400">
                                            {new Date(cat.createdAt).toLocaleDateString("id-ID", {
                                                day: "numeric",
                                                month: "long",
                                                year: "numeric",
                                            })}
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex justify-center items-center gap-3">
                                                <button
                                                    onClick={() => openModal(cat)}
                                                    className="p-2 hover:bg-amber-50 rounded-xl text-amber-500 transition border-none bg-transparent cursor-pointer"
                                                    title="Edit Category"
                                                >
                                                    <FiEdit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(cat._id, cat.nama_kategori)}
                                                    className="p-2 hover:bg-red-50 rounded-xl text-red-500 transition border-none bg-transparent cursor-pointer"
                                                    title="Delete Category"
                                                >
                                                    <FiTrash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                {totalPages > 1 && (
                    <div className="flex justify-between items-center px-6 py-4 border-t border-gray-100">
                        <span className="text-xs text-gray-400">
                            Page {currentPage} of {totalPages}
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="p-2 border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-transparent transition cursor-pointer bg-white"
                            >
                                <FiArrowLeft size={16} />
                            </button>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="p-2 border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-transparent transition cursor-pointer bg-white"
                            >
                                <FiArrowRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-xl animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-slate-800">
                                {isEditing ? "Edit Category" : "Add New Category"}
                            </h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-400 hover:text-slate-600 border-none bg-transparent cursor-pointer text-lg font-bold"
                            >
                                &times;
                            </button>
                        </div>
                        <form onSubmit={handleSave}>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                        Category Name
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="E.g., Meatballs, Ice Cream..."
                                        value={namaKategori}
                                        onChange={(e) => setNamaKategori(e.target.value)}
                                        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary"
                                        maxLength={40}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-sm font-semibold text-gray-500 hover:bg-gray-200 rounded-xl transition border-none bg-transparent cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2.5 text-sm font-bold text-white bg-primary hover:bg-primary-dark rounded-xl transition border-none cursor-pointer"
                                >
                                    {isEditing ? "Simpan Perubahan" : "Tambah Kategori"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminCategories;
