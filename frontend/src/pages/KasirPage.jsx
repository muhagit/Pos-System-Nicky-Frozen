import { useEffect, useState } from "react";
import API from "../services/api";

import cashImg from "../assets/payment/cash.png";
import qrisImg from "../assets/payment/qris.png";
import transferImg from "../assets/payment/transfer.png";
import cardImg from "../assets/payment/card.png";

import {
  FiShoppingCart,
  FiClock,
  FiBell,
  FiLogOut,
  FiFileText,
} from "react-icons/fi";

import { useNavigate } from "react-router-dom";

const KasirPage = () => {
  const navigate = useNavigate();

  // USER LOGIN
  const userInfo = JSON.parse(localStorage.getItem("userInfo"));

  // STATE
  const [products, setProducts] = useState([]);
  const [cartItems, setCartItems] = useState([]);

  // FETCH PRODUCT
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await API.get("/products");

        setProducts(response.data);
      } catch (error) {
        console.log(error);
      }
    };

    fetchProducts();
  }, []);

  // ADD TO CART
  const addToCart = (product) => {
    const existingItem = cartItems.find((item) => item._id === product._id);

    if (existingItem) {
      const updatedCart = cartItems.map((item) =>
        item._id === product._id
          ? {
              ...item,
              qty: item.qty + 1,
            }
          : item,
      );

      setCartItems(updatedCart);
    } else {
      setCartItems([
        ...cartItems,
        {
          ...product,
          qty: 1,
        },
      ]);
    }
  };

  // TOTAL
  const subtotal = cartItems.reduce(
    (acc, item) => acc + item.harga * item.qty,
    0,
  );

  const tax = subtotal * 0.1;

  const total = subtotal + tax;

  return (
    <div className="flex h-screen bg-background font-poppins">
      

      {/* MAIN */}
      <div className="flex-1 p-6 overflow-hidden">
        {/* TOPBAR */}
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold text-text">Cashier Dashboard</h1>

          <input
            type="text"
            placeholder="Search..."
            className="w-[300px] bg-white border border-border rounded-2xl px-5 py-3 outline-none"
          />
        </div>

        {/* CONTENT */}
        <div className="flex gap-6 mt-8 h-[calc(100vh-120px)]">
          {/* PRODUCT AREA */}
          <div className="flex-1 overflow-y-auto">
            {/* SEARCH */}
            <div className="bg-white rounded-3xl p-5">
              <input
                type="text"
                placeholder="Search products..."
                className="w-full border border-border rounded-2xl p-4 outline-none"
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
                  className="bg-white rounded-3xl p-5 cursor-pointer hover:scale-[1.02] transition"
                >
                  <div className="h-[160px] bg-cyan-100 rounded-2xl flex items-center justify-center text-6xl">
                    🛒
                  </div>

                  <h3 className="font-semibold text-xl mt-5">
                    {product.nama_produk}
                  </h3>

                  <p className="text-text-secondary mt-2">
                    {product.stok} in stock
                  </p>

                  <h2 className="text-primary text-2xl font-semibold mt-4">
                    Rp {product.harga.toLocaleString()}
                  </h2>
                </div>
              ))}
            </div>
          </div>

          {/* CART */}
          <div className="w-[360px] bg-white rounded-3xl p-6 flex flex-col overflow-y-auto">
            <h2 className="text-3xl font-bold">Shopping Cart</h2>

            {/* CART ITEMS */}
            <div className="flex-1 overflow-y-auto mt-5">
              {cartItems.length === 0 ? (
                <div className="h-full flex items-center justify-center text-text-secondary">
                  Cart is empty
                </div>
              ) : (
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <div key={item._id} className="bg-gray-50 p-4 rounded-2xl">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-semibold">{item.nama_produk}</h3>

                          <p className="text-sm text-gray-500">
                            Rp {item.harga.toLocaleString()}
                          </p>
                        </div>

                        <div className="bg-primary text-white px-3 py-1 rounded-xl">
                          x{item.qty}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SUMMARY */}
            <div className="space-y-4 border-t border-border pt-5 mt-5">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>Rp {subtotal.toLocaleString()}</span>
              </div>

              <div className="flex justify-between">
                <span>Tax (10%)</span>
                <span>Rp {tax.toLocaleString()}</span>
              </div>

              <div className="flex justify-between text-xl font-bold">
                <span>Total</span>

                <span className="text-primary">
                  Rp {total.toLocaleString()}
                </span>
              </div>
            </div>

            {/* PAYMENT */}
            <div className="mt-8">
              <h3 className="font-semibold mb-4">Select Payment Method</h3>

              <div className="grid grid-cols-4 gap-3">
                <button className="bg-gray-100 rounded-2xl p-3 flex flex-col items-center gap-2">
                  <img
                    src={cashImg}
                    alt="Cash"
                    className="w-7 h-7 object-contain"
                  />

                  <span className="text-xs font-medium">Cash</span>
                </button>

                <button className="bg-gray-100 rounded-2xl p-3 flex flex-col items-center gap-2">
                  <img
                    src={qrisImg}
                    alt="QRIS"
                    className="w-7 h-7 object-contain"
                  />

                  <span className="text-xs font-medium">QRIS</span>
                </button>

                <button className="bg-gray-100 rounded-2xl p-3 flex flex-col items-center gap-2">
                  <img
                    src={transferImg}
                    alt="Transfer"
                    className="w-7 h-7 object-contain"
                  />

                  <span className="text-xs font-medium">Transfer</span>
                </button>

                <button className="bg-gray-100 rounded-2xl p-3 flex flex-col items-center gap-2">
                  <img
                    src={cardImg}
                    alt="Card"
                    className="w-7 h-7 object-contain"
                  />

                  <span className="text-xs font-medium">Card</span>
                </button>
              </div>
            </div>

            {/* BUTTON */}
            <div className="mt-auto">
              <button className="w-full bg-primary text-white py-4 rounded-2xl mt-8 text-lg font-semibold hover:bg-primary-dark transition">
                Proceed to Payment
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KasirPage;
