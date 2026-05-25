import { useState, useEffect } from "react";
import axios from "axios"; // Pastikan axios sudah di-import

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

    // Fungsi untuk mengambil data user dari backend
    const fetchUsers = async () => {
        try {
            // Ambil token untuk otorisasi (karena ini halaman Owner/Admin)
            const userInfo = JSON.parse(localStorage.getItem("userInfo"));
            const config = {
                headers: { Authorization: `Bearer ${userInfo?.token}` },
            };

            // Ganti URL ini jika endpoint backend Anda berbeda
            const { data } = await axios.get(
                "http://localhost:5000/api/users",
                config,
            );

            setUsers(data);
            setIsLoading(false);
        } catch (error) {
            console.error("Gagal mengambil data user:", error);
            setIsLoading(false);
        }
    };

    // Panggil fetchUsers saat halaman pertama kali dibuka
    useEffect(() => {
        fetchUsers();
    }, []);

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

            {/* TABLE */}
            {/* Oper data users dan fetchUsers ke dalam tabel */}
            <UserTable
                users={users}
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
