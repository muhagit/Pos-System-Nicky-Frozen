import {
    FiDollarSign,
    FiShoppingBag,
    FiCreditCard,
    FiTrendingUp,
} from "react-icons/fi";

const ReportPage = () => {

    const reportCards = [
        {
            title: "Total Revenue",
            value: "Rp 12.500.000",
            icon: <FiDollarSign size={28} />,
        },
        {
            title: "Total Transactions",
            value: "245",
            icon: <FiShoppingBag size={28} />,
        },
        {
            title: "Payment Methods",
            value: "4 Active",
            icon: <FiCreditCard size={28} />,
        },
        {
            title: "Sales Growth",
            value: "+12%",
            icon: <FiTrendingUp size={28} />,
        },
    ];

    const recentReports = [
        {
            invoice: "INV-001",
            payment: "Cash",
            total: 120000,
            cashier: "Ammar",
            date: "21 May 2026",
        },
        {
            invoice: "INV-002",
            payment: "QRIS",
            total: 85000,
            cashier: "Ammar",
            date: "21 May 2026",
        },
        {
            invoice: "INV-003",
            payment: "Transfer",
            total: 230000,
            cashier: "Ammar",
            date: "21 May 2026",
        },
    ];

    return (
        <div className="p-8 bg-background h-screen overflow-y-auto font-poppins">

            {/* HEADER */}
            <div>

                <h1 className="text-4xl font-bold text-text">
                    Sales Report
                </h1>

                <p className="text-text-secondary mt-2">
                    Monitor cashier sales performance
                </p>

            </div>

            {/* REPORT CARDS */}
            <div className="grid grid-cols-4 gap-6 mt-8">

                {reportCards.map((card, index) => (

                    <div
                        key={index}
                        className="bg-white rounded-3xl p-6"
                    >

                        <div className="bg-primary/10 text-primary w-fit p-4 rounded-2xl">

                            {card.icon}

                        </div>

                        <h3 className="text-text-secondary mt-5">
                            {card.title}
                        </h3>

                        <h1 className="text-3xl font-bold mt-2">
                            {card.value}
                        </h1>

                    </div>

                ))}

            </div>

            {/* RECENT TRANSACTION */}
            <div className="bg-white rounded-3xl p-6 mt-8">

                <div className="flex items-center justify-between">

                    <div>

                        <h2 className="text-2xl font-bold">
                            Recent Transactions
                        </h2>

                        <p className="text-text-secondary mt-1">
                            Latest cashier transaction reports
                        </p>

                    </div>

                    <button className="bg-primary text-white px-6 py-3 rounded-2xl hover:bg-primary-dark transition">

                        Export Report

                    </button>

                </div>

                {/* TABLE */}
                <div className="overflow-x-auto mt-6">

                    <table className="w-full">

                        <thead>

                            <tr className="border-b border-border text-left">

                                <th className="pb-4">
                                    Invoice
                                </th>

                                <th className="pb-4">
                                    Payment
                                </th>

                                <th className="pb-4">
                                    Cashier
                                </th>

                                <th className="pb-4">
                                    Date
                                </th>

                                <th className="pb-4">
                                    Total
                                </th>

                            </tr>

                        </thead>

                        <tbody>

                            {recentReports.map((report, index) => (

                                <tr
                                    key={index}
                                    className="border-b border-border hover:bg-gray-50 transition"
                                >

                                    <td className="py-5 font-semibold">
                                        {report.invoice}
                                    </td>

                                    <td>
                                        {report.payment}
                                    </td>

                                    <td>
                                        {report.cashier}
                                    </td>

                                    <td>
                                        {report.date}
                                    </td>

                                    <td className="font-bold text-primary">
                                        Rp {report.total.toLocaleString()}
                                    </td>

                                </tr>

                            ))}

                        </tbody>

                    </table>

                </div>

            </div>

        </div>
    );
};

export default ReportPage;