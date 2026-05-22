import {
    FiArrowLeft,
    FiSearch,
    FiEye,
} from "react-icons/fi";

const HistoryPage = () => {

    const transactions = [
        {
            id: "INV-001",
            customer: "Walk In Customer",
            payment: "Cash",
            total: 125000,
            status: "Success",
            date: "21 May 2026",
        },
        {
            id: "INV-002",
            customer: "Walk In Customer",
            payment: "QRIS",
            total: 87000,
            status: "Success",
            date: "21 May 2026",
        },
        {
            id: "INV-003",
            customer: "Walk In Customer",
            payment: "Transfer",
            total: 230000,
            status: "Pending",
            date: "21 May 2026",
        },
    ];

    return (
        <div className="p-8 bg-background h-screen overflow-y-auto font-poppins">

            {/* HEADER */}
            <div className="flex items-center justify-between">

                <div className="flex items-center gap-4">

                    <button className="bg-white p-3 rounded-2xl shadow-sm">

                        <FiArrowLeft size={22} />

                    </button>

                    <div>

                        <h1 className="text-4xl font-bold text-text">
                            Transaction History
                        </h1>

                        <p className="text-text-secondary mt-1">
                            View all cashier transactions
                        </p>

                    </div>

                </div>

                {/* SEARCH */}
                <div className="bg-white rounded-2xl px-4 py-3 flex items-center gap-3 w-[320px]">

                    <FiSearch className="text-gray-400" />

                    <input
                        type="text"
                        placeholder="Search invoice..."
                        className="outline-none w-full"
                    />

                </div>

            </div>

            {/* TABLE */}
            <div className="bg-white rounded-3xl p-6 mt-8 overflow-x-auto">

                <table className="w-full">

                    <thead>

                        <tr className="text-left border-b border-border">

                            <th className="pb-4">
                                Invoice
                            </th>

                            <th className="pb-4">
                                Customer
                            </th>

                            <th className="pb-4">
                                Payment
                            </th>

                            <th className="pb-4">
                                Date
                            </th>

                            <th className="pb-4">
                                Total
                            </th>

                            <th className="pb-4">
                                Status
                            </th>

                            <th className="pb-4 text-center">
                                Action
                            </th>

                        </tr>

                    </thead>

                    <tbody>

                        {transactions.map((trx) => (

                            <tr
                                key={trx.id}
                                className="border-b border-border hover:bg-gray-50 transition"
                            >

                                <td className="py-5 font-semibold">
                                    {trx.id}
                                </td>

                                <td>
                                    {trx.customer}
                                </td>

                                <td>
                                    {trx.payment}
                                </td>

                                <td>
                                    {trx.date}
                                </td>

                                <td className="font-semibold text-primary">
                                    Rp {trx.total.toLocaleString()}
                                </td>

                                <td>

                                    <span
                                        className={`px-4 py-2 rounded-xl text-sm font-medium ${
                                            trx.status === "Success"
                                                ? "bg-green-100 text-green-600"
                                                : "bg-yellow-100 text-yellow-600"
                                        }`}
                                    >

                                        {trx.status}

                                    </span>

                                </td>

                                <td className="text-center">

                                    <button className="bg-primary text-white p-3 rounded-xl hover:bg-primary-dark transition">

                                        <FiEye />

                                    </button>

                                </td>

                            </tr>

                        ))}

                    </tbody>

                </table>

            </div>

        </div>
    );
};

export default HistoryPage;