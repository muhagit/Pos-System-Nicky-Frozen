import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Dummy data — ganti dengan data dari API
const defaultData = [
  { metode: "Cash", jumlah: 4200000 },
  { metode: "QRIS", jumlah: 3100000 },
  { metode: "GoPay", jumlah: 1900000 },
];

const formatRupiah = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);

/**
 * CategoryChart — Breakdown metode pembayaran
 * Props:
 * - data : array — override dummy data dari API (opsional)
 */
const CategoryChart = ({ data = defaultData }) => {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
      {/* HEADER */}
      <div className="mb-4">
        <h2 className="font-semibold text-text text-sm">Metode Pembayaran</h2>
        <p className="text-xs text-text-secondary mt-0.5">
          Breakdown hari ini (Cash, QRIS, GoPay)
        </p>
      </div>

      {/* CHART */}
      <ResponsiveContainer width="100%" height={210}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#e5e7eb"
            horizontal={false}
          />
          <XAxis
            type="number"
            tick={{ fontSize: 10, fill: "#6b7280", fontFamily: "Poppins" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v / 1000000}jt`}
          />
          <YAxis
            type="category"
            dataKey="metode"
            tick={{ fontSize: 11, fill: "#6b7280", fontFamily: "Poppins" }}
            axisLine={false}
            tickLine={false}
            width={45}
          />
          <Tooltip
            formatter={(v) => [formatRupiah(v), "Total"]}
            contentStyle={{
              fontSize: "11px",
              borderRadius: "12px",
              fontFamily: "Poppins",
              border: "1px solid #e5e7eb",
            }}
          />
          <Bar
            dataKey="jumlah"
            name="Total"
            fill="#22d3ee"
            radius={[0, 6, 6, 0]}
          />
        </BarChart>
      </ResponsiveContainer>

      {/* LEGEND MANUAL */}
      <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-border">
        {data.map((item, i) => {
          const total = data.reduce((acc, d) => acc + d.jumlah, 0);
          const persen = ((item.jumlah / total) * 100).toFixed(1);
          return (
            <div key={i} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-text-secondary">{item.metode}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-text-secondary">{persen}%</span>
                <span className="font-semibold text-text">
                  {formatRupiah(item.jumlah)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryChart;
