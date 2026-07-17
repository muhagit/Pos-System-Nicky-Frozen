import { useEffect, useState, useCallback } from "react";
import API from "../../services/api";
import Swal from "sweetalert2";

import cashImg from "../../assets/payment/cash.png";
import qrisImg from "../../assets/payment/qris.png";
import transferImg from "../../assets/payment/transfer.png";
import cardImg from "../../assets/payment/card.png";

import { useNavigate } from "react-router-dom";
import { FiClock, FiArrowUp, FiArrowDown } from "react-icons/fi";

const KasirPage = () => {
    const navigate = useNavigate();

    // USER LOGIN
    const userInfo = JSON.parse(localStorage.getItem("userInfo"));

    // STATE
    const [products, setProducts] = useState([]);
    const [cartItems, setCartItems] = useState([]);
    const [paymentMethod, setPaymentMethod] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [holdOrderId, setHoldOrderId] = useState(null);
    const [holdSnapToken, setHoldSnapToken] = useState(null);
    const [revisionCount, setRevisionCount] = useState(0); 

    // Shift States (API-driven)
    const [activeShift, setActiveShift] = useState(null);
    const [shiftLoading, setShiftLoading] = useState(true);
    const [shiftName, setShiftName] = useState("Shift 1");
    const [modalAwalInput, setModalAwalInput] = useState("");
    const [isStartShiftModalOpen, setIsStartShiftModalOpen] = useState(false);

    // Search, Filter & Sort States
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [sortBy, setSortBy] = useState("name");
    const [sortOrder, setSortOrder] = useState("asc");
    const [dbCategories, setDbCategories] = useState([]);

    // Tour/Onboarding States
    const [isTourActive, setIsTourActive] = useState(false);
    const [currentTourStep, setCurrentTourStep] = useState(0);
    const [activeTargetRect, setActiveTargetRect] = useState(null);

    // Tour Step Definitions
    const tourSteps = [
        {
            target: "center",
            title: "Selamat Datang di POS Nicky Frozen! 🎉",
            description: "Halo! Kami telah menyiapkan panduan singkat untuk membantu Anda mengenali fitur-fitur penting di halaman POS kasir ini.",
            position: "center"
        },
        {
            target: "#tour-shift-btn",
            title: "Mulai & Akhiri Shift Kerja 🕒",
            description: "Sebelum melayani pembeli, harap klik tombol 'Mulai Shift Kerja' untuk mengaktifkan POS, memilih shift, dan memasukkan modal awal. Di akhir shift, klik tombol 'Akhiri Shift' untuk merekap total penjualan Anda.",
            position: "bottom"
        },
        {
            target: "#tour-search-filter",
            title: "Pencarian, Filter & Sorting 🔍",
            description: "Cari produk dengan mengetikkan nama, saring berdasarkan Kategori cepat, atau urutkan produk berdasarkan abjad maupun produk terbaru.",
            position: "bottom"
        },
        {
            target: "#tour-product-grid",
            title: "Katalog Produk 📦",
            description: "Klik pada kartu produk apa saja untuk memasukkannya ke dalam keranjang belanja. Stok produk yang kosong akan otomatis terkunci.",
            position: "right"
        },
        {
            target: "#tour-cart",
            title: "Keranjang Belanja & Pembayaran 💳",
            description: "Atur kuantitas item, pilih metode pembayaran (Cash/QRIS), dan lakukan checkout. Untuk pembayaran Cash, kami menyediakan kalkulator kembalian otomatis!",
            position: "left"
        },
        {
            target: "#tour-sidebar",
            title: "Menu Navigasi Sidebar 📋",
            description: "Gunakan menu sidebar ini untuk mengakses Laporan Tutup Buku harian (Report), melihat daftar transaksi tunda (Hold), atau melihat Riwayat Transaksi (History).",
            position: "right"
        }
    ];

    // Run only once on mount / login check
    useEffect(() => {
        if (userInfo) {
            const hasSeen = localStorage.getItem(`nicky_seen_tour_${userInfo.username}`);
            if (!hasSeen) {
                const timer = setTimeout(() => {
                    setIsTourActive(true);
                    setCurrentTourStep(0);
                }, 1000);
                return () => clearTimeout(timer);
            }
        }
    }, [userInfo?.username]);

    // Recalculate target position whenever step changes
    useEffect(() => {
        if (!isTourActive) {
            setActiveTargetRect(null);
            return;
        }

        const step = tourSteps[currentTourStep];
        if (step.target === "center") {
            setActiveTargetRect(null);
            return;
        }

        const element = document.querySelector(step.target);
        if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
            const updateRect = () => {
                setActiveTargetRect(element.getBoundingClientRect());
            };
            updateRect();
            window.addEventListener("resize", updateRect);
            window.addEventListener("scroll", updateRect, true);
            return () => {
                window.removeEventListener("resize", updateRect);
                window.removeEventListener("scroll", updateRect, true);
            };
        } else {
            setActiveTargetRect(null);
        }
    }, [isTourActive, currentTourStep]);

    const handleNextStep = () => {
        if (currentTourStep < tourSteps.length - 1) {
            setCurrentTourStep(currentTourStep + 1);
        } else {
            handleCompleteTour();
        }
    };

    const handlePrevStep = () => {
        if (currentTourStep > 0) {
            setCurrentTourStep(currentTourStep - 1);
        }
    };

    const handleCompleteTour = () => {
        setIsTourActive(false);
        if (userInfo) {
            localStorage.setItem(`nicky_seen_tour_${userInfo.username}`, "true");
        }
    };

    const handleRestartTour = () => {
        setCurrentTourStep(0);
        setIsTourActive(true);
    };

    const getTooltipStyles = (rect, position) => {
        if (position === "center" || !rect) {
            return {
                position: "fixed",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                zIndex: 100,
            };
        }

        const margin = 16;
        let top = 0;
        let left = 0;

        if (position === "bottom") {
            top = rect.bottom + margin;
            left = rect.left + rect.width / 2 - 192; // Half of tooltip max-w-sm (384px)
        } else if (position === "top") {
            top = rect.top - 200 - margin;
            left = rect.left + rect.width / 2 - 192;
        } else if (position === "left") {
            top = rect.top + rect.height / 2 - 100;
            left = rect.left - 384 - margin;
        } else if (position === "right") {
            top = rect.top + rect.height / 2 - 100;
            left = rect.right + margin;
        }

        // Keep inside bounds
        if (left < 10) left = 10;
        if (left + 394 > window.innerWidth) left = window.innerWidth - 404;
        if (top < 10) top = 10;
        if (top + 200 > window.innerHeight) top = window.innerHeight - 210;

        return {
            position: "fixed",
            top: `${top}px`,
            left: `${left}px`,
            zIndex: 100,
        };
    };

    // Search, Filter & Sort Logic
    const processedProducts = products
        .filter((product) => {
            const matchesSearch = product.nama_produk.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = selectedCategory === "All" || product.kategori === selectedCategory;
            return matchesSearch && matchesCategory;
        })
        .sort((a, b) => {
            let comparison = 0;
            if (sortBy === "name") {
                comparison = a.nama_produk.localeCompare(b.nama_produk);
            } else if (sortBy === "price") {
                comparison = a.harga - b.harga;
            } else if (sortBy === "stock") {
                comparison = a.stok_saat_ini - b.stok_saat_ini;
            } else if (sortBy === "date") {
                comparison = new Date(a.updatedAt || a.createdAt) - new Date(b.updatedAt || b.createdAt);
            }
            return sortOrder === "asc" ? comparison : -comparison;
        });

    const checkActiveShift = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${userInfo?.token}` } };
            const { data } = await API.get("/reports/active-shift", config);
            setActiveShift(data.activeShift);
        } catch (error) {
            console.error("Gagal cek shift:", error);
        } finally {
            setShiftLoading(false);
        }
    };

    const fetchCategories = useCallback(async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${userInfo?.token}` } };
            const { data } = await API.get("/categories", config);
            setDbCategories(data);
        } catch (error) {
            console.error("Gagal mengambil kategori:", error);
        }
    }, [userInfo?.token]);

    useEffect(() => {
        checkActiveShift();
        fetchCategories();
    }, [fetchCategories]);

    const handleStartShift = async () => {
        if (shiftName === "Shift 1") {
            const rawValue = modalAwalInput.replace(/\./g, "");
            const modalValue = Number(rawValue);
            if (!modalAwalInput || isNaN(modalValue) || modalValue < 0) {
                Swal.fire("Peringatan", "Masukkan nominal modal awal yang valid!", "warning");
                return;
            }
        }

        try {
            const config = { headers: { Authorization: `Bearer ${userInfo?.token}` } };
            const payload = { shift: shiftName };
            if (shiftName === "Shift 1") payload.modal_awal = Number(modalAwalInput.replace(/\./g, ""));

            const { data } = await API.post("/reports/start-shift", payload, config);
            setActiveShift(data.record);
            setIsStartShiftModalOpen(false); // Close modal on success

            Swal.fire({
                icon: "success",
                title: "Shift Dimulai!",
                text: `${shiftName} berhasil diaktifkan.`,
                timer: 2000,
                showConfirmButton: false
            });
        } catch (error) {
            Swal.fire("Gagal", error.response?.data?.message || "Gagal memulai shift", "error");
        }
    };

    const handleEndShift = async () => {
        const result = await Swal.fire({
            title: "Akhiri Shift?",
            text: `Data transaksi ${activeShift?.shift} akan disimpan. POS akan dinonaktifkan sampai shift berikutnya dimulai.`,
            icon: "question",
            showCancelButton: true,
            confirmButtonColor: "#0891b2",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Ya, Akhiri Shift",
            cancelButtonText: "Batal"
        });

        if (!result.isConfirmed) return;

        try {
            const config = { headers: { Authorization: `Bearer ${userInfo?.token}` } };
            await API.post("/reports/end-shift", {}, config);

            // Recheck shift status from backend (which will now be null)
            await checkActiveShift();

            Swal.fire({
                icon: "success",
                title: "Shift Selesai!",
                text: "Data transaksi shift telah disimpan.",
                confirmButtonColor: "#0891b2",
            });
        } catch (error) {
            Swal.fire("Gagal", error.response?.data?.message || "Gagal mengakhiri shift", "error");
        }
    };

    // FETCH PRODUCT
    const fetchProducts = async () => {
        try {
            const config = {
                headers: { Authorization: `Bearer ${userInfo?.token}` },
            };

            const response = await API.get("/products", config);
            setProducts(response.data);
        } catch (error) {
            console.log("Gagal mengambil produk:", error);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    useEffect(() => {
        const queryParams = new URLSearchParams(window.location.search);
        const orderId = queryParams.get("order_id");
        const status = queryParams.get("transaction_status");
        const statusCode = queryParams.get("status_code");

        if (orderId && (status === "settlement" || statusCode === "200")) {
            const finalize = async () => {
                try {
                    const config = {
                        headers: { Authorization: `Bearer ${userInfo?.token}` },
                    };
                    await API.post(
                        "/transactions/finalize",
                        { order_id: orderId },
                        config,
                    );

                    // Bersihkan query parameters dari URL agar tidak memicu ulang saat page di-refresh
                    window.history.replaceState({}, document.title, window.location.pathname);

                    Swal.fire({
                        icon: "success",
                        title: "Pembayaran Sukses!",
                        text: "Transaksi telah berhasil dicatat dan diselesaikan.",
                        timer: 2000,
                        showConfirmButton: false,
                    });

                    fetchProducts();
                } catch (error) {
                    console.error("Gagal memfinalisasi transaksi:", error);
                }
            };
            finalize();
        }
    }, []);

    useEffect(() => {
        const savedCart = localStorage.getItem("restoreCartItems");
        const savedMethod = localStorage.getItem("restorePaymentMethod");
        const savedOrderId = localStorage.getItem("restoreOrderId"); // Tambahkan ini
        const savedSnapToken = localStorage.getItem("restoreSnapToken");

        if (savedCart) {
            const parsedCart = JSON.parse(savedCart);
            const mappedCart = parsedCart.map((item) => ({
                _id: item.produk_id?._id || item.produk_id,
                nama_produk: item.produk_id?.nama_produk || "Produk",
                harga: item.harga_satuan,
                qty: item.kuantitas,
                stok_saat_ini: item.produk_id?.stok_saat_ini || 99,
            }));

            setCartItems(mappedCart);
            if (savedMethod) setPaymentMethod(savedMethod);
            if (savedOrderId) setHoldOrderId(savedOrderId); // Simpan order_id lama ke state
            if (savedSnapToken) setHoldSnapToken(savedSnapToken);

            localStorage.removeItem("restoreCartItems");
            localStorage.removeItem("restorePaymentMethod");
            localStorage.removeItem("restoreOrderId"); // Bersihkan localStorage
            localStorage.removeItem("restoreSnapToken");

            Swal.fire(
                "Berhasil",
                "Transaksi tunda berhasil dikembalikan ke keranjang.",
                "success",
            );
        }
    }, [products]);

    // ADD TO CART
    const addToCart = (product) => {
        if (!activeShift) {
            return Swal.fire(
                "Peringatan",
                "Harap mulai shift kerja terlebih dahulu untuk melakukan transaksi!",
                "warning"
            );
        }
        // PERBAIKAN: Ubah .stok menjadi .stok_saat_ini
        if (product.stok_saat_ini <= 0) {
            return Swal.fire(
                "Gagal",
                "Stok produk ini sedang kosong!",
                "warning",
            );
        }

        const existingItem = cartItems.find((item) => item._id === product._id);

        if (existingItem) {
            // PERBAIKAN: Ubah .stok menjadi .stok_saat_ini
            if (existingItem.qty >= product.stok_saat_ini) {
                return Swal.fire(
                    "Peringatan",
                    "Maksimal stok tercapai!",
                    "warning",
                );
            }

            setCartItems(
                cartItems.map((item) =>
                    item._id === product._id
                        ? { ...item, qty: item.qty + 1 }
                        : item,
                ),
            );
        } else {
            setCartItems([...cartItems, { ...product, qty: 1 }]);
        }
    };

    // UPDATE QTY (Tombol + / - di keranjang)
    const updateQty = (id, delta) => {
        if (!activeShift) {
            return Swal.fire(
                "Peringatan",
                "Harap mulai shift kerja terlebih dahulu untuk melakukan transaksi!",
                "warning"
            );
        }
        setCartItems((prev) =>
            prev.map((item) => {
                if (item._id === id) {
                    const newQty = item.qty + delta;
                    // PERBAIKAN: Ubah .stok menjadi .stok_saat_ini
                    return newQty > 0 && newQty <= item.stok_saat_ini
                        ? { ...item, qty: newQty }
                        : item;
                }
                return item;
            }),
        );
    };

    // REMOVE FROM CART
    const removeFromCart = (id) => {
        const updatedCart = cartItems.filter((item) => item._id !== id);
        setCartItems(updatedCart);
        if (updatedCart.length === 0) {
            setHoldOrderId(null);
            setHoldSnapToken(null);
            setRevisionCount(0);
        }
    };

    // KALKULASI HARGA
    const subtotal = cartItems.reduce(
        (acc, item) => acc + item.harga * item.qty,
        0,
    );
    const tax = subtotal * 0.1; // Pajak 10%
    const total = subtotal + tax;

    // HANDLE HOLD MANUAL (TUNDA TRANSAKSI)
    const handleHoldManual = async () => {
        if (!activeShift) {
            return Swal.fire(
                "Peringatan",
                "Harap mulai shift kerja terlebih dahulu untuk melakukan transaksi!",
                "warning"
            );
        }
        if (cartItems.length === 0) {
            return Swal.fire(
                "Gagal",
                "Keranjang belanja masih kosong!",
                "warning",
            );
        }

        const { value: customerName } = await Swal.fire({
            title: "Simpan Transaksi Tunda",
            input: "text",
            inputLabel: "Nama Pelanggan / Catatan Pesanan",
            inputPlaceholder: "Masukkan nama pelanggan...",
            showCancelButton: true,
            confirmButtonText: "Simpan",
            cancelButtonText: "Batal",
            confirmButtonColor: "#f59e0b", // amber 500
            cancelButtonColor: "#dc2626",
            inputValidator: (value) => {
                if (!value) {
                    return "Nama pelanggan harus diisi!";
                }
            },
            customClass: {
                popup: "rounded-3xl p-6",
                confirmButton: "rounded-2xl px-6 py-3 font-bold text-white text-sm focus:outline-none mr-2",
                cancelButton: "rounded-2xl px-6 py-3 font-bold text-white text-sm focus:outline-none",
                input: "rounded-xl border-gray-200 outline-none text-sm font-medium focus:border-amber-500"
            }
        });

        if (!customerName) return;

        setIsSubmitting(true);

        const config = {
            headers: { Authorization: `Bearer ${userInfo?.token}` },
        };

        const uniqueId = holdOrderId || `NICKY-${Date.now()}`;
        const holdPayload = {
            user_id: userInfo?._id,
            cabang: userInfo?.cabang || "Pusat",
            metode_pembayaran: paymentMethod || "Cash",
            total_pembayaran: total,
            is_hold: true,
            detail_transaksi: cartItems.map((item) => ({
                produk_id: item._id,
                kuantitas: item.qty,
                harga_satuan: item.harga,
                subtotal: item.harga * item.qty,
            })),
            subtotal_keranjang: subtotal,
            pajak: tax,
            kasir: userInfo?.nama_lengkap || "Kasir",
            order_id: uniqueId,
            customer_name: customerName,
        };

        try {
            await API.post("/transactions", holdPayload, config);

            Swal.fire({
                icon: "success",
                title: "Berhasil Disimpan",
                text: `Transaksi atas nama "${customerName}" berhasil ditunda.`,
                timer: 2000,
                showConfirmButton: false,
            });

            setCartItems([]);
            setPaymentMethod("");
            setHoldOrderId(null);
            setHoldSnapToken(null);
            setRevisionCount(0);
            fetchProducts();
        } catch (error) {
            Swal.fire(
                "Gagal",
                error.response?.data?.message || "Sistem gagal menyimpan transaksi tunda.",
                "error",
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    // HANDLE CHECKOUT (PROSES KE BACKEND)
    // HANDLE CHECKOUT (PROSES KE BACKEND)
    // HANDLE CHECKOUT (PROSES KE BACKEND)
    const handlePayment = async () => {
        if (!activeShift) {
            return Swal.fire(
                "Peringatan",
                "Harap mulai shift kerja terlebih dahulu untuk melakukan transaksi!",
                "warning"
            );
        }
        if (cartItems.length === 0) {
            return Swal.fire(
                "Gagal",
                "Keranjang belanja masih kosong!",
                "warning",
            );
        }

        if (!paymentMethod) {
            return Swal.fire(
                "Gagal",
                "Pilih metode pembayaran terlebih dahulu!",
                "warning",
            );
        }

        const isCash = paymentMethod === "Cash";
        const cartHtml = `
            <div class="text-left font-poppins text-gray-700">
                <div class="mb-4">
                    <span class="text-xs font-semibold uppercase tracking-wider text-gray-400">Metode Pembayaran</span>
                    <div class="flex items-center gap-2 mt-1">
                        <span class="px-3 py-1.5 ${isCash ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'} rounded-xl text-sm font-bold">
                            ${isCash ? "Cash (Tunai)" : "E-Money / Transfer (Midtrans)"}
                        </span>
                    </div>
                </div>
                
                <span class="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-2">Detail Item</span>
                <div class="max-h-36 overflow-y-auto mb-4 border border-gray-100 rounded-xl p-3 bg-gray-50 space-y-2">
                    ${cartItems.map(item => `
                        <div class="flex justify-between items-center text-sm py-1 border-b border-gray-200/50 last:border-0">
                            <div class="truncate max-w-[220px]">
                                <span class="font-medium text-gray-900">${item.nama_produk}</span>
                                <span class="text-xs text-gray-400 block">${item.qty} x Rp ${item.harga.toLocaleString("id-ID")}</span>
                            </div>
                            <span class="font-semibold text-gray-950">Rp ${(item.harga * item.qty).toLocaleString("id-ID")}</span>
                        </div>
                    `).join("")}
                </div>

                <div class="space-y-2 border-t pt-3 text-sm">
                    <div class="flex justify-between text-gray-500">
                        <span>Subtotal</span>
                        <span class="font-medium">Rp ${subtotal.toLocaleString("id-ID")}</span>
                    </div>
                    <div class="flex justify-between text-gray-500">
                        <span>Pajak (10%)</span>
                        <span class="font-medium">Rp ${tax.toLocaleString("id-ID")}</span>
                    </div>
                    <div class="flex justify-between font-bold text-lg mt-2 pt-2 border-t text-primary">
                        <span>Total Bayar</span>
                        <span id="cash-total-val" data-total="${total}">Rp ${total.toLocaleString("id-ID")}</span>
                    </div>
                </div>

                ${isCash ? `
                <div class="mt-4 pt-3 border-t border-dashed border-gray-200">
                    <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                        Uang Diterima (Rp)
                    </label>
                    <input
                        type="text"
                        id="cash-received-input"
                        class="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 outline-none text-md font-bold focus:border-primary focus:bg-white transition"
                        placeholder="Masukkan uang yang diterima..."
                    />
                    
                    <div class="flex flex-wrap gap-2 mt-2">
                        <button type="button" class="cash-shortcut-btn px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-xs font-bold rounded-lg transition border-none cursor-pointer" data-val="${total}">Uang Pas</button>
                        <button type="button" class="cash-shortcut-btn px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-xs font-bold rounded-lg transition border-none cursor-pointer" data-val="10000">10k</button>
                        <button type="button" class="cash-shortcut-btn px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-xs font-bold rounded-lg transition border-none cursor-pointer" data-val="20000">20k</button>
                        <button type="button" class="cash-shortcut-btn px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-xs font-bold rounded-lg transition border-none cursor-pointer" data-val="50000">50k</button>
                        <button type="button" class="cash-shortcut-btn px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-xs font-bold rounded-lg transition border-none cursor-pointer" data-val="100000">100k</button>
                    </div>
                </div>

                <div class="mt-4 bg-gray-50 border border-gray-100 p-4 rounded-2xl flex justify-between items-center">
                    <div>
                        <span class="text-xs font-bold text-gray-400 uppercase tracking-wider block">Kembalian</span>
                        <span id="cash-change-display" class="text-xl font-extrabold text-gray-500 mt-1 block">Rp 0</span>
                    </div>
                    <div id="cash-status-badge" class="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-xs font-bold">
                        Belum Bayar
                    </div>
                </div>
                ` : ""}
            </div>
        `;

        const result = await Swal.fire({
            title: "Konfirmasi Pesanan",
            html: cartHtml,
            icon: "info",
            showCancelButton: true,
            confirmButtonText: "Konfirmasi & Bayar",
            cancelButtonText: "Batal",
            confirmButtonColor: "#059669", // emerald 600
            cancelButtonColor: "#DC2626", // red 600
            customClass: {
                popup: "rounded-3xl p-6",
                confirmButton: "rounded-2xl px-6 py-3 font-bold text-white text-sm focus:outline-none mr-2",
                cancelButton: "rounded-2xl px-6 py-3 font-bold text-white text-sm focus:outline-none"
            },
            didOpen: () => {
                if (!isCash) return;
                
                const input = Swal.getHtmlContainer().querySelector("#cash-received-input");
                const changeDisplay = Swal.getHtmlContainer().querySelector("#cash-change-display");
                const statusBadge = Swal.getHtmlContainer().querySelector("#cash-status-badge");
                const confirmButton = Swal.getConfirmButton();

                confirmButton.disabled = true;

                const updateTotalChange = (val) => {
                    const received = Number(val) || 0;
                    const change = received - total;

                    if (received === 0) {
                        changeDisplay.textContent = "Rp 0";
                        changeDisplay.className = "text-xl font-extrabold text-gray-500 mt-1 block";
                        statusBadge.textContent = "Belum Bayar";
                        statusBadge.className = "px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-xs font-bold";
                        confirmButton.disabled = true;
                    } else if (change < 0) {
                        changeDisplay.textContent = `- Rp ${Math.abs(change).toLocaleString("id-ID")}`;
                        changeDisplay.className = "text-xl font-extrabold text-red-500 mt-1 block";
                        statusBadge.textContent = "Kurang Uang";
                        statusBadge.className = "px-3 py-1 bg-red-50 text-red-600 rounded-full text-xs font-bold";
                        confirmButton.disabled = true;
                    } else {
                        changeDisplay.textContent = `Rp ${change.toLocaleString("id-ID")}`;
                        changeDisplay.className = "text-xl font-extrabold text-emerald-600 mt-1 block";
                        statusBadge.textContent = change === 0 ? "Pas / Balance" : "Kembalian Cukup";
                        statusBadge.className = "px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold";
                        confirmButton.disabled = false;
                    }
                };

                input.addEventListener("input", (e) => {
                    const raw = e.target.value.replace(/\D/g, "");
                    const formatted = raw ? Number(raw).toLocaleString("id-ID") : "";
                    e.target.value = formatted;
                    updateTotalChange(raw);
                });

                const shortcutBtns = Swal.getHtmlContainer().querySelectorAll(".cash-shortcut-btn");
                shortcutBtns.forEach(btn => {
                    btn.addEventListener("click", () => {
                        const val = Number(btn.getAttribute("data-val"));
                        const raw = String(val);
                        input.value = val.toLocaleString("id-ID");
                        updateTotalChange(raw);
                    });
                });
            },
            preConfirm: () => {
                if (isCash) {
                    const inputVal = Swal.getHtmlContainer().querySelector("#cash-received-input").value;
                    const rawVal = inputVal.replace(/\./g, "");
                    const received = Number(rawVal) || 0;
                    if (received < total) {
                        Swal.showValidationMessage("Uang diterima tidak boleh kurang dari total bayar!");
                        return false;
                    }
                    return { received, change: received - total };
                }
                return true;
            }
        });

        if (!result.isConfirmed) {
            return; // Hentikan proses jika kasir membatalkan
        }

        const changeAmount = isCash && result.value ? result.value.change : null;

        setIsSubmitting(true);

        const config = {
            headers: { Authorization: `Bearer ${userInfo?.token}` },
        };

        // PERBAIKAN 1: Gunakan 'let' karena nilai ini mungkin diubah (ditambah -REV)
        let uniqueOrderId = holdOrderId || `NICKY-${Date.now()}`;

        const payload = {
            user_id: userInfo?._id,
            cabang: userInfo?.cabang || "Pusat",
            metode_pembayaran: paymentMethod,
            total_pembayaran: total,
            is_hold: false,
            detail_transaksi: cartItems.map((item) => ({
                produk_id: item._id,
                kuantitas: item.qty,
                harga_satuan: item.harga,
                subtotal: item.harga * item.qty,
            })),
            subtotal_keranjang: subtotal,
            pajak: tax,
            kasir: userInfo?.nama_lengkap || "Kasir",
            order_id: uniqueOrderId, // Mengirim order_id unik ke sistem Anda
        };

        // FUNGSI PEMBANTU: Untuk menyimpan data transaksi resmi ke database (LUNAS)
        const saveTransactionToDatabase = async (finalPayload, change = null) => {
            try {
                await API.post("/transactions", finalPayload, config);

                Swal.fire({
                    icon: "success",
                    title: "Transaksi Berhasil!",
                    text: change !== null
                        ? `Pembayaran diterima. Kembalian: Rp ${change.toLocaleString("id-ID")}`
                        : "Pembayaran telah diterima dan stok otomatis berkurang.",
                    confirmButtonColor: "#059669",
                });

                // --- AREA RESET STATE KASIR ---
                setCartItems([]);
                setPaymentMethod("");
                setHoldOrderId(null);
                setHoldSnapToken(null);
                fetchProducts();
            } catch (error) {
                Swal.fire(
                    "Gagal Menyimpan Transaksi",
                    error.response?.data?.message ||
                        "Terjadi kesalahan saat mencatat ke database.",
                    "error",
                );
            } finally {
                setIsSubmitting(false);
            }
        };

        // ALUR LOGIKAL: E-Money (Midtrans)
        if (paymentMethod === "QRIS") {
            try {
                let snapTokenToUse = holdSnapToken;

                // Jika snapTokenToUse bernilai null (karena kasir klik tombol Ubah Metode),
                // Kita buatkan Order ID baru dengan akhiran -REV + angka counter revisinya
                if (!snapTokenToUse) {
                    const nextRevision = revisionCount + 1;
                    setRevisionCount(nextRevision);

                    // Bersihkan dulu dari suffix -REV lama jika ada, lalu pasang yang baru
                    const baseId = uniqueOrderId.split("-REV")[0];
                    uniqueOrderId = `${baseId}-REV${nextRevision}`;
                    payload.order_id = uniqueOrderId; // Sinkronkan ke payload database

                    // Minta token baru gres ke Midtrans yang bersih dari lock pembayaran lama
                    const tokenResponse = await API.post(
                        "/payment/create",
                        {
                            order_id: uniqueOrderId,
                            gross_amount: total,
                            customer_name:
                                userInfo?.nama_lengkap ||
                                "Pelanggan Nicky Frozen",
                            email: userInfo?.email || "kasir@nickyfrozen.com",
                        },
                        config,
                    );
                    snapTokenToUse = tokenResponse.data.token;
                }

                const saveToHoldAutomatically = async () => {
                    const { value: customerName } = await Swal.fire({
                        title: "Simpan Transaksi Tunda",
                        input: "text",
                        inputLabel: "Nama Pelanggan / Catatan Pesanan",
                        inputPlaceholder: "Masukkan nama pelanggan...",
                        showCancelButton: true,
                        confirmButtonText: "Simpan",
                        cancelButtonText: "Jangan Simpan",
                        confirmButtonColor: "#f59e0b",
                        cancelButtonColor: "#dc2626",
                        inputValidator: (value) => {
                            if (!value) {
                                return "Nama pelanggan harus diisi!";
                            }
                        },
                        customClass: {
                            popup: "rounded-3xl p-6",
                            confirmButton: "rounded-2xl px-6 py-3 font-bold text-white text-sm focus:outline-none mr-2",
                            cancelButton: "rounded-2xl px-6 py-3 font-bold text-white text-sm focus:outline-none",
                            input: "rounded-xl border-gray-200 outline-none text-sm font-medium focus:border-amber-500"
                        }
                    });

                    if (!customerName) {
                        setIsSubmitting(false);
                        return;
                    }

                    const holdPayload = {
                        ...payload,
                        order_id: uniqueOrderId,
                        is_hold: true,
                        status_pembayaran: "Pending",
                        metode_pembayaran: paymentMethod,
                        snap_token: snapTokenToUse,
                        customer_name: customerName,
                    };

                    try {
                        await API.post("/transactions", holdPayload, config);

                        Swal.fire({
                            icon: "info",
                            title: "Dialihkan ke Hold",
                            text: "Transaksi otomatis disimpan ke daftar tunda.",
                            timer: 2000,
                            showConfirmButton: false,
                        });

                        setCartItems([]);
                        setPaymentMethod("");
                        setHoldOrderId(null);
                        setHoldSnapToken(null);
                        setRevisionCount(0); // Reset counter kembali ke 0
                        fetchProducts();
                    } catch (error) {
                        Swal.fire(
                            "Gagal",
                            "Sistem gagal memindahkan transaksi ke Hold.",
                            "error",
                        );
                    } finally {
                        setIsSubmitting(false);
                    }
                };

                // JALANKAN POP-UP SNAP MIDTRANS
                if (window.snap) {
                    window.snap.pay(snapTokenToUse, {
                        onSuccess: async function (result) {
                            const updatedPayload = {
                                ...payload,
                                order_id: uniqueOrderId,
                                status_pembayaran: "Lunas",
                                midtrans_details: result,
                            };
                            await saveTransactionToDatabase(updatedPayload);
                            setRevisionCount(0); // Reset ke 0 saat lunas
                        },
                        onPending: async function (result) {
                            await saveToHoldAutomatically();
                        },
                        onError: function (result) {
                            Swal.fire(
                                "Pembayaran Gagal",
                                "Proses pembayaran gagal.",
                                "error",
                            );
                            setIsSubmitting(false);
                        },
                        onClose: async function () {
                            await saveToHoldAutomatically();
                        },
                    });
                }
            } catch (error) {
                setIsSubmitting(false);
            }
        }

        // ALUR LOGIKAL: Cash (Pembayaran Tunai)
        if (paymentMethod === "Cash") {
            await saveTransactionToDatabase(payload, changeAmount);
        }
    };

    return (
        <div className="flex h-screen bg-background font-poppins">
            {/* MAIN */}
            <div className="flex-1 p-6 overflow-hidden">
                {/* TOPBAR */}
                <div className="flex justify-between items-center">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 id="tour-welcome" className="text-4xl font-bold text-text">
                                Cashier Dashboard
                            </h1>
                            <button
                                onClick={handleRestartTour}
                                className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-primary transition cursor-pointer border-none bg-transparent mt-1"
                                title="Buka Panduan POS (User Guide)"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </button>
                        </div>
                        {activeShift ? (
                            <p className="text-text-secondary text-sm font-semibold mt-1">
                                <span className="text-primary font-bold">{activeShift.shift}</span> • Modal Awal: <span className="text-primary font-bold">Rp {(activeShift.modal_awal || 0).toLocaleString("id-ID")}</span>
                            </p>
                        ) : (
                            <p className="text-amber-500 text-sm font-semibold mt-1 animate-pulse">
                                Shift Belum Dimulai • Klik "Mulai Shift Kerja" untuk mengaktifkan POS
                            </p>
                        )}
                    </div>
                    {activeShift ? (
                        <button
                            id="tour-shift-btn"
                            onClick={handleEndShift}
                            className="bg-red-500 hover:bg-red-600 text-white px-5 py-3 rounded-2xl font-bold transition shadow-md shadow-red-500/20 cursor-pointer border-none flex items-center gap-2"
                        >
                            Akhiri Shift
                        </button>
                    ) : (
                        <button
                            id="tour-shift-btn"
                            onClick={() => setIsStartShiftModalOpen(true)}
                            className="bg-primary hover:bg-primary-dark text-white px-5 py-3 rounded-2xl font-bold transition shadow-md shadow-cyan-500/20 cursor-pointer border-none flex items-center gap-2"
                        >
                            Mulai Shift Kerja
                        </button>
                    )}
                </div>

                {/* CONTENT */}
                <div className="flex gap-6 mt-8 h-[calc(100vh-120px)]">
                    {/* PRODUCT AREA */}
                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        {/* SEARCH & SORT */}
                        <div id="tour-search-filter" className="bg-white rounded-3xl p-5 shadow-sm">
                            <div className="flex flex-col md:flex-row gap-4">
                                <input
                                    type="text"
                                    placeholder="Search products..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="flex-1 border border-border rounded-2xl p-4 outline-none focus:border-primary text-sm font-medium"
                                />
                                <div className="flex gap-2">
                                    <select
                                        value={selectedCategory}
                                        onChange={(e) => setSelectedCategory(e.target.value)}
                                        className="border border-border rounded-2xl px-4 py-2 outline-none focus:border-primary text-sm font-semibold bg-gray-50 cursor-pointer min-w-[150px]"
                                    >
                                        <option value="All">All Categories</option>
                                        {dbCategories.map((cat) => (
                                            <option key={cat._id} value={cat.nama_kategori}>
                                                {cat.nama_kategori}
                                            </option>
                                        ))}
                                    </select>
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className="border border-border rounded-2xl px-4 py-2 outline-none focus:border-primary text-sm font-semibold bg-gray-50 cursor-pointer min-w-[150px]"
                                    >
                                        <option value="name">Product Name</option>
                                        <option value="price">Price</option>
                                        <option value="stock">Stock Quantity</option>
                                        <option value="date">Recently Updated</option>
                                    </select>
                                    <button
                                        type="button"
                                        onClick={() => setSortOrder(prev => prev === "asc" ? "desc" : "asc")}
                                        className="border border-border rounded-2xl px-4 py-2 flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition cursor-pointer text-gray-600 hover:text-primary outline-none"
                                        title={sortOrder === "asc" ? "Sort Ascending" : "Sort Descending"}
                                    >
                                        {sortOrder === "asc" ? (
                                            <FiArrowUp size={18} />
                                        ) : (
                                            <FiArrowDown size={18} />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* PRODUCT GRID */}
                        <div id="tour-product-grid" className="grid grid-cols-3 gap-5 mt-6">
                            {processedProducts.map((product) => (
                                <div
                                    key={product._id}
                                    onClick={() => addToCart(product)}
                                    // PERBAIKAN: Ubah .stok menjadi .stok_saat_ini
                                    className={`bg-white rounded-3xl p-5 cursor-pointer hover:scale-[1.02] transition shadow-sm border-2 ${product.stok_saat_ini <= 0 ? "opacity-50 border-danger/30" : "border-transparent hover:border-primary/30"}`}
                                >
                                    <div className="h-[160px] bg-gray-50 rounded-2xl flex items-center justify-center overflow-hidden">
                                        {product.gambar ? (
                                            <img
                                                src={`http://localhost:5000${product.gambar}`}
                                                alt={product.nama_produk}
                                                className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                                            />
                                        ) : (
                                            <div className="text-6xl">🛒</div> // Fallback jika admin tidak mengupload gambar
                                        )}
                                    </div>
                                    <h3 className="font-semibold text-xl mt-5 truncate">
                                        {product.nama_produk}
                                    </h3>
                                    {/* PERBAIKAN: Ubah .stok menjadi .stok_saat_ini */}
                                    <p
                                        className={`text-sm mt-1 font-medium ${product.stok_saat_ini <= 5 ? "text-danger" : "text-text-secondary"}`}
                                    >
                                        {product.stok_saat_ini > 0
                                            ? `${product.stok_saat_ini} in stock`
                                            : "Habis"}
                                    </p>
                                    <h2 className="text-primary text-2xl font-semibold mt-3">
                                        Rp{" "}
                                        {product.harga
                                            ? product.harga.toLocaleString(
                                                  "id-ID",
                                              )
                                            : 0}
                                    </h2>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* CART AREA */}
                    <div id="tour-cart" className="w-[400px] bg-white rounded-3xl p-6 flex flex-col shadow-sm">
                        <h2 className="text-2xl font-bold text-text">
                            Shopping Cart
                        </h2>

                        {/* CART ITEMS */}
                        <div className="flex-1 overflow-y-auto mt-5 pr-2 custom-scrollbar">
                            {cartItems.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-text-secondary">
                                    Cart is empty
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {cartItems.map((item) => (
                                        <div
                                            key={item._id}
                                            className="bg-gray-50 border border-gray-100 p-4 rounded-2xl flex items-center justify-between"
                                        >
                                            <div className="flex-1 min-w-0 pr-3">
                                                <h3 className="font-semibold text-text truncate">
                                                    {item.nama_produk}
                                                </h3>
                                                <p className="text-sm text-primary font-medium mt-1">
                                                    Rp{" "}
                                                    {(
                                                        (item.harga || 0) *
                                                        item.qty
                                                    ).toLocaleString("id-ID")}
                                                </p>
                                            </div>

                                            {/* Control Qty */}
                                            <div className="flex items-center gap-3 bg-white p-1 rounded-xl border border-gray-200">
                                                <button
                                                    onClick={() =>
                                                        updateQty(item._id, -1)
                                                    }
                                                    className="w-8 h-8 flex items-center justify-center bg-gray-50 hover:bg-gray-200 rounded-lg text-gray-600 transition"
                                                >
                                                    -
                                                </button>
                                                <span className="font-semibold text-sm w-4 text-center">
                                                    {item.qty}
                                                </span>
                                                <button
                                                    onClick={() =>
                                                        updateQty(item._id, 1)
                                                    }
                                                    className="w-8 h-8 flex items-center justify-center bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition"
                                                >
                                                    +
                                                </button>
                                            </div>

                                            {/* Remove Btn */}
                                            <button
                                                onClick={() =>
                                                    removeFromCart(item._id)
                                                }
                                                className="ml-3 text-gray-400 hover:text-danger transition text-xl"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* SUMMARY */}
                        <div className="space-y-3 border-t border-border pt-5 mt-5 text-sm font-medium text-text-secondary">
                            <div className="flex justify-between">
                                <span>Subtotal</span>
                                <span>
                                    Rp {subtotal.toLocaleString("id-ID")}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Tax (10%)</span>
                                <span>Rp {tax.toLocaleString("id-ID")}</span>
                            </div>
                            <div className="flex justify-between text-xl font-bold text-text pt-2">
                                <span>Total</span>
                                <span className="text-primary">
                                    Rp {total.toLocaleString("id-ID")}
                                </span>
                            </div>
                        </div>

                        {/* PAYMENT METHODS */}
                        {/* PAYMENT METHODS */}
                        <div className="mt-6">
                            <h3 className="font-semibold mb-3 text-sm text-text">
                                Payment Method
                            </h3>
                            {/* Ubah grid-cols-4 menjadi grid-cols-2 agar 2 tombol terlihat pas dan penuh */}
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { id: "Cash", img: cashImg, label: "Cash" },
                                    {
                                        id: "QRIS",
                                        img: qrisImg,
                                        label: "E-Money / Transfer",
                                    }, // Ganti nama dan sisakan 2 saja
                                ].map((meth) => (
                                    <button
                                        key={meth.id}
                                        onClick={() =>
                                            setPaymentMethod(meth.id)
                                        }
                                        // TAMBAHAN: Kunci tombol (disabled) jika ini adalah transaksi lanjutan dari Hold
                                        disabled={holdOrderId !== null}
                                        className={`rounded-xl p-3 flex flex-col items-center gap-2 transition-all ${
                                            paymentMethod === meth.id
                                                ? "bg-primary/10 border-2 border-primary"
                                                : "bg-gray-50 border-2 border-transparent hover:bg-gray-100"
                                        } ${holdOrderId !== null ? "opacity-60 cursor-not-allowed" : ""}`} // Efek visual saat dikunci
                                    >
                                        <img
                                            src={meth.img}
                                            alt={meth.label}
                                            className="w-8 h-8 object-contain"
                                        />
                                        <span
                                            className={`text-xs font-bold ${paymentMethod === meth.id ? "text-primary" : "text-gray-500"}`}
                                        >
                                            {meth.label}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                        {holdOrderId && paymentMethod === "QRIS" && (
                            <div className="mt-4 bg-blue-50 border border-blue-200 p-3 rounded-2xl flex items-center justify-between">
                                <div className="text-xs text-blue-700 font-medium">
                                    Metode terkunci di <b>E-Money</b>. Ingin
                                    ganti Bank VA / QRIS lain?
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setHoldSnapToken(null);
                                        Swal.fire({
                                            icon: "success",
                                            title: "Metode Di-reset",
                                            text: "Silakan klik 'Proceed to Payment' untuk memilih opsi Virtual Account/E-Wallet baru.",
                                            timer: 2000,
                                            showConfirmButton: false,
                                        });
                                    }}
                                    className="bg-blue-600 text-white text-xs font-bold px-3 py-2 rounded-xl hover:bg-blue-700 transition"
                                >
                                    Ubah Pilihan
                                </button>
                            </div>
                        )}

                        {/* CHECKOUT & HOLD BUTTONS */}
                        <div className="mt-6 flex flex-col gap-3">
                            <button
                                onClick={handlePayment}
                                disabled={
                                    isSubmitting || cartItems.length === 0
                                }
                                className={`w-full py-4 rounded-2xl text-lg font-bold transition flex justify-center items-center gap-2 ${
                                    isSubmitting || cartItems.length === 0
                                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                        : "bg-primary text-white hover:bg-primary-dark shadow-lg shadow-primary/30"
                                }`}
                            >
                                {isSubmitting ? (
                                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    "Proceed to Payment"
                                )}
                            </button>

                            {cartItems.length > 0 && (
                                <button
                                    onClick={handleHoldManual}
                                    disabled={isSubmitting}
                                    className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-bold transition flex justify-center items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer border-none"
                                >
                                    <FiClock /> Tunda Transaksi (Hold)
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Mulai Shift Overlay */}
            {isStartShiftModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center">
                    <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full mx-4 border border-gray-100 text-left relative">
                        {/* Close icon */}
                        <button
                            onClick={() => setIsStartShiftModalOpen(false)}
                            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-600 transition border-none bg-transparent cursor-pointer"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <div className="text-center mb-6">
                            <h2 className="text-3xl font-extrabold text-gray-800">Mulai Shift Kerja</h2>
                            <p className="text-sm text-gray-500 mt-2">
                                Pilih shift dan aktifkan mesin POS kasir.
                            </p>
                        </div>

                        <div className="space-y-5">
                            {/* Shift Selector */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                                    Pilih Shift Kerja
                                </label>
                                <select
                                    value={shiftName}
                                    onChange={(e) => setShiftName(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 outline-none text-sm font-semibold focus:border-primary focus:bg-white transition"
                                >
                                    <option value="Shift 1">Shift 1 (08:00 - 15:00)</option>
                                    <option value="Shift 2">Shift 2 (15:00 - 22:00)</option>
                                </select>
                            </div>

                            {/* Modal Awal Input — hanya tampil untuk Shift 1 */}
                            {shiftName === "Shift 1" && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                                        Uang Modal Awal (Rp)
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">Rp</span>
                                        <input
                                            type="text"
                                            placeholder="Contoh: 150.000"
                                            value={modalAwalInput}
                                            onChange={(e) => {
                                                const raw = e.target.value.replace(/\D/g, "");
                                                const formatted = raw ? Number(raw).toLocaleString("id-ID") : "";
                                                setModalAwalInput(formatted);
                                            }}
                                            className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 outline-none text-sm font-semibold focus:border-primary focus:bg-white transition"
                                        />
                                    </div>
                                </div>
                            )}

                            {shiftName === "Shift 2" && (
                                <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl text-xs text-blue-700 font-medium">
                                    Shift 2 melanjutkan kas dari Shift 1. Modal awal tidak perlu dimasukkan ulang.
                                </div>
                            )}

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setIsStartShiftModalOpen(false)}
                                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl text-sm font-bold transition cursor-pointer border-none"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleStartShift}
                                    className="flex-1 bg-primary hover:bg-primary-dark text-white py-3 rounded-xl text-sm font-bold transition shadow-lg shadow-cyan-500/20 cursor-pointer border-none"
                                >
                                    Mulai Shift
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Onboarding Guide Tour Overlay */}
            {isTourActive && (
                <div className="fixed inset-0 z-[100] font-poppins">
                    {/* SVG Mask Spotlight Overlay */}
                    <svg className="fixed inset-0 w-full h-full pointer-events-auto" style={{ zIndex: 90 }}>
                        <defs>
                            <mask id="spotlight-mask">
                                <rect width="100%" height="100%" fill="white" />
                                {activeTargetRect && (
                                    <rect
                                        x={activeTargetRect.x - 8}
                                        y={activeTargetRect.y - 8}
                                        width={activeTargetRect.width + 16}
                                        height={activeTargetRect.height + 16}
                                        rx="16"
                                        fill="black"
                                    />
                                )}
                            </mask>
                        </defs>
                        <rect
                            width="100%"
                            height="100%"
                            fill="rgba(15, 23, 42, 0.75)"
                            mask="url(#spotlight-mask)"
                        />
                    </svg>

                    {/* Tooltip Card */}
                    <div
                        style={getTooltipStyles(activeTargetRect, tourSteps[currentTourStep].position)}
                        className="bg-white rounded-3xl p-6 shadow-2xl w-full max-w-sm border border-gray-100 relative transition-all duration-300 transform scale-100"
                    >
                        {/* Skip Button */}
                        <button
                            onClick={handleCompleteTour}
                            className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition border-none bg-transparent cursor-pointer"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        {/* Title & Description */}
                        <div>
                            <span className="text-[10px] uppercase font-bold tracking-wider text-primary">
                                Panduan POS • Langkah {currentTourStep + 1} dari {tourSteps.length}
                            </span>
                            <h3 className="font-extrabold text-gray-800 text-lg mt-1">
                                {tourSteps[currentTourStep].title}
                            </h3>
                            <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                                {tourSteps[currentTourStep].description}
                            </p>
                        </div>

                        {/* Action buttons */}
                        <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100">
                            {/* Skip */}
                            <button
                                onClick={handleCompleteTour}
                                className="text-xs font-bold text-gray-400 hover:text-gray-600 transition border-none bg-transparent cursor-pointer"
                            >
                                Lewati
                            </button>

                            <div className="flex gap-2">
                                {/* Previous */}
                                {currentTourStep > 0 && (
                                    <button
                                        onClick={handlePrevStep}
                                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition border-none cursor-pointer"
                                    >
                                        Kembali
                                    </button>
                                )}

                                {/* Next / Selesai */}
                                <button
                                    onClick={handleNextStep}
                                    className="px-4 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-xl transition shadow-lg shadow-cyan-500/20 border-none cursor-pointer"
                                >
                                    {currentTourStep === tourSteps.length - 1 ? "Selesai" : "Lanjut"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};;

export default KasirPage;
