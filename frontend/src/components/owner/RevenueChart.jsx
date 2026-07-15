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
  { hari: "Sen", "Cabang Solo": 1200000, "Cabang Jogja": 980000 },
  { hari: "Sel", "Cabang Solo": 1450000, "Cabang Jogja": 1100000 },
  { hari: "Rab", "Cabang Solo": 1100000, "Cabang Jogja": 1300000 },
  { hari: "Kam", "Cabang Solo": 1600000, "Cabang Jogja": 1250000 },
  { hari: "Jum", "Cabang Solo": 1800000, "Cabang Jogja": 1500000 },
  { hari: "Sab", "Cabang Solo": 2100000, "Cabang Jogja": 1900000 },
  { hari: "Min", "Cabang Solo": 1950000, "Cabang Jogja": 1700000 },
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
  // Ambil nama cabang secara dinamis dari keys data (kecuali key "hari")
  const branchKeys = data.length > 0 
    ? Object.keys(data[0]).filter(key => key !== 'hari')
    : [];

  const colors = ["#22d3ee", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#3b82f6"];

  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
      {/* HEADER */}
      <div className="mb-4">
        <h2 className="font-semibold text-text text-sm">Penjualan Mingguan</h2>
        <p className="text-xs text-text-secondary mt-0.5">
          {branchKeys.length > 1 
            ? `Perbandingan Penjualan Antar Cabang` 
            : branchKeys.length === 1 
              ? `Penjualan ${branchKeys[0]}` 
              : "Data Penjualan Cabang"}
        </p>
      </div>

      {/* CHART */}
      <ResponsiveContainer width="100%" height={210}>
        <AreaChart data={data}>
          <defs>
            {branchKeys.map((key, index) => {
              const color = colors[index % colors.length];
              return (
                <linearGradient key={key} id={`grad_${key.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              );
            })}
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

          {branchKeys.map((key, index) => {
            const color = colors[index % colors.length];
            return (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                name={key}
                stroke={color}
                strokeWidth={2}
                fill={`url(#grad_${key.replace(/\s+/g, '')})`}
              />
            );
          })}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RevenueChart;
