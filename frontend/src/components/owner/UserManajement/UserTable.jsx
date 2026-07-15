import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

const UserTable = ({
    users = [],
    isLoading,
    fetchUsers,
    setShowEditModal,
    setSelectedUser,
}) => {
    const [currentPage, setCurrentPage] = useState(1);
    const usersPerPage = 5;

    useEffect(() => {
        setCurrentPage(1);
    }, [users]);

    // ================= LOGIKA PAGINATION =================
    const indexOfLastUser = currentPage * usersPerPage;
    const indexOfFirstUser = indexOfLastUser - usersPerPage;
    const currentUsers = (users || []).slice(
        indexOfFirstUser,
        indexOfLastUser,
    );
    const totalPages = Math.ceil((users || []).length / usersPerPage);
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    // Fungsi untuk menghapus user
    const handleDelete = (id) => {
        Swal.fire({
            title: "Yakin ingin menghapus user ini?",
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
                    const userInfo = JSON.parse(
                        localStorage.getItem("userInfo"),
                    );
                    const config = {
                        headers: { Authorization: `Bearer ${userInfo?.token}` },
                    };

                    await axios.delete(
                        `http://localhost:5000/api/users/${id}`,
                        config,
                    );

                    Swal.fire("Terhapus!", "User berhasil dihapus.", "success");
                    fetchUsers(); // Refresh tabel setelah dihapus
                } catch (error) {
                    Swal.fire(
                        "Gagal!",
                        error.response?.data?.message ||
                            "Gagal menghapus user.",
                        "error",
                    );
                }
            }
        });
    };

    return (
        <div className="bg-card border border-border rounded-2xl p-6 overflow-x-auto">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-semibold text-text">
                        User List
                    </h2>
                    <p className="text-text-secondary text-sm mt-1">
                        Manage all registered users
                    </p>
                </div>

                <div className="text-sm text-text-secondary">
                    Total Users: {isLoading ? "..." : users?.length || 0}
                </div>
            </div>

            <table className="w-full min-w-[900px]">
                <thead>
                    <tr className="border-b border-border text-text-secondary text-sm">
                        <th className="text-left py-4 font-medium">
                            Full Name
                        </th>
                        <th className="text-left font-medium">Username</th>
                        <th className="text-left font-medium">Email</th>
                        <th className="text-left font-medium">Role</th>
                        <th className="text-left font-medium">Branch</th>
                        <th className="text-left font-medium">Status</th>
                        <th className="text-left font-medium">Actions</th>
                    </tr>
                </thead>

                <tbody>
                    {isLoading ? (
                        <tr>
                            <td
                                colSpan="7"
                                className="text-center py-8 text-text-secondary"
                            >
                                Loading users...
                            </td>
                        </tr>
                    ) : users?.length === 0 ? (
                        <tr>
                            <td
                                colSpan="7"
                                className="text-center py-8 text-text-secondary"
                            >
                                Belum ada data user.
                            </td>
                        </tr>
                    ) : (
                        currentUsers.map((user) => {
                            // Mengambil inisial huruf pertama dari nama lengkap
                            const initial = user.nama_lengkap
                                ? user.nama_lengkap.charAt(0).toUpperCase()
                                : "U";

                            // Asumsi status aktif jika tidak ada field status di DB
                            const userStatus = user.status || "Active";

                            return (
                                <tr
                                    key={user._id} // Gunakan _id dari database sebagai key
                                    className="border-b border-border hover:bg-background transition-all duration-200"
                                >
                                    <td className="py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center text-sidebar font-bold">
                                                {initial}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-text">
                                                    {user.nama_lengkap}
                                                </p>
                                                <p className="text-sm text-text-secondary">
                                                    {user.role} Account
                                                </p>
                                            </div>
                                        </div>
                                    </td>

                                    <td className="text-text">
                                        {user.username}
                                    </td>

                                    <td className="text-text">
                                        {user.email || "-"}
                                    </td>

                                    <td>
                                        <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold">
                                            {user.role}
                                        </span>
                                    </td>

                                    <td className="text-text">
                                        {user.cabang || "-"}
                                    </td>

                                    <td>
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${userStatus === 'Active' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                                            {userStatus}
                                        </span>
                                    </td>

                                    <td>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => {
                                                    setSelectedUser(user);
                                                    setShowEditModal(true);
                                                }}
                                                className="bg-warning/10 text-warning px-4 py-2 rounded-xl text-sm font-medium hover:bg-warning/20 transition-all duration-200"
                                            >
                                                Edit
                                            </button>

                                            <button
                                                onClick={() =>
                                                    handleDelete(user._id)
                                                }
                                                className="bg-danger/10 text-danger px-4 py-2 rounded-xl text-sm font-medium hover:bg-danger/20 transition-all duration-200"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="p-3 border-t border-border mt-4 flex items-center justify-end gap-2 bg-transparent">
                    <button
                        onClick={() => paginate(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="p-2 rounded-lg border border-border text-text-secondary disabled:opacity-40 disabled:cursor-not-allowed hover:bg-background transition flex items-center justify-center bg-transparent cursor-pointer"
                    >
                        <FiChevronLeft size={18} />
                    </button>
                    <div className="text-sm text-text-secondary mx-2">
                        Page{" "}
                        <span className="font-semibold text-text">
                            {totalPages === 0 ? 0 : currentPage}
                        </span>{" "}
                        of{" "}
                        <span className="font-semibold text-text">
                            {totalPages}
                        </span>
                    </div>
                    <button
                        onClick={() => paginate(currentPage + 1)}
                        disabled={
                            currentPage === totalPages || totalPages === 0
                        }
                        className="p-2 rounded-lg border border-border text-text-secondary disabled:opacity-40 disabled:cursor-not-allowed hover:bg-background transition flex items-center justify-center bg-transparent cursor-pointer"
                    >
                        <FiChevronRight size={18} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default UserTable;
