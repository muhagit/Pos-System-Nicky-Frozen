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
        setCartItems(cartItems.filter((item) => item._id !== id));
    };

    // KALKULASI HARGA
    const subtotal = cartItems.reduce(
        (acc, item) => acc + item.harga * item.qty,
        0,
    );
    const tax = subtotal * 0.1; // Pajak 10%
    const total = subtotal + tax;

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

        setIsSubmitting(true);

        try {
            const config = {
                headers: { Authorization: `Bearer ${userInfo?.token}` },
            };

            const payload = {
                user_id: userInfo?._id, // Tambahkan ini agar masuk ke user_id (Kasir)
                cabang: userInfo?.cabang || "Pusat",
                metode_pembayaran: paymentMethod,
                total_pembayaran: total, // Ubah dari total_harga menjadi total_pembayaran
                is_hold: false,
                detail_transaksi: cartItems.map((item) => ({
                    // Ubah dari item_transaksi
                    produk_id: item._id, // Ubah dari product_id
                    kuantitas: item.qty, // Ubah dari qty
                    harga_satuan: item.harga, // Ubah dari harga (jika diperlukan di model)
                    subtotal: item.harga * item.qty,
                })),

                // Tambahan data ini opsional jika backend Anda membutuhkannya untuk struk (tidak masuk model schema)
                subtotal_keranjang: subtotal,
                pajak: tax,
                kasir: userInfo?.nama_lengkap || "Kasir",
            };

            await API.post("/transactions", payload, config);

            Swal.fire({
                icon: "success",
                title: "Transaksi Berhasil!",
                text: "Pembayaran telah diterima dan stok otomatis berkurang.",
                timer: 2000,
                showConfirmButton: false,
            });

            setCartItems([]);
            setPaymentMethod("");
            fetchProducts();
        } catch (error) {
            Swal.fire(
                "Gagal",
                error.response?.data?.message || "Terjadi kesalahan sistem",
                "error",
            );
        } finally {
            setIsSubmitting(false);
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
                        <div className="mt-6">
                            <h3 className="font-semibold mb-3 text-sm text-text">
                                Payment Method
                            </h3>
                            <div className="grid grid-cols-4 gap-3">
                                {[
                                    { id: "Cash", img: cashImg, label: "Cash" },
                                    { id: "QRIS", img: qrisImg, label: "QRIS" },
                                    {
                                        id: "Transfer",
                                        img: transferImg,
                                        label: "Transfer",
                                    },
                                    { id: "Card", img: cardImg, label: "Card" },
                                ].map((meth) => (
                                    <button
                                        key={meth.id}
                                        onClick={() =>
                                            setPaymentMethod(meth.id)
                                        }
                                        className={`rounded-xl p-2 flex flex-col items-center gap-1 transition-all ${
                                            paymentMethod === meth.id
                                                ? "bg-primary/10 border-2 border-primary"
                                                : "bg-gray-50 border-2 border-transparent hover:bg-gray-100"
                                        }`}
                                    >
                                        <img
                                            src={meth.img}
                                            alt={meth.label}
                                            className="w-6 h-6 object-contain"
                                        />
                                        <span
                                            className={`text-[10px] font-bold ${paymentMethod === meth.id ? "text-primary" : "text-gray-500"}`}
                                        >
                                            {meth.label}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

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
};

export default KasirPage;
