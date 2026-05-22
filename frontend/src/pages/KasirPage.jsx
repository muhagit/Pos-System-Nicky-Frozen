const KasirPage = () => {
    return (
        <div className="flex h-screen bg-background font-poppins">

            {/* SIDEBAR */}
            <div className="w-[280px] bg-sidebar text-white flex flex-col justify-between p-5">

                <div>

                    {/* LOGO */}
                    <div>
                        <h1 className="text-3xl font-bold">
                            Nicky Frozen
                        </h1>

                        <p className="text-primary mt-1">
                            Cashier
                        </p>
                    </div>

                    {/* PROFILE */}
                    <div className="bg-sidebar-light rounded-2xl p-5 flex items-center gap-4 mt-8">

                        <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center font-bold text-xl">
                            M
                        </div>

                        <div>
                            <h3 className="font-semibold">
                                Maria Santos
                            </h3>

                            <p className="text-sm text-gray-300">
                                Cashier Account
                            </p>
                        </div>

                    </div>

                    {/* MENU */}
                    <div className="flex flex-col gap-4 mt-10">

                        <button className="bg-primary p-4 rounded-2xl text-left font-medium">
                            POS Transaction
                        </button>

                        <button className="p-4 rounded-2xl text-left hover:bg-sidebar-light transition">
                            History
                        </button>

                        <button className="p-4 rounded-2xl text-left hover:bg-sidebar-light transition">
                            Hold Transactions
                        </button>

                        <button className="p-4 rounded-2xl text-left hover:bg-sidebar-light transition">
                            Report
                        </button>

                        <button className="p-4 rounded-2xl text-left hover:bg-sidebar-light transition">
                            Notifications
                        </button>

                    </div>

                </div>

                {/* LOGOUT */}
                <button className="bg-sidebar-light p-4 rounded-2xl">
                    Logout
                </button>

            </div>

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

                                <button className="bg-gray-100 px-6 py-3 rounded-2xl whitespace-nowrap">
                                    Nugget
                                </button>

                                <button className="bg-gray-100 px-6 py-3 rounded-2xl whitespace-nowrap">
                                    Fish
                                </button>

                                <button className="bg-gray-100 px-6 py-3 rounded-2xl whitespace-nowrap">
                                    Fries
                                </button>

                                <button className="bg-gray-100 px-6 py-3 rounded-2xl whitespace-nowrap">
                                    Meatball
                                </button>

                            </div>

                        </div>

                        {/* PRODUCT GRID */}
                        <div className="grid grid-cols-3 gap-5 mt-6">

                            {[1,2,3,4,5,6].map((item) => (

                                <div
                                    key={item}
                                    className="bg-white rounded-3xl p-5"
                                >

                                    <div className="h-[160px] bg-cyan-100 rounded-2xl flex items-center justify-center text-6xl">
                                        🛒
                                    </div>

                                    <h3 className="font-semibold text-xl mt-5">
                                        Chicken Nugget
                                    </h3>

                                    <p className="text-text-secondary mt-2">
                                        245 in stock
                                    </p>

                                    <h2 className="text-primary text-3xl font-bold mt-4">
                                        Rp 45.000
                                    </h2>

                                </div>

                            ))}

                        </div>

                    </div>

                    {/* CART */}
                    <div className="w-[360px] bg-white rounded-3xl p-6">

                        <h2 className="text-3xl font-bold">
                            Shopping Cart
                        </h2>

                        <div className="h-[250px] flex items-center justify-center text-text-secondary">
                            Cart is empty
                        </div>

                        {/* SUMMARY */}
                        <div className="space-y-4 border-t border-border pt-5">

                            <div className="flex justify-between">
                                <span>Subtotal</span>
                                <span>Rp 0</span>
                            </div>

                            <div className="flex justify-between">
                                <span>Tax (10%)</span>
                                <span>Rp 0</span>
                            </div>

                            <div className="flex justify-between text-2xl font-bold">
                                <span>Total</span>
                                <span className="text-primary">
                                    Rp 0
                                </span>
                            </div>

                        </div>

                        {/* PAYMENT */}
                        <div className="mt-8">

                            <h3 className="font-semibold mb-4">
                                Select Payment Method
                            </h3>

                            <div className="grid grid-cols-2 gap-3">

                                <button className="bg-gray-100 p-4 rounded-2xl">
                                    Cash
                                </button>

                                <button className="bg-gray-100 p-4 rounded-2xl">
                                    QRIS
                                </button>

                                <button className="bg-gray-100 p-4 rounded-2xl">
                                    GoPay
                                </button>

                                <button className="bg-gray-100 p-4 rounded-2xl">
                                    Card
                                </button>

                            </div>

                        </div>

                        {/* BUTTON */}
                        <button className="w-full bg-primary text-white py-5 rounded-2xl mt-8 text-lg font-semibold">
                            Proceed to Payment
                        </button>

                    </div>

                </div>

            </div>

        </div>
    );
};

export default KasirPage;