import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Dummy data — ganti dengan data dari API
const defaultData = [
  { hari: "Sen", cabangA: 1200000, cabangB: 980000 },
  { hari: "Sel", cabangA: 1450000, cabangB: 1100000 },
  { hari: "Rab", cabangA: 1100000, cabangB: 1300000 },
  { hari: "Kam", cabangA: 1600000, cabangB: 1250000 },
  { hari: "Jum", cabangA: 1800000, cabangB: 1500000 },
  { hari: "Sab", cabangA: 2100000, cabangB: 1900000 },
  { hari: "Min", cabangA: 1950000, cabangB: 1700000 },
];

const formatRupiah = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-border rounded-xl p-3 shadow-lg text-xs font-poppins">
        <p className="font-semibold text-text mb-2">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="mb-0.5" style={{ color: p.color }}>
            {p.name}: {formatRupiah(p.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

/**
 * RevenueChart
 * Props:
 * - data : array — override dummy data dari API (opsional)
 */
const RevenueChart = ({ data = defaultData }) => {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
      {/* HEADER */}
      <div className="mb-4">
        <h2 className="font-semibold text-text text-sm">Penjualan Mingguan</h2>
        <p className="text-xs text-text-secondary mt-0.5">
          Perbandingan Cabang Solo vs Cabang Jogja
        </p>
      </div>

      {/* CHART */}
      <ResponsiveContainer width="100%" height={210}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="gradCabangA" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradCabangB" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

          <XAxis
            dataKey="hari"
            tick={{ fontSize: 11, fill: "#6b7280", fontFamily: "Poppins" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#6b7280", fontFamily: "Poppins" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v / 1000000}jt`}
          />

          <Tooltip content={<CustomTooltip />} />

          <Legend
            iconType="circle"
            iconSize={7}
            wrapperStyle={{
              fontSize: "11px",
              paddingTop: "12px",
              fontFamily: "Poppins",
            }}
          />

          <Area
            type="monotone"
            dataKey="cabangA"
            name="Cabang Solo"
            stroke="#22d3ee"
            strokeWidth={2}
            fill="url(#gradCabangA)"
          />
          <Area
            type="monotone"
            dataKey="cabangB"
            name="Cabang Jogja"
            stroke="#10b981"
            strokeWidth={2}
            fill="url(#gradCabangB)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RevenueChart;
