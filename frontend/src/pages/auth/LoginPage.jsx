import { useState } from "react";
import { useNavigate } from "react-router-dom"; // Sangat disarankan pakai ini untuk navigasi React
import API from "../../services/api";
import Swal from "sweetalert2"; // Gunakan huruf kapital 'S' sesuai konvensi
import loginBg from "../../assets/login-bg.jpg";

const LoginPage = () => {
    const [formData, setFormData] = useState({
        username: "",
        password: "",
    });
    const [showForgotModal, setShowForgotModal] = useState(false);
    const [forgotEmail, setForgotEmail] = useState("");
    const [isSending, setIsSending] = useState(false);

    // State untuk OTP
    const [forgotStep, setForgotStep] = useState("email"); // "email", "otp", atau "reset"
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [maskedEmail, setMaskedEmail] = useState("");

    // Inisialisasi useNavigate
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleLogin = async (e) => {
        e.preventDefault();

        try {
            const response = await API.post("/auth/login", {
                username: formData.username,
                password: formData.password,
            });

            console.log(response.data);

            // Simpan data login ke localStorage
            localStorage.setItem("userInfo", JSON.stringify(response.data));

            // Notifikasi Sukses dengan SweetAlert
            Swal.fire({
                title: "Login Berhasil!",
                text: `Selamat datang, ${response.data.nama_lengkap || "User"}!`,
                icon: "success",
                timer: 1500, // Akan tertutup otomatis dalam 1.5 detik
                showConfirmButton: false,
                backdrop: `rgba(34, 211, 238, 0.1)`, // Efek redup kebiruan di background
            });

            // Beri jeda sedikit agar animasi SweetAlert terlihat sebelum pindah halaman
            setTimeout(() => {
                if (response.data.role === "Owner") navigate("/owner");
                if (response.data.role === "Admin") navigate("/admin");
                if (response.data.role === "Kasir") navigate("/kasir");
            }, 1500);
        } catch (error) {
            // Notifikasi Gagal dengan SweetAlert
            Swal.fire({
                title: "Login Gagal!",
                text:
                    error.response?.data?.message ||
                    "Periksa kembali username dan password Anda.",
                icon: "error",
                confirmButtonColor: "#ef4444", // Warna merah (Danger)
                confirmButtonText: "Coba Lagi",
            });
        }
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        if (!forgotEmail) {
            return Swal.fire("Oops", "Masukkan Username atau Email Anda terlebih dahulu.", "warning");
        }
        try {
            setIsSending(true);
            const response = await API.post("/auth/forgot-password", { email: forgotEmail });
            
            setMaskedEmail(response.data.maskedEmail);
            setForgotEmail(response.data.email); // simpan email asli untuk request reset password nantinya
            
            Swal.fire({
                title: "Terkirim!",
                text: `Silakan cek email ${response.data.maskedEmail} untuk instruksi reset password.`,
                icon: "success",
            });
            setForgotStep("otp");
        } catch (error) {
            Swal.fire({
                title: "Gagal",
                text: error.response?.data?.message || "Gagal mengirim email reset password.",
                icon: "error",
            });
        } finally {
            setIsSending(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        if (!otp || otp.length !== 6) {
            return Swal.fire("Oops", "Masukkan 6 digit kode OTP dengan benar.", "warning");
        }
        try {
            setIsSending(true);
            await API.post("/auth/verify-otp", {
                email: forgotEmail,
                otp: otp
            });
            // Jika berhasil (200), lanjut ke step reset password
            setForgotStep("reset");
        } catch (error) {
            Swal.fire({
                title: "Gagal",
                text: error.response?.data?.message || "Kode OTP salah atau kedaluwarsa.",
                icon: "error",
            });
        } finally {
            setIsSending(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (!newPassword || !confirmPassword) {
            return Swal.fire("Oops", "Mohon masukkan password baru Anda.", "warning");
        }
        if (newPassword !== confirmPassword) {
            return Swal.fire("Oops", "Password dan Konfirmasi Password tidak cocok.", "warning");
        }

        try {
            setIsSending(true);
            await API.post("/auth/reset-password", {
                email: forgotEmail,
                otp: otp,
                password: newPassword
            });
            Swal.fire({
                title: "Berhasil!",
                text: "Password Anda berhasil diubah. Silakan login.",
                icon: "success",
            });
            setShowForgotModal(false);
            setForgotStep("email");
            setForgotEmail("");
            setMaskedEmail("");
            setOtp("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (error) {
            Swal.fire({
                title: "Gagal",
                text: error.response?.data?.message || "Kode OTP tidak valid atau kedaluwarsa.",
                icon: "error",
            });
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div 
            className="min-h-screen flex items-center justify-center font-[var(--font-poppins)] bg-cover bg-center bg-no-repeat relative"
            style={{ backgroundImage: `url(${loginBg})` }}
        >
            {/* Soft dark overlay with blur to integrate background and elevate contrast */}
            <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-[1px]"></div>

            <div className="flex w-full max-w-4xl mx-4 rounded-3xl shadow-2xl overflow-hidden bg-white/70 backdrop-blur-xl border border-white/20 relative z-10">
                {/* Left Panel */}
                <div
                    className="hidden md:flex flex-col justify-between w-2/5 p-10 relative overflow-hidden"
                    style={{
                        background:
                            "linear-gradient(145deg, rgba(30, 58, 138, 0.85) 0%, rgba(29, 78, 216, 0.85) 40%, rgba(30, 64, 175, 0.85) 70%, rgba(26, 58, 122, 0.85) 100%)",
                    }}
                >
                    {/* Decorative snowflakes */}
                    <div className="absolute top-8 left-8 opacity-20">
                        <SnowflakeIcon size={64} />
                    </div>
                    <div className="absolute bottom-16 right-6 opacity-20">
                        <SnowflakeIcon size={56} />
                    </div>
                    <div className="absolute top-1/2 left-4 opacity-10">
                        <SnowflakeIcon size={40} />
                    </div>

                    {/* Logo & Brand */}
                    <div className="relative z-10 flex flex-col items-center text-center mt-10">
                        <div
                            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
                            style={{
                                background: "rgba(34, 211, 238, 0.25)",
                                backdropFilter: "blur(8px)",
                                border: "1px solid rgba(34,211,238,0.3)",
                            }}
                        >
                            <SnowflakeIcon size={32} color="#22d3ee" />
                        </div>

                        <h1 className="text-3xl font-bold text-white mb-2">
                            Nicky Frozen
                        </h1>
                        <p
                            className="text-sm font-medium"
                            style={{ color: "#22d3ee" }}
                        >
                            Fresh &amp; Quality Frozen Food
                        </p>
                    </div>

                    {/* Features */}
                    <div className="relative z-10 flex flex-col gap-4 mb-8">
                        {[
                            "Fast POS System",
                            "Real-time Monitoring",
                            "Multi-branch Management",
                        ].map((feature) => (
                            <div
                                key={feature}
                                className="flex items-center gap-3"
                            >
                                <div
                                    className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                                    style={{ border: "2px solid #22d3ee" }}
                                >
                                    <svg
                                        width="12"
                                        height="12"
                                        viewBox="0 0 12 12"
                                        fill="none"
                                    >
                                        <path
                                            d="M2 6l3 3 5-5"
                                            stroke="#22d3ee"
                                            strokeWidth="1.8"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                </div>
                                <span className="text-white text-sm">
                                    {feature}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Panel */}
                <div className="flex-1 flex flex-col justify-center px-10 py-12 bg-white/30 relative">
                    {/* Radial overlay inside the white glass card for premium micro-details */}
                    <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px] opacity-30 pointer-events-none"></div>

                    <div className="relative z-10">
                        <h2 className="text-3xl font-bold text-[var(--color-text)] mb-1">
                            Welcome Back
                        </h2>
                        <p className="text-[var(--color-text-secondary)] text-sm mb-6">
                            Sign in to your account to continue
                        </p>

                        <form
                        onSubmit={handleLogin}
                        className="flex flex-col gap-4"
                    >
                        {/* Email / Username */}
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-[var(--color-text)]">
                                Username / Email
                            </label>
                            <input
                                type="text"
                                name="username"
                                placeholder="Masukkan username atau email Anda"
                                onChange={handleChange}
                                className="border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm text-[var(--color-text)] placeholder-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                            />
                        </div>

                        {/* Password */}
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-[var(--color-text)]">
                                Password
                            </label>
                            <input
                                type="password"
                                name="password"
                                placeholder="••••••••"
                                onChange={handleChange}
                                className="border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm text-[var(--color-text)] placeholder-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                            />
                        </div>

                        {/* Forgot Password */}
                        <div className="flex items-center justify-end">
                            <button
                                type="button"
                                onClick={() => {
                                    setForgotStep("email");
                                    setForgotEmail("");
                                    setMaskedEmail("");
                                    setOtp("");
                                    setNewPassword("");
                                    setConfirmPassword("");
                                    setShowForgotModal(true);
                                }}
                                className="text-sm font-medium text-[var(--color-primary-dark)] hover:underline cursor-pointer bg-transparent border-none"
                            >
                                Forgot password?
                            </button>
                        </div>

                        {/* Sign In Button */}
                        <button
                            type="submit"
                            className="mt-1 w-full py-3 rounded-xl text-white font-semibold text-sm transition-all duration-200 hover:opacity-90 active:scale-[0.99] cursor-pointer"
                            style={{
                                background:
                                    "linear-gradient(90deg, #06b6d4 0%, #22d3ee 100%)",
                            }}
                        >
                            Sign In
                        </button>
                        </form>
                    </div>
                </div>
            </div>

            {/* Forgot Password Modal */}
            {showForgotModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-fade-in relative">
                        <button
                            onClick={() => setShowForgotModal(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 cursor-pointer text-2xl"
                        >
                            &times;
                        </button>
                        
                        {forgotStep === "email" ? (
                            <>
                                <h2 className="text-2xl font-bold text-gray-800 mb-2">Forgot Password</h2>
                                <p className="text-sm text-gray-500 mb-6">
                                    Masukkan Username atau Email yang terdaftar untuk akun Anda. Kami akan mengirimkan 6 digit kode OTP ke email Anda.
                                </p>
                                
                                <form onSubmit={handleForgotPassword} className="flex flex-col gap-4">
                                    <div className="flex flex-col gap-1">
                                        <label className="text-sm font-medium text-gray-700">Username / Email Address</label>
                                        <input
                                            type="text"
                                            value={forgotEmail}
                                            onChange={(e) => setForgotEmail(e.target.value)}
                                            placeholder="Masukkan username atau email"
                                            required
                                            className="border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#22d3ee] focus:border-transparent transition-all"
                                        />
                                    </div>
                                    
                                    <button
                                        type="submit"
                                        disabled={isSending}
                                        className="mt-2 w-full py-3 rounded-xl text-white font-semibold text-sm transition-all duration-200 hover:opacity-90 active:scale-[0.99] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                        style={{
                                            background: "linear-gradient(90deg, #06b6d4 0%, #22d3ee 100%)",
                                        }}
                                    >
                                        {isSending ? "Mengirim..." : "Kirim Kode OTP"}
                                    </button>
                                </form>
                            </>
                        ) : forgotStep === "otp" ? (
                            <>
                                <h2 className="text-2xl font-bold text-gray-800 mb-2">Verifikasi OTP</h2>
                                <p className="text-sm text-gray-500 mb-6">
                                    Kode OTP telah dikirim ke <strong>{maskedEmail}</strong>. Masukkan kode tersebut untuk melanjutkan.
                                </p>
                                
                                <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
                                    <div className="flex flex-col gap-1">
                                        <label className="text-sm font-medium text-gray-700">Kode OTP (6 Digit)</label>
                                        <input
                                            type="text"
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value)}
                                            placeholder="123456"
                                            required
                                            maxLength={6}
                                            className="border border-gray-300 rounded-xl px-4 py-3 text-sm text-center tracking-[0.5em] font-bold text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#22d3ee] focus:border-transparent transition-all"
                                        />
                                    </div>
                                    
                                    <button
                                        type="submit"
                                        disabled={isSending}
                                        className="mt-2 w-full py-3 rounded-xl text-white font-semibold text-sm transition-all duration-200 hover:opacity-90 active:scale-[0.99] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                        style={{
                                            background: "linear-gradient(90deg, #06b6d4 0%, #22d3ee 100%)",
                                        }}
                                    >
                                        {isSending ? "Memeriksa..." : "Verifikasi OTP"}
                                    </button>
                                </form>
                            </>
                        ) : (
                            <>
                                <h2 className="text-2xl font-bold text-gray-800 mb-2">Buat Password Baru</h2>
                                <p className="text-sm text-gray-500 mb-6">
                                    Kode OTP berhasil diverifikasi! Silakan buat password baru untuk akun Anda.
                                </p>
                                
                                <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
                                    <div className="flex flex-col gap-1">
                                        <label className="text-sm font-medium text-gray-700">Password Baru</label>
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="••••••••"
                                            required
                                            className="border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#22d3ee] focus:border-transparent transition-all"
                                        />
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <label className="text-sm font-medium text-gray-700">Konfirmasi Password</label>
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="••••••••"
                                            required
                                            className="border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#22d3ee] focus:border-transparent transition-all"
                                        />
                                    </div>
                                    
                                    <button
                                        type="submit"
                                        disabled={isSending}
                                        className="mt-2 w-full py-3 rounded-xl text-white font-semibold text-sm transition-all duration-200 hover:opacity-90 active:scale-[0.99] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                        style={{
                                            background: "linear-gradient(90deg, #06b6d4 0%, #22d3ee 100%)",
                                        }}
                                    >
                                        {isSending ? "Menyimpan..." : "Simpan Password Baru"}
                                    </button>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

/* Simple inline Snowflake SVG icon */
const SnowflakeIcon = ({ size = 24, color = "currentColor" }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <line x1="12" y1="2" x2="12" y2="22" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
        <line x1="19.07" y1="4.93" x2="4.93" y2="19.07" />
        <circle cx="12" cy="2" r="1" fill={color} stroke="none" />
        <circle cx="12" cy="22" r="1" fill={color} stroke="none" />
        <circle cx="2" cy="12" r="1" fill={color} stroke="none" />
        <circle cx="22" cy="12" r="1" fill={color} stroke="none" />
        <circle cx="4.93" cy="4.93" r="1" fill={color} stroke="none" />
        <circle cx="19.07" cy="19.07" r="1" fill={color} stroke="none" />
        <circle cx="4.93" cy="19.07" r="1" fill={color} stroke="none" />
        <circle cx="19.07" cy="4.93" r="1" fill={color} stroke="none" />
    </svg>
);

export default LoginPage;
