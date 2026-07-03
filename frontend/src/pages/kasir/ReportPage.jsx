import {
  FiDollarSign,
  FiShoppingBag,
  FiCreditCard,
  FiTrendingUp,
} from "react-icons/fi";
import { useEffect, useState } from "react";
import axios from "axios";

const ReportPage = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const reportCards = report
    ? [
        {
          title: "Total Revenue",
          value: `Rp ${report.totalRevenue.toLocaleString()}`,
          icon: <FiDollarSign size={28} />,
        },
        {
          title: "Total Transactions",
          value: report.totalTransactions,
          icon: <FiShoppingBag size={28} />,
        },
        {
          title: "Payment Methods",
          value: `${Object.keys(report.paymentMethods).length} Active`,
          icon: <FiCreditCard size={28} />,
        },
        {
          title: "Sales Growth",
          value: "+12%",
          icon: <FiTrendingUp size={28} />,
        },
      ]
    : [];

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const userInfo = JSON.parse(localStorage.getItem("userInfo"));
        const config = {
          headers: { Authorization: `Bearer ${userInfo?.token}` },
        };
        const res = await axios.get(
          "http://localhost:5000/api/transactions/report",
          config
        );

        setReport(res.data);
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, []);

  return (
    <div className="p-8 bg-background h-screen overflow-y-auto font-poppins">
      {/* HEADER */}
      <div>
        <h1 className="text-4xl font-bold text-text">Sales Report</h1>

        <p className="text-text-secondary mt-2">
          Monitor cashier sales performance
        </p>
      </div>

      {/* RECENT TRANSACTION */}
      <div className="bg-white rounded-3xl p-6 mt-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Recent Transactions</h2>

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
                <th className="pb-4">Invoice</th>

                <th className="pb-4">Payment</th>

                <th className="pb-4">Cashier</th>

                <th className="pb-4">Date</th>

                <th className="pb-4">Total</th>
              </tr>
            </thead>

            <tbody>
              {report?.recent?.map((item, index) => (
                <tr key={index}>
                  <td className="py-5 font-semibold">{item.invoice}</td>

                  <td>{item.payment}</td>

                  <td>{item.cashier}</td>

                  <td>{new Date(item.date).toLocaleDateString("id-ID")}</td>

                  <td className="font-bold text-primary">
                    Rp {item.total.toLocaleString()}
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
