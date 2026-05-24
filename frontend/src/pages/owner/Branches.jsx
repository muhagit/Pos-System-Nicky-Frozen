const Branches = () => {
  return (
    <div className="p-6 min-h-screen bg-background overflow-y-auto">

      {/* HEADER */}
      <div className="mb-8">

        <h1 className="text-3xl font-bold text-text">
          Branch Monitoring
        </h1>

        <p className="text-text-secondary mt-1">
          Monitor synchronization and sales performance across branches
        </p>

      </div>

      {/* SYNC STATUS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        <div className="bg-card border border-border rounded-2xl p-5">

          <div className="flex items-center justify-between">

            <div>
              <h2 className="text-lg font-semibold text-text">
                Depok Branch
              </h2>

              <p className="text-text-secondary text-sm mt-1">
                Last Sync: 2 seconds ago
              </p>
            </div>

            <span className="bg-success/10 text-success px-3 py-1 rounded-full text-xs font-semibold">
              Online
            </span>

          </div>

        </div>

        <div className="bg-card border border-border rounded-2xl p-5">

          <div className="flex items-center justify-between">

            <div>
              <h2 className="text-lg font-semibold text-text">
                Sleman Branch
              </h2>

              <p className="text-text-secondary text-sm mt-1">
                Last Sync: 4 seconds ago
              </p>
            </div>

            <span className="bg-success/10 text-success px-3 py-1 rounded-full text-xs font-semibold">
              Online
            </span>

          </div>

        </div>

      </div>

      {/* BRANCH SUMMARY */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-8">

        {/* DEPOK */}
        <div className="bg-card border border-border rounded-2xl p-6">

          <div className="flex items-center justify-between">

            <div>
              <h2 className="text-xl font-semibold text-text">
                Depok Branch
              </h2>

              <p className="text-text-secondary text-sm mt-1">
                Daily sales overview
              </p>
            </div>

            <span className="bg-success/10 text-success px-3 py-1 rounded-full text-xs font-semibold">
              Safe
            </span>

          </div>

          <div className="grid grid-cols-2 gap-5 mt-6">

            <div>
              <p className="text-text-secondary text-sm">
                Revenue
              </p>

              <h3 className="text-2xl font-bold text-text mt-1">
                Rp 12.4M
              </h3>
            </div>

            <div>
              <p className="text-text-secondary text-sm">
                Transactions
              </p>

              <h3 className="text-2xl font-bold text-text mt-1">
                542
              </h3>
            </div>

            <div>
              <p className="text-text-secondary text-sm">
                Cash Total
              </p>

              <h3 className="text-xl font-semibold text-text mt-1">
                Rp 5.1M
              </h3>
            </div>

            <div>
              <p className="text-text-secondary text-sm">
                Cash Difference
              </p>

              <h3 className="text-success font-semibold mt-1">
                No Difference
              </h3>
            </div>

          </div>

        </div>

        {/* SLEMAN */}
        <div className="bg-card border border-border rounded-2xl p-6">

          <div className="flex items-center justify-between">

            <div>
              <h2 className="text-xl font-semibold text-text">
                Sleman Branch
              </h2>

              <p className="text-text-secondary text-sm mt-1">
                Daily sales overview
              </p>
            </div>

            <span className="bg-danger/10 text-danger px-3 py-1 rounded-full text-xs font-semibold">
              Warning
            </span>

          </div>

          <div className="grid grid-cols-2 gap-5 mt-6">

            <div>
              <p className="text-text-secondary text-sm">
                Revenue
              </p>

              <h3 className="text-2xl font-bold text-text mt-1">
                Rp 10.7M
              </h3>
            </div>

            <div>
              <p className="text-text-secondary text-sm">
                Transactions
              </p>

              <h3 className="text-2xl font-bold text-text mt-1">
                476
              </h3>
            </div>

            <div>
              <p className="text-text-secondary text-sm">
                Cash Total
              </p>

              <h3 className="text-xl font-semibold text-text mt-1">
                Rp 4.3M
              </h3>
            </div>

            <div>
              <p className="text-text-secondary text-sm">
                Cash Difference
              </p>

              <h3 className="text-danger font-semibold mt-1">
                Rp 20.000
              </h3>
            </div>

          </div>

        </div>

      </div>

      {/* SALES COMPARISON */}
      <div className="bg-card border border-border rounded-2xl p-6 mt-8">

        <div className="flex items-center justify-between">

          <div>
            <h2 className="text-xl font-semibold text-text">
              Sales Comparison
            </h2>

            <p className="text-text-secondary text-sm mt-1">
              Compare branch sales performance
            </p>
          </div>

          <select className="border border-border rounded-xl px-4 py-2 bg-background text-text outline-none">
            <option>Daily</option>
            <option>Monthly</option>
          </select>

        </div>

        <div className="h-[320px] flex items-center justify-center text-text-secondary">
          Chart Coming Soon...
        </div>

      </div>

      {/* REALTIME TRANSACTIONS */}
      <div className="bg-card border border-border rounded-2xl p-6 mt-8">

        <div className="flex items-center justify-between mb-6">

          <div>
            <h2 className="text-xl font-semibold text-text">
              Realtime Transactions
            </h2>

            <p className="text-text-secondary text-sm mt-1">
              Monitor transactions from all branches
            </p>
          </div>

          <select className="border border-border rounded-xl px-4 py-2 bg-background text-text outline-none">
            <option>All Branches</option>
            <option>Depok Branch</option>
            <option>Sleman Branch</option>
          </select>

        </div>

        <div className="overflow-x-auto">

          <table className="w-full">

            <thead>
              <tr className="border-b border-border text-text-secondary text-sm">
                <th className="text-left py-4">Invoice</th>
                <th className="text-left">Branch</th>
                <th className="text-left">Payment</th>
                <th className="text-left">Total</th>
                <th className="text-left">Status</th>
              </tr>
            </thead>

            <tbody>

              <tr className="border-b border-border">
                <td className="py-4 text-text">
                  INV-24001
                </td>

                <td className="text-text">
                  Depok Branch
                </td>

                <td className="text-text-secondary">
                  QRIS
                </td>

                <td className="text-text font-medium">
                  Rp 250.000
                </td>

                <td>
                  <span className="bg-success/10 text-success px-3 py-1 rounded-full text-xs font-medium">
                    Success
                  </span>
                </td>
              </tr>

              <tr className="border-b border-border">
                <td className="py-4 text-text">
                  INV-24002
                </td>

                <td className="text-text">
                  Sleman Branch
                </td>

                <td className="text-text-secondary">
                  Cash
                </td>

                <td className="text-text font-medium">
                  Rp 180.000
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

export default Branches;