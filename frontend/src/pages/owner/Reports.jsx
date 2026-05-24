const Reports = () => {
  return (
    <div className="p-6 min-h-screen bg-background overflow-y-auto">

      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">

        <div>
          <h1 className="text-3xl font-bold text-text">
            Financial Reports
          </h1>

          <p className="text-text-secondary mt-1">
            Daily financial summary and transaction reports
          </p>
        </div>

        <div className="flex gap-3">

          <button className="bg-card border border-border px-4 py-2 rounded-xl text-text font-medium hover:bg-background transition">
            Export PDF
          </button>

          <button className="bg-primary px-4 py-2 rounded-xl text-sidebar font-semibold hover:opacity-90 transition">
            Export Excel
          </button>

        </div>

      </div>

      {/* SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

        <div className="bg-card border border-border rounded-2xl p-5">
          <p className="text-text-secondary text-sm">
            Total Revenue
          </p>

          <h2 className="text-2xl font-bold text-text mt-2">
            Rp 25.4M
          </h2>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5">
          <p className="text-text-secondary text-sm">
            Transactions
          </p>

          <h2 className="text-2xl font-bold text-text mt-2">
            1,240
          </h2>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5">
          <p className="text-text-secondary text-sm">
            Cash Income
          </p>

          <h2 className="text-2xl font-bold text-text mt-2">
            Rp 12.1M
          </h2>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5">
          <p className="text-text-secondary text-sm">
            QRIS / E-Wallet
          </p>

          <h2 className="text-2xl font-bold text-text mt-2">
            Rp 13.3M
          </h2>
        </div>

      </div>

      {/* TABLE */}
      <div className="bg-card border border-border rounded-2xl p-6 mt-8">

        <div className="flex items-center justify-between mb-6">

          <div>
            <h2 className="text-xl font-semibold text-text">
              Daily Transactions
            </h2>

            <p className="text-text-secondary text-sm mt-1">
              Financial transaction records
            </p>
          </div>

          <button className="bg-primary px-4 py-2 rounded-xl text-sidebar font-semibold hover:opacity-90 transition">
            Close Daily Book
          </button>

        </div>

        <div className="overflow-x-auto">

          <table className="w-full">

            <thead>
              <tr className="border-b border-border text-text-secondary text-sm">
                <th className="text-left py-4">Date</th>
                <th className="text-left">Transactions</th>
                <th className="text-left">Revenue</th>
                <th className="text-left">Payment</th>
                <th className="text-left">Status</th>
              </tr>
            </thead>

            <tbody>

              <tr className="border-b border-border">
                <td className="py-4 text-text">
                  24 May 2026
                </td>

                <td className="text-text">
                  245
                </td>

                <td className="text-text font-medium">
                  Rp 5.2M
                </td>

                <td className="text-text-secondary">
                  Cash & QRIS
                </td>

                <td>
                  <span className="bg-success/10 text-success px-3 py-1 rounded-full text-xs font-medium">
                    Completed
                  </span>
                </td>
              </tr>

              <tr className="border-b border-border">
                <td className="py-4 text-text">
                  23 May 2026
                </td>

                <td className="text-text">
                  198
                </td>

                <td className="text-text font-medium">
                  Rp 4.7M
                </td>

                <td className="text-text-secondary">
                  Cash & GoPay
                </td>

                <td>
                  <span className="bg-warning/10 text-warning px-3 py-1 rounded-full text-xs font-medium">
                    Pending
                  </span>
                </td>
              </tr>

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
};

export default Reports;