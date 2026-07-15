import { useState, useEffect } from "react";
import axios from "axios"; // Tambahkan import axios
import Swal from "sweetalert2";

// Ubah onSuccess menjadi fetchUsers agar sesuai dengan props dari UserManagement.jsx
const AddUserForm = ({ showModal, setShowModal, fetchUsers }) => {
    // State untuk form values
    const [formData, setFormData] = useState({
        fullName: "",
        username: "",
        password: "",
        role: "",
        branch: "",
        status: "Active",
    });

    const [branches, setBranches] = useState([]);

    useEffect(() => {
        const fetchBranches = async () => {
            try {
                const userInfo = JSON.parse(localStorage.getItem("userInfo"));
                const config = {
                    headers: { Authorization: `Bearer ${userInfo?.token}` },
                };
                const { data } = await axios.get(
                    "http://localhost:5000/api/branches?activeOnly=true",
                    config
                );
                setBranches(data || []);
            } catch (error) {
                console.error("Gagal mengambil data cabang:", error);
            }
        };

        if (showModal) {
            fetchBranches();
        }
    }, [showModal]);

    // Jika modal tidak ditampilkan, jangan render apa-apa
    if (!showModal) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const validateForm = () => {
        const requiredFields = [
            "fullName",
            "username",
            "password",
            "role",
        ];
        if (formData.role !== "Owner") {
            requiredFields.push("branch");
        }
        const missingFields = requiredFields.filter(
            (field) => !formData[field]?.trim(),
        );

        if (missingFields.length > 0) {
            Swal.fire({
                icon: "error",
                title: "Incomplete Form",
                text: "Please fill in all required fields: Full Name, Username, Password, Role, and Branch.",
                confirmButtonColor: "#d33",
                confirmButtonText: "OK",
            });
            return false;
        }
        return true;
    };

    const handleSave = async () => {
        if (!validateForm()) return;

        try {
            // 1. Ambil token otorisasi dari localStorage
            const userInfo = JSON.parse(localStorage.getItem("userInfo"));
            const config = {
                headers: { Authorization: `Bearer ${userInfo?.token}` },
            };

            // 2. Mapping data dari form (Inggris) ke format database backend (Indonesia)
            const payload = {
                nama_lengkap: formData.fullName,
                username: formData.username,
                password: formData.password,
                role: formData.role,
                cabang: formData.role === "Owner" ? "Pusat" : formData.branch,
                status: formData.status,
            };

            // 3. Kirim data ke backend
            await axios.post(
                "http://localhost:5000/api/users",
                payload,
                config,
            );

            // 4. Tampilkan pesan sukses
            await Swal.fire({
                icon: "success",
                title: "User Added!",
                text: "New user has been successfully created.",
                confirmButtonColor: "#3085d6",
                confirmButtonText: "OK",
                timer: 2000,
                timerProgressBar: true,
            });

            // 5. Bersihkan form kembali ke awal
            setFormData({
                fullName: "",
                username: "",
                password: "",
                role: "",
                branch: "",
                status: "Active",
            });

            // 6. Tutup modal dan refresh tabel data user
            setShowModal(false);
            if (fetchUsers) fetchUsers();
        } catch (error) {
            Swal.fire({
                icon: "error",
                title: "Failed",
                // Tampilkan pesan error langsung dari backend (misal: "Username sudah digunakan")
                text:
                    error.response?.data?.message ||
                    "An error occurred while saving the user.",
                confirmButtonColor: "#d33",
            });
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-card w-full max-w-2xl rounded-3xl p-6 border border-border">
                {/* HEADER */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-text">
                            Add User
                        </h2>
                        <p className="text-text-secondary text-sm mt-1">
                            Create a new system user
                        </p>
                    </div>
                    <button
                        onClick={() => setShowModal(false)}
                        className="text-text-secondary hover:text-danger text-2xl"
                    >
                        ×
                    </button>
                </div>

                {/* FORM */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* FULL NAME - required */}
                    <div>
                        <label className="text-sm font-medium text-text">
                            Full Name <span className="text-danger">*</span>
                        </label>
                        <input
                            type="text"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleChange}
                            placeholder="Enter full name"
                            className="w-full mt-2 border border-border rounded-xl px-4 py-3 bg-background outline-none text-text focus:border-primary"
                        />
                    </div>

                    {/* USERNAME - required */}
                    <div>
                        <label className="text-sm font-medium text-text">
                            Username <span className="text-danger">*</span>
                        </label>
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            placeholder="Enter username"
                            className="w-full mt-2 border border-border rounded-xl px-4 py-3 bg-background outline-none text-text focus:border-primary"
                        />
                    </div>

                    {/* PASSWORD - required */}
                    <div>
                        <label className="text-sm font-medium text-text">
                            Password <span className="text-danger">*</span>
                        </label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Enter password"
                            className="w-full mt-2 border border-border rounded-xl px-4 py-3 bg-background outline-none text-text focus:border-primary"
                        />
                    </div>

                    {/* ROLE - required */}
                    <div>
                        <label className="text-sm font-medium text-text">
                            Role <span className="text-danger">*</span>
                        </label>
                        <select
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            className="w-full mt-2 border border-border rounded-xl px-4 py-3 bg-background outline-none text-text focus:border-primary"
                        >
                            <option value="">Select Role</option>
                            <option value="Admin">Admin</option>
                            <option value="Owner">Owner</option>
                            <option value="Kasir">Kasir</option>
                        </select>
                    </div>

                    {/* BRANCH - required */}
                    {formData.role !== "Owner" && (
                        <div>
                            <label className="text-sm font-medium text-text">
                                Branch <span className="text-danger">*</span>
                            </label>
                            <select
                                name="branch"
                                value={formData.branch}
                                onChange={handleChange}
                                className="w-full mt-2 border border-border rounded-xl px-4 py-3 bg-background outline-none text-text focus:border-primary"
                            >
                                <option value="">Select Branch</option>
                                {branches.map((b) => (
                                    <option key={b._id} value={b.name}>
                                        {b.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* STATUS - optional, default Active */}
                    <div>
                        <label className="text-sm font-medium text-text">
                            Status
                        </label>
                        <select
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            className="w-full mt-2 border border-border rounded-xl px-4 py-3 bg-background outline-none text-text focus:border-primary"
                        >
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                    </div>
                </div>

                {/* FOOTER */}
                <div className="flex items-center justify-end gap-4 mt-8">
                    <button
                        onClick={() => setShowModal(false)}
                        className="px-5 py-3 rounded-2xl border border-border text-text hover:bg-background transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="bg-primary hover:bg-primary-dark text-sidebar font-semibold px-5 py-3 rounded-2xl transition-all duration-200"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddUserForm;
