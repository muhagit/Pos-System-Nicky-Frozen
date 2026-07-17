import { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";

const AddUserForm = ({ showModal, setShowModal, fetchUsers }) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [isVerifying, setIsVerifying] = useState(false);
    
    // State untuk form values
    const [formData, setFormData] = useState({
        fullName: "",
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "",
        branch: "",
        status: "Active",
    });

    // Evaluasi kekuatan password secara real-time
    const password = formData.password || "";
    const hasMinLength = password.length >= 8;
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasLetterAndNum = hasLetter && hasNumber;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasUpperAndLower = hasUpper && hasLower;
    const hasSymbol = /[^A-Za-z0-9]/.test(password);
    const isPasswordStrong = hasMinLength && hasLetterAndNum && hasUpperAndLower && hasSymbol;

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
            // Reset step and form when modal is opened
            setCurrentStep(1);
            setFormData({
                fullName: "",
                username: "",
                email: "",
                password: "",
                confirmPassword: "",
                role: "",
                branch: "",
                status: "Active",
            });
        }
    }, [showModal]);

    // Jika modal tidak ditampilkan, jangan render apa-apa
    if (!showModal) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    // Validasi & navigasi Langkah 1 ke Langkah 2
    const handleNextStep1 = async () => {
        if (!formData.username.trim() || !formData.email.trim()) {
            return Swal.fire({
                icon: "warning",
                title: "Form Belum Lengkap",
                text: "Harap isi Username dan Email terlebih dahulu.",
                confirmButtonColor: "#3085d6"
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email.trim())) {
            return Swal.fire({
                icon: "error",
                title: "Format Email Salah",
                text: "Harap masukkan format email yang valid.",
                confirmButtonColor: "#d33"
            });
        }

        try {
            setIsVerifying(true);
            const userInfo = JSON.parse(localStorage.getItem("userInfo"));
            const config = {
                headers: { Authorization: `Bearer ${userInfo?.token}` },
            };

            const { data } = await axios.post(
                "http://localhost:5000/api/users/verify-step1",
                { username: formData.username.trim(), email: formData.email.trim() },
                config
            );

            if (data.success) {
                setCurrentStep(2);
            }
        } catch (error) {
            Swal.fire({
                icon: "error",
                title: "Verifikasi Gagal",
                text: error.response?.data?.message || "Terjadi kesalahan saat memverifikasi data.",
                confirmButtonColor: "#d33"
            });
        } finally {
            setIsVerifying(false);
        }
    };

    // Validasi & navigasi Langkah 2 ke Langkah 3
    const handleNextStep2 = () => {
        if (!formData.fullName.trim() || !formData.role) {
            return Swal.fire({
                icon: "warning",
                title: "Form Belum Lengkap",
                text: "Nama Lengkap dan Role wajib diisi.",
                confirmButtonColor: "#3085d6"
            });
        }

        if (formData.role !== "Owner" && !formData.branch) {
            return Swal.fire({
                icon: "warning",
                title: "Form Belum Lengkap",
                text: "Cabang wajib dipilih untuk Admin atau Kasir.",
                confirmButtonColor: "#3085d6"
            });
        }

        setCurrentStep(3);
    };

    // Proses penyimpanan final di Langkah 3
    const handleSave = async () => {
        if (!formData.password || !formData.confirmPassword) {
            return Swal.fire({
                icon: "warning",
                title: "Form Belum Lengkap",
                text: "Password dan Konfirmasi Password harus diisi.",
                confirmButtonColor: "#3085d6"
            });
        }

        if (!isPasswordStrong) {
            return Swal.fire({
                icon: "error",
                title: "Password Lemah",
                text: "Password Anda belum memenuhi seluruh persyaratan keamanan.",
                confirmButtonColor: "#d33"
            });
        }

        if (formData.password !== formData.confirmPassword) {
            return Swal.fire({
                icon: "error",
                title: "Konfirmasi Salah",
                text: "Password dan Konfirmasi Password tidak cocok.",
                confirmButtonColor: "#d33"
            });
        }

        try {
            const userInfo = JSON.parse(localStorage.getItem("userInfo"));
            const config = {
                headers: { Authorization: `Bearer ${userInfo?.token}` },
            };

            const payload = {
                nama_lengkap: formData.fullName.trim(),
                username: formData.username.trim(),
                email: formData.email.trim(),
                password: formData.password,
                role: formData.role,
                cabang: formData.role === "Owner" ? "Pusat" : formData.branch,
                status: formData.status,
            };

            await axios.post(
                "http://localhost:5000/api/users",
                payload,
                config
            );

            await Swal.fire({
                icon: "success",
                title: "User Berhasil Dibuat!",
                text: "Pengguna baru berhasil ditambahkan.",
                confirmButtonColor: "#3085d6",
                timer: 2000,
                timerProgressBar: true,
            });

            setShowModal(false);
            if (fetchUsers) fetchUsers();
        } catch (error) {
            Swal.fire({
                icon: "error",
                title: "Gagal",
                text: error.response?.data?.message || "Gagal menyimpan pengguna baru.",
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
                            Tambah Pengguna
                        </h2>
                        <p className="text-text-secondary text-sm mt-1">
                            Buat akun baru sistem
                        </p>
                    </div>
                    <button
                        onClick={() => setShowModal(false)}
                        className="text-text-secondary hover:text-danger text-2xl"
                    >
                        ×
                    </button>
                </div>

                {/* PROGRESS STEP INDICATOR */}
                <div className="flex items-center justify-between mb-8 px-4 select-none">
                    <div className="flex flex-col items-center">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                            currentStep >= 1 ? "bg-primary text-sidebar" : "bg-border text-text-secondary"
                        }`}>1</span>
                        <span className="text-[10px] font-semibold text-text-secondary mt-1">Akun</span>
                    </div>
                    <div className={`flex-1 h-0.5 mx-2 transition-all duration-300 ${currentStep >= 2 ? "bg-primary" : "bg-border"}`} />
                    <div className="flex flex-col items-center">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                            currentStep >= 2 ? "bg-primary text-sidebar" : "bg-border text-text-secondary"
                        }`}>2</span>
                        <span className="text-[10px] font-semibold text-text-secondary mt-1">Otoritas</span>
                    </div>
                    <div className={`flex-1 h-0.5 mx-2 transition-all duration-300 ${currentStep >= 3 ? "bg-primary" : "bg-border"}`} />
                    <div className="flex flex-col items-center">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                            currentStep >= 3 ? "bg-primary text-sidebar" : "bg-border text-text-secondary"
                        }`}>3</span>
                        <span className="text-[10px] font-semibold text-text-secondary mt-1">Keamanan</span>
                    </div>
                </div>

                {/* FORM BODY */}
                <div className="min-h-56">
                    {/* LANGKAH 1: Username & Email */}
                    {currentStep === 1 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-fade-in">
                            <div>
                                <label className="text-sm font-medium text-text">
                                    Username <span className="text-danger">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    placeholder="Masukkan username unik"
                                    className="w-full mt-2 border border-border rounded-xl px-4 py-3 bg-background outline-none text-text focus:border-primary"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium text-text">
                                    Email Aktif <span className="text-danger">*</span>
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="contoh@domain.com"
                                    className="w-full mt-2 border border-border rounded-xl px-4 py-3 bg-background outline-none text-text focus:border-primary"
                                />
                            </div>
                        </div>
                    )}

                    {/* LANGKAH 2: Nama Lengkap, Cabang, Role, Status */}
                    {currentStep === 2 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-fade-in">
                            <div>
                                <label className="text-sm font-medium text-text">
                                    Nama Lengkap <span className="text-danger">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    placeholder="Masukkan nama lengkap"
                                    className="w-full mt-2 border border-border rounded-xl px-4 py-3 bg-background outline-none text-text focus:border-primary"
                                />
                            </div>

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
                                    <option value="">Pilih Role</option>
                                    <option value="Admin">Admin</option>
                                    <option value="Owner">Owner</option>
                                    <option value="Kasir">Kasir</option>
                                </select>
                            </div>

                            {formData.role !== "Owner" && (
                                <div>
                                    <label className="text-sm font-medium text-text">
                                        Cabang <span className="text-danger">*</span>
                                    </label>
                                    <select
                                        name="branch"
                                        value={formData.branch}
                                        onChange={handleChange}
                                        className="w-full mt-2 border border-border rounded-xl px-4 py-3 bg-background outline-none text-text focus:border-primary"
                                    >
                                        <option value="">Pilih Cabang</option>
                                        {branches.map((b) => (
                                            <option key={b._id} value={b.name}>
                                                {b.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

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
                    )}

                    {/* LANGKAH 3: Password & Konfirmasi Password */}
                    {currentStep === 3 && (
                        <div className="space-y-5 animate-fade-in">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="text-sm font-medium text-text">
                                        Password <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="Masukkan password"
                                        className="w-full mt-2 border border-border rounded-xl px-4 py-3 bg-background outline-none text-text focus:border-primary"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-text">
                                        Konfirmasi Password <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        placeholder="Ketik ulang password"
                                        className="w-full mt-2 border border-border rounded-xl px-4 py-3 bg-background outline-none text-text focus:border-primary"
                                    />
                                </div>
                            </div>

                            {/* Password requirements UI card */}
                            <div className="p-4 bg-background rounded-2xl border border-border text-xs text-text-secondary space-y-2">
                                <p className="font-semibold text-text mb-2">Persyaratan Password:</p>
                                <div className="flex items-center">
                                    {hasMinLength ? (
                                        <svg className="w-4 h-4 text-emerald-500 mr-2 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                    ) : (
                                        <svg className="w-4 h-4 text-text-secondary opacity-50 mr-2 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    )}
                                    <span className={hasMinLength ? "text-emerald-500 font-medium" : ""}>Minimal 8 karakter</span>
                                </div>
                                <div className="flex items-center">
                                    {hasLetterAndNum ? (
                                        <svg className="w-4 h-4 text-emerald-500 mr-2 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                    ) : (
                                        <svg className="w-4 h-4 text-text-secondary opacity-50 mr-2 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    )}
                                    <span className={hasLetterAndNum ? "text-emerald-500 font-medium" : ""}>Terdiri dari huruf dan angka</span>
                                </div>
                                <div className="flex items-center">
                                    {hasUpperAndLower ? (
                                        <svg className="w-4 h-4 text-emerald-500 mr-2 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                    ) : (
                                        <svg className="w-4 h-4 text-text-secondary opacity-50 mr-2 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    )}
                                    <span className={hasUpperAndLower ? "text-emerald-500 font-medium" : ""}>Harus ada huruf kapital dan non-kapital</span>
                                </div>
                                <div className="flex items-center">
                                    {hasSymbol ? (
                                        <svg className="w-4 h-4 text-emerald-500 mr-2 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                    ) : (
                                        <svg className="w-4 h-4 text-text-secondary opacity-50 mr-2 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    )}
                                    <span className={hasSymbol ? "text-emerald-500 font-medium" : ""}>Harus ada simbol/karakter khusus (misal: @, #, $, dll.)</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* FOOTER NAVIGATION */}
                <div className="flex items-center justify-between border-t border-border pt-6 mt-6">
                    {/* BACK BUTTON */}
                    <div>
                        {currentStep > 1 ? (
                            <button
                                onClick={() => setCurrentStep((prev) => prev - 1)}
                                className="px-5 py-3 rounded-2xl border border-border text-text hover:bg-background transition-all text-sm font-semibold cursor-pointer"
                            >
                                Kembali
                            </button>
                        ) : (
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-5 py-3 rounded-2xl border border-border text-text hover:bg-background transition-all text-sm font-semibold cursor-pointer"
                            >
                                Batal
                            </button>
                        )}
                    </div>

                    {/* NEXT / SAVE BUTTON */}
                    <div>
                        {currentStep === 1 && (
                            <button
                                onClick={handleNextStep1}
                                disabled={isVerifying}
                                className="bg-primary hover:bg-primary-dark text-sidebar font-semibold px-6 py-3 rounded-2xl transition-all duration-200 text-sm shadow-sm flex items-center justify-center min-w-32 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isVerifying ? (
                                    <div className="w-5 h-5 border-2 border-sidebar border-b-transparent rounded-full animate-spin"></div>
                                ) : (
                                    "Verifikasi & Lanjut"
                                )}
                            </button>
                        )}
                        {currentStep === 2 && (
                            <button
                                onClick={handleNextStep2}
                                className="bg-primary hover:bg-primary-dark text-sidebar font-semibold px-6 py-3 rounded-2xl transition-all duration-200 text-sm shadow-sm cursor-pointer"
                            >
                                Lanjut
                            </button>
                        )}
                        {currentStep === 3 && (
                            <button
                                onClick={handleSave}
                                className="bg-primary hover:bg-primary-dark text-sidebar font-semibold px-6 py-3 rounded-2xl transition-all duration-200 text-sm shadow-sm cursor-pointer"
                            >
                                Simpan Akun
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddUserForm;
