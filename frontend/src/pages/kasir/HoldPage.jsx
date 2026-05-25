import { useEffect, useState } from "react";
import axios from "axios";
import {
    FiClock,
    FiEye,
    FiTrash2,
} from "react-icons/fi";

const HoldPage = () => {
    const [holdTransactions, setHoldTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHold = async () => {
            try {
                const res = await axios.get(
                    "http://localhost:5000/api/transactions/hold"
                );

                setHoldTransactions(res.data);
            } catch (error) {
                console.log(error);
            } finally {
                setLoading(false);
            }
        };

        fetchHold();
    }, []);

    return (
        <div className="p-8 bg-background h-screen overflow-y-auto font-poppins">

            {/* HEADER */}
            <div>
                <h1 className="text-4xl font-bold text-text">
                    Hold Transactions
                </h1>

                <p className="text-text-secondary mt-2">
                    Manage pending cashier transactions
                </p>
            </div>

            {/* CONTENT */}
            {loading ? (
                <p className="mt-8">Loading...</p>
            ) : holdTransactions.length === 0 ? (
                <p className="mt-8">No hold transactions</p>
            ) : (
                <div className="grid grid-cols-3 gap-6 mt-8">

                    {holdTransactions.map((hold) => (
                        <div
                            key={hold.id}
                            className="bg-white rounded-3xl p-6"
                        >

                            {/* TOP */}
                            <div className="flex items-center justify-between">

                                <div className="bg-yellow-100 text-yellow-600 p-4 rounded-2xl">
                                    <FiClock size={28} />
                                </div>

                                <span className="bg-yellow-100 text-yellow-600 px-4 py-2 rounded-xl text-sm font-medium">
                                    HOLD
                                </span>

                            </div>

                            {/* CONTENT */}
                            <div className="mt-6">

                                <h2 className="text-2xl font-bold">
                                    {hold.invoice}
                                </h2>

                                <p className="text-text-secondary mt-2">
                                    {hold.customer}
                                </p>

                            </div>

                            {/* INFO */}
                            <div className="space-y-3 mt-6">

                                <div className="flex justify-between">
                                    <span className="text-text-secondary">
                                        Date
                                    </span>

                                    <span className="font-semibold">
                                        {new Date(hold.date).toLocaleDateString("id-ID")}
                                    </span>
                                </div>

                                <div className="flex justify-between">
                                    <span className="text-text-secondary">
                                        Total
                                    </span>

                                    <span className="font-bold text-primary">
                                        Rp {hold.total.toLocaleString()}
                                    </span>
                                </div>

                            </div>

                            {/* ACTION */}
                            <div className="flex gap-3 mt-8">

                                <button className="flex-1 bg-primary text-white py-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-primary-dark transition">
                                    <FiEye />
                                    Open
                                </button>

                                <button className="bg-red-100 text-red-500 px-5 rounded-2xl hover:bg-red-200 transition">
                                    <FiTrash2 />
                                </button>

                            </div>

                        </div>
                    ))}

                </div>
            )}

        </div>
    );
};

export default HoldPage;