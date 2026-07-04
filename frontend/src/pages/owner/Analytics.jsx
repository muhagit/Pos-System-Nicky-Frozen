import { useEffect, useState } from "react";
import api from "../../utils/api";

const Analytics = () => {
  const [analytics, setAnalytics] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    customers: 0,
    conversionRate: 100,
  });

  const [loading, setLoading] = useState(false);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      const [reportRes, usersRes] = await Promise.all([
        api.get("/transactions/report"),
        api.get("/users"),
      ]);

      const report = reportRes.data;

      setAnalytics({
        totalRevenue: report.totalRevenue || 0,
        totalOrders: report.totalTransactions || 0,
        customers: usersRes.data.length || 0,
        conversionRate: 100,
      });
    } catch (error) {
      console.error(error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold">Loading...</h2>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen bg-background">
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text">Analytics</h1>
        <p className="text-text-secondary mt-1">
          Business performance overview
        </p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

        {/* Revenue */}
        <div className="bg-card p-5 rounded-2xl shadow-sm border border-border">
          <p className="text-text-secondary mb-2">Total Revenue</p>

          <h2 className="text-2xl font-bold text-text">
            Rp {analytics.totalRevenue.toLocaleString("id-ID")}
          </h2>
        </div>

        {/* Orders */}
        <div className="bg-card p-5 rounded-2xl shadow-sm border border-border">
          <p className="text-text-secondary mb-2">Total Orders</p>

          <h2 className="text-2xl font-bold text-text">
            {analytics.totalOrders}
          </h2>
        </div>

        {/* Customers */}
        <div className="bg-card p-5 rounded-2xl shadow-sm border border-border">
          <p className="text-text-secondary mb-2">Customers</p>

          <h2 className="text-2xl font-bold text-text">
            {analytics.customers}
          </h2>
        </div>

        {/* Conversion */}
        <div className="bg-card p-5 rounded-2xl shadow-sm border border-border">
          <p className="text-text-secondary mb-2">Conversion Rate</p>

          <h2 className="text-2xl font-bold text-text">
            {analytics.conversionRate}%
          </h2>
        </div>

      </div>

      {/* Placeholder */}
      <div className="mt-8 bg-card p-6 rounded-2xl shadow-sm border border-border">
        <h2 className="font-semibold text-text mb-4">
          Revenue Trend
        </h2>

        <div className="h-[300px] flex items-center justify-center text-text-secondary">
          Chart akan ditambahkan pada tahap berikutnya.
        </div>
      </div>
    </div>
  );
};

export default Analytics;