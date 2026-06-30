import { useEffect, useState } from "react";
import API from "../../services/api";
import Swal from "sweetalert2";

import cashImg from "../../assets/payment/cash.png";
import qrisImg from "../../assets/payment/qris.png";
import transferImg from "../../assets/payment/transfer.png";
import cardImg from "../../assets/payment/card.png";

import { useNavigate } from "react-router-dom";

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

    // HANDLE CHECKOUT (PROSES KE BACKEND)
    // HANDLE CHECKOUT (PROSES KE BACKEND)
    // HANDLE CHECKOUT (PROSES KE BACKEND)
    const handlePayment = async () => {
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

        // TAMPILKAN KONFIRMASI DETAIL PESANAN
        const cartHtml = `
            <div class="text-left font-poppins text-gray-700">
                <div class="mb-4">
                    <span class="text-xs font-semibold uppercase tracking-wider text-gray-400">Metode Pembayaran</span>
                    <div class="flex items-center gap-2 mt-1">
                        <span class="px-3 py-1.5 bg-primary/10 text-primary rounded-xl text-sm font-bold">
                            ${paymentMethod === "QRIS" ? "E-Money / Transfer (Midtrans)" : "Cash (Tunai)"}
                        </span>
                    </div>
                </div>
                
                <span class="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-2">Detail Item</span>
                <div class="max-h-48 overflow-y-auto mb-4 border border-gray-100 rounded-xl p-3 bg-gray-50 space-y-2">
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
                        <span>Rp ${total.toLocaleString("id-ID")}</span>
                    </div>
                </div>
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
            }
        });

        if (!result.isConfirmed) {
            return; // Hentikan proses jika kasir membatalkan
        }

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
        const saveTransactionToDatabase = async (finalPayload) => {
            try {
                await API.post("/transactions", finalPayload, config);

                Swal.fire({
                    icon: "success",
                    title: "Transaksi Berhasil!",
                    text: "Pembayaran telah diterima dan stok otomatis berkurang.",
                    timer: 2000,
                    showConfirmButton: false,
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
                    const holdPayload = {
                        ...payload,
                        order_id: uniqueOrderId,
                        is_hold: true,
                        status_pembayaran: "Pending",
                        metode_pembayaran: paymentMethod,
                        snap_token: snapTokenToUse,
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
            await saveTransactionToDatabase(payload);
        }
    };

    return (
        <div className="flex h-screen bg-background font-poppins">
            {/* MAIN */}
            <div className="flex-1 p-6 overflow-hidden">
                {/* TOPBAR */}
                <div className="flex justify-between items-center">
                    <h1 className="text-4xl font-bold text-text">
                        Cashier Dashboard
                    </h1>
                    <input
                        type="text"
                        placeholder="Search..."
                        className="w-[300px] bg-white border border-border rounded-2xl px-5 py-3 outline-none"
                    />
                </div>

                {/* CONTENT */}
                <div className="flex gap-6 mt-8 h-[calc(100vh-120px)]">
                    {/* PRODUCT AREA */}
                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        {/* SEARCH */}
                        <div className="bg-white rounded-3xl p-5 shadow-sm">
                            <input
                                type="text"
                                placeholder="Search products..."
                                className="w-full border border-border rounded-2xl p-4 outline-none focus:border-primary"
                            />
                            {/* CATEGORY */}
                            <div className="flex gap-4 mt-5 overflow-x-auto">
                                <button className="bg-primary text-white px-6 py-3 rounded-2xl whitespace-nowrap">
                                    All
                                </button>
                            </div>
                        </div>

                        {/* PRODUCT GRID */}
                        <div className="grid grid-cols-3 gap-5 mt-6">
                            {products.map((product) => (
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
                    <div className="w-[400px] bg-white rounded-3xl p-6 flex flex-col shadow-sm">
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

                        {/* CHECKOUT BUTTON */}
                        <div className="mt-6">
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
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};;

export default KasirPage;
