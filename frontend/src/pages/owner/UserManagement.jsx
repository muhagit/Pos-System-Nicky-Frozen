import { useState, useEffect } from "react";
import api from "../../utils/api"; // Pastikan axios sudah di-import

import AddUserForm from "../../components/owner/UserManajement/AddUserForm";
import UserTable from "../../components/owner/UserManajement/UserTable";
import EditUserForm from "../../components/owner/UserManajement/EditUserForm";

const UserManagement = () => {
    const [showModal, setShowModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    // State baru untuk menyimpan data dari backend
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedRole, setSelectedRole] = useState("All");
    const [selectedBranch, setSelectedBranch] = useState("All");
    const [branches, setBranches] = useState([]);

    // Fungsi untuk mengambil data user dari backend
    const fetchUsers = async () => {
        try {
            // Ambil token untuk otorisasi (karena ini halaman Owner/Admin)
            const userInfo = JSON.parse(localStorage.getItem("userInfo"));
            const config = {
                headers: { Authorization: `Bearer ${userInfo?.token}` },
            };

            // Ganti URL ini jika endpoint backend Anda berbeda
            const { data } = await api.get(
                "/users",
                config,
            );

            setUsers(data);
            setIsLoading(false);
        } catch (error) {
            console.error("Gagal mengambil data user:", error);
            setIsLoading(false);
        }
    };

    const fetchBranches = async () => {
        try {
            const userInfo = JSON.parse(localStorage.getItem("userInfo"));
            const config = {
                headers: { Authorization: `Bearer ${userInfo?.token}` },
            };
            const { data } = await api.get(
                "/branches",
                config
            );
            setBranches(data || []);
        } catch (error) {
            console.error("Gagal mengambil data cabang:", error);
        }
    };

    // Panggil fetchUsers saat halaman pertama kali dibuka
    useEffect(() => {
        fetchUsers();
        fetchBranches();
    }, []);

    // Reset filter cabang ketika filter role berubah
    useEffect(() => {
        setSelectedBranch("All");
    }, [selectedRole]);

    // Filter user berdasarkan role dan cabang yang dipilih
    const filteredUsers = users.filter(user => {
        // Filter berdasarkan role
        if (selectedRole !== "All") {
            if (!user.role || user.role.toLowerCase() !== selectedRole.toLowerCase()) {
                return false;
            }
        }
        // Filter berdasarkan cabang (hanya jika role adalah Kasir dan cabang bukan "All")
        if (selectedRole === "Kasir" && selectedBranch !== "All") {
            if (!user.cabang || user.cabang.toLowerCase() !== selectedBranch.toLowerCase()) {
                return false;
            }
        }
        return true;
    });

    return (
        <div className="p-6 min-h-screen bg-background overflow-y-auto">
            {/* HEADER */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-text">
                        User Management
                    </h1>
                    <p className="text-text-secondary mt-1">
                        Manage system users and permissions
                    </p>
                </div>

                <button
                    onClick={() => {
                        setSelectedUser(null);
                        setShowModal(true);
                    }}
                    className="bg-primary hover:bg-primary-dark text-sidebar font-semibold px-5 py-3 rounded-2xl transition-all duration-200"
                >
                    + Add User
                </button>
            </div>

            {/* FILTER ROLE */}
            <div className="flex items-center gap-2 mb-6 bg-card border border-border p-1.5 rounded-2xl shadow-sm w-fit">
                <button
                    onClick={() => setSelectedRole("All")}
                    className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                        selectedRole === "All"
                            ? "bg-primary text-sidebar shadow-sm"
                            : "text-text-secondary hover:text-text hover:bg-background"
                    }`}
                >
                    Semua Role
                </button>
                <button
                    onClick={() => setSelectedRole("Owner")}
                    className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                        selectedRole === "Owner"
                            ? "bg-primary text-sidebar shadow-sm"
                            : "text-text-secondary hover:text-text hover:bg-background"
                    }`}
                >
                    Owner
                </button>
                <button
                    onClick={() => setSelectedRole("Admin")}
                    className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                        selectedRole === "Admin"
                            ? "bg-primary text-sidebar shadow-sm"
                            : "text-text-secondary hover:text-text hover:bg-background"
                    }`}
                >
                    Admin
                </button>
                <button
                    onClick={() => setSelectedRole("Kasir")}
                    className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                        selectedRole === "Kasir"
                            ? "bg-primary text-sidebar shadow-sm"
                            : "text-text-secondary hover:text-text hover:bg-background"
                    }`}
                >
                    Kasir
                </button>
            </div>

            {/* FILTER CABANG KASIR */}
            {selectedRole === "Kasir" && (
                <div className="flex items-center gap-2 mb-6 bg-card border border-border p-1.5 rounded-2xl shadow-sm w-fit animate-fade-in">
                    <span className="text-xs font-semibold text-text-secondary px-3 select-none">
                        Cabang Kasir:
                    </span>
                    <button
                        onClick={() => setSelectedBranch("All")}
                        className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                            selectedBranch === "All"
                                ? "bg-primary text-sidebar shadow-sm"
                                : "text-text-secondary hover:text-text hover:bg-background"
                        }`}
                    >
                        Semua Cabang
                    </button>
                    {branches.map((b) => (
                        <button
                            key={b._id}
                            onClick={() => setSelectedBranch(b.name)}
                            className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                                selectedBranch.toLowerCase() === b.name.toLowerCase()
                                    ? "bg-primary text-sidebar shadow-sm"
                                    : "text-text-secondary hover:text-text hover:bg-background"
                            }`}
                        >
                            {b.name}
                        </button>
                    ))}
                </div>
            )}

            {/* TABLE */}
            {/* Oper data users dan fetchUsers ke dalam tabel */}
            <UserTable
                users={filteredUsers}
                isLoading={isLoading}
                fetchUsers={fetchUsers}
                setShowEditModal={setShowEditModal}
                setSelectedUser={setSelectedUser}
            />

            {/* MODAL */}
            {/* Oper fetchUsers agar form bisa me-refresh tabel setelah sukses save */}
            <AddUserForm
                showModal={showModal}
                setShowModal={setShowModal}
                fetchUsers={fetchUsers}
            />

            <EditUserForm
                showModal={showEditModal}
                setShowModal={setShowEditModal}
                selectedUser={selectedUser}
                fetchUsers={fetchUsers}
            />
        </div>
    );
};

export default UserManagement;
