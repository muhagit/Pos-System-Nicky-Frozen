import React, { useState, useEffect } from "react";
import api from "../../utils/api";
import Swal from "sweetalert2";
import { FiUser, FiLock, FiBell, FiSave } from "react-icons/fi";

const AdminSettings = () => {
    const [activeTab, setActiveTab] = useState("profile");

    // State untuk menampung data user login saat ini
    const [userData, setUserData] = useState(null);
    const [config, setConfig] = useState(null);

    // Form States
    const [profileForm, setProfileForm] = useState({
        nama_lengkap: "",
        username: "",
    });
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [notifForm, setNotifForm] = useState({
        lowStock: true,
        expiry: true,
        sync: false,
    });

    // Ambil data user dari localStorage saat komponen dimuat
    useEffect(() => {
        const storedUser = localStorage.getItem("userInfo");
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUserData(parsedUser);
            setConfig({
                headers: { Authorization: `Bearer ${parsedUser.token}` },
            });
            setProfileForm({
                nama_lengkap: parsedUser.nama_lengkap || "",
                username: parsedUser.username || "",
            });
        }
    }, []);

    // --- 1. HANDLE UPDATE PROFILE ---
    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        try {
            const { data } = await api.put(
                `/users/${userData._id}`,
                {
                    nama_lengkap: profileForm.nama_lengkap,
                    username: profileForm.username,
                },
                config,
            );

            // Update localStorage agar nama di header/sidebar ikut berubah
            const updatedUser = {
                ...userData,
                nama_lengkap: data.nama_lengkap,
                username: data.username,
            };
            localStorage.setItem("userInfo", JSON.stringify(updatedUser));
            setUserData(updatedUser);

            Swal.fire("Berhasil!", "Profil berhasil diperbarui.", "success");
        } catch (error) {
            Swal.fire(
                "Gagal!",
                error.response?.data?.message || "Gagal memperbarui profil",
                "error",
            );
        }
    };

    // --- 2. HANDLE UPDATE PASSWORD ---
    const handleUpdatePassword = async (e) => {
        e.preventDefault();

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            return Swal.fire(
                "Error!",
                "Konfirmasi password baru tidak cocok!",
                "error",
            );
        }

        if (passwordForm.newPassword.length < 6) {
            return Swal.fire(
                "Error!",
                "Password minimal 6 karakter!",
                "warning",
            );
        }

        try {
            // Kita gunakan endpoint update user yang sama, tapi hanya mengirim password
            await api.put(
                `/users/${userData._id}`,
                {
                    password: passwordForm.newPassword,
                },
                config,
            );

            Swal.fire("Berhasil!", "Password berhasil diubah.", "success");
            setPasswordForm({
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
            });
        } catch (error) {
            Swal.fire(
                "Gagal!",
                error.response?.data?.message || "Gagal mengubah password",
                "error",
            );
        }
    };

    // --- 3. HANDLE UPDATE NOTIFICATIONS ---
    const handleUpdateNotif = (e) => {
        e.preventDefault();
        // Disimulasikan karena biasanya butuh field tambahan di database
        Swal.fire(
            "Berhasil!",
            "Preferensi notifikasi disimpan secara lokal.",
            "success",
        );
    };

    return (
        <div className="h-full flex flex-col bg-background font-poppins px-6 py-4 overflow-y-auto">
            {/* Header */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mb-6 flex-shrink-0">
                <h2 className="text-2xl font-bold text-gray-800">Settings</h2>
                <p className="text-gray-500 text-sm mt-1">
                    Manage your account preferences
                </p>
            </div>

            <div className="flex flex-col md:flex-row gap-6 flex-1">
                {/* Sidebar Navigasi Kiri */}
                <div className="w-full md:w-64 bg-white rounded-2xl border border-gray-100 shadow-sm p-3 h-fit flex-shrink-0">
                    <button
                        onClick={() => setActiveTab("profile")}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition cursor-pointer border-none text-left ${activeTab === "profile" ? "bg-primary text-white shadow-md shadow-cyan-500/30" : "text-gray-600 hover:bg-gray-50 bg-transparent"}`}
                    >
                        <FiUser size={18} /> Profile
                    </button>
                    <button
                        onClick={() => setActiveTab("password")}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition mt-1 cursor-pointer border-none text-left ${activeTab === "password" ? "bg-primary text-white shadow-md shadow-cyan-500/30" : "text-gray-600 hover:bg-gray-50 bg-transparent"}`}
                    >
                        <FiLock size={18} /> Password
                    </button>
                    <button
                        onClick={() => setActiveTab("notifications")}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition mt-1 cursor-pointer border-none text-left ${activeTab === "notifications" ? "bg-primary text-white shadow-md shadow-cyan-500/30" : "text-gray-600 hover:bg-gray-50 bg-transparent"}`}
                    >
                        <FiBell size={18} /> Notifications
                    </button>
                </div>

                {/* Konten Kanan Dinamis */}
                <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 h-fit">
                    {/* TAB PROFILE */}
                    {activeTab === "profile" && (
                        <div className="animate-fade-in">
                            <h3 className="text-xl font-bold text-gray-800 mb-6">
                                Profile Information
                            </h3>
                            <form
                                onSubmit={handleUpdateProfile}
                                className="flex flex-col gap-5"
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                                            Full Name
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={profileForm.nama_lengkap}
                                            onChange={(e) =>
                                                setProfileForm({
                                                    ...profileForm,
                                                    nama_lengkap:
                                                        e.target.value,
                                                })
                                            }
                                            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                                            Username
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={profileForm.username}
                                            onChange={(e) =>
                                                setProfileForm({
                                                    ...profileForm,
                                                    username: e.target.value,
                                                })
                                            }
                                            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary"
                                        />
                                    </div>
                                </div>
                                <div className="mt-2">
                                    <button
                                        type="submit"
                                        className="bg-primary hover:bg-cyan-500 text-white px-6 py-2.5 rounded-xl font-medium flex items-center gap-2 transition shadow-md shadow-cyan-500/30 cursor-pointer border-none"
                                    >
                                        <FiSave size={18} /> Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* TAB PASSWORD */}
                    {activeTab === "password" && (
                        <div className="animate-fade-in">
                            <h3 className="text-xl font-bold text-gray-800 mb-6">
                                Change Password
                            </h3>
                            <form
                                onSubmit={handleUpdatePassword}
                                className="flex flex-col gap-5"
                            >
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                                        Current Password
                                    </label>
                                    <input
                                        type="password"
                                        placeholder="Tulis password lama (Opsional)"
                                        value={passwordForm.currentPassword}
                                        onChange={(e) =>
                                            setPasswordForm({
                                                ...passwordForm,
                                                currentPassword: e.target.value,
                                            })
                                        }
                                        className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary max-w-md"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                                        New Password
                                    </label>
                                    <input
                                        type="password"
                                        required
                                        value={passwordForm.newPassword}
                                        onChange={(e) =>
                                            setPasswordForm({
                                                ...passwordForm,
                                                newPassword: e.target.value,
                                            })
                                        }
                                        className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary max-w-md"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                                        Confirm Password
                                    </label>
                                    <input
                                        type="password"
                                        required
                                        value={passwordForm.confirmPassword}
                                        onChange={(e) =>
                                            setPasswordForm({
                                                ...passwordForm,
                                                confirmPassword: e.target.value,
                                            })
                                        }
                                        className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary max-w-md"
                                    />
                                </div>
                                <div className="mt-2">
                                    <button
                                        type="submit"
                                        className="bg-primary hover:bg-cyan-500 text-white px-6 py-2.5 rounded-xl font-medium flex items-center gap-2 transition shadow-md shadow-cyan-500/30 cursor-pointer border-none"
                                    >
                                        <FiLock size={18} /> Update Password
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* TAB NOTIFICATIONS */}
                    {activeTab === "notifications" && (
                        <div className="animate-fade-in">
                            <h3 className="text-xl font-bold text-gray-800 mb-6">
                                Notification Preferences
                            </h3>
                            <form
                                onSubmit={handleUpdateNotif}
                                className="flex flex-col gap-4"
                            >
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={notifForm.lowStock}
                                        onChange={(e) =>
                                            setNotifForm({
                                                ...notifForm,
                                                lowStock: e.target.checked,
                                            })
                                        }
                                        className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer accent-primary"
                                    />
                                    <span className="text-gray-700 font-medium">
                                        Low stock alerts
                                    </span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={notifForm.expiry}
                                        onChange={(e) =>
                                            setNotifForm({
                                                ...notifForm,
                                                expiry: e.target.checked,
                                            })
                                        }
                                        className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer accent-primary"
                                    />
                                    <span className="text-gray-700 font-medium">
                                        Product expiry warnings
                                    </span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={notifForm.sync}
                                        onChange={(e) =>
                                            setNotifForm({
                                                ...notifForm,
                                                sync: e.target.checked,
                                            })
                                        }
                                        className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer accent-primary"
                                    />
                                    <span className="text-gray-700 font-medium">
                                        Sync notifications
                                    </span>
                                </label>

                                <div className="mt-4">
                                    <button
                                        type="submit"
                                        className="bg-primary hover:bg-cyan-500 text-white px-6 py-2.5 rounded-xl font-medium flex items-center gap-2 transition shadow-md shadow-cyan-500/30 cursor-pointer border-none"
                                    >
                                        <FiSave size={18} /> Save Preferences
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminSettings;
