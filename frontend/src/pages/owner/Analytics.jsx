const Analytics = () => {
  return (
    <div className="p-6 min-h-screen bg-background">
      
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text">
          Analytics
        </h1>

        <p className="text-text-secondary mt-1">
          Business performance overview
        </p>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        
        <div className="bg-card p-5 rounded-2xl shadow-sm border border-border">
          <p className="text-text-secondary">Total Revenue</p>
          <h2 className="text-2xl font-bold text-text">
            Rp 250M
          </h2>
        </div>

        <div className="bg-card p-5 rounded-2xl shadow-sm border border-border">
          <p className="text-text-secondary">Total Orders</p>
          <h2 className="text-2xl font-bold text-text">
            1,240
          </h2>
        </div>

        <div className="bg-card p-5 rounded-2xl shadow-sm border border-border">
          <p className="text-text-secondary">Customers</p>
          <h2 className="text-2xl font-bold text-text">
            890
          </h2>
        </div>

        <div className="bg-card p-5 rounded-2xl shadow-sm border border-border">
          <p className="text-text-secondary">Conversion Rate</p>
          <h2 className="text-2xl font-bold text-text">
            18%
          </h2>
        </div>

      </div>

      {/* CHART */}
      <div className="mt-8 bg-card p-6 rounded-2xl shadow-sm border border-border">
        
        <h2 className="font-semibold text-text mb-4">
          Revenue Trend
        </h2>

        <div className="h-[300px] flex items-center justify-center text-text-secondary">
          Chart coming soon...
        </div>

      </div>

    </div>
  );
};

export default Analytics;