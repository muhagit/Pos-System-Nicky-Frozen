import { useState } from "react";
import {
  FiAlertTriangle,
  FiDollarSign,
  FiPackage,
  FiCheckCircle,
} from "react-icons/fi";

const Notifications = () => {
  // ======================
  // DUMMY DATA
  // ======================
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: "expired",
      title: "Produk Ayam Crispy",
      description: "Mendekati expired H-3",
      branch: "Cabang A",
      isRead: false,
      time: "10:30",
    },
    {
      id: 2,
      type: "cash_difference",
      title: "Selisih Kas Terdeteksi",
      description: "Terdapat selisih Rp 50.000",
      branch: "Cabang B",
      isRead: false,
      time: "09:10",
    },
    {
      id: 3,
      type: "low_stock",
      title: "Stok Menipis: Nugget",
      description: "Sisa stok hanya 5 pcs",
      branch: "Cabang A",
      isRead: true,
      time: "Kemarin",
    },
  ]);

  const [filter, setFilter] = useState("all");

  // ======================
  // FILTER
  // ======================
  const filtered = notifications.filter((n) => {
    if (filter === "all") return true;
    return n.type === filter;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // ======================
  // MARK ALL READ
  // ======================
  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  // ======================
  // STYLE MAPPING
  // ======================
  const getIconStyle = (type) => {
    switch (type) {
      case "expired":
        return "bg-danger/10 text-danger";
      case "cash_difference":
        return "bg-warning/10 text-warning";
      case "low_stock":
        return "bg-primary/10 text-primary";
      default:
        return "bg-text-secondary/10 text-text-secondary";
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case "expired":
        return <FiAlertTriangle />;
      case "cash_difference":
        return <FiDollarSign />;
      case "low_stock":
        return <FiPackage />;
      default:
        return <FiCheckCircle />;
    }
  };

  const tabs = [
    { key: "all", label: "Semua" },
    { key: "cash_difference", label: "Selisih Kas" },
    { key: "expired", label: "Produk Expired" },
    { key: "low_stock", label: "Stok Menipis" },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* ======================
          HEADER
      ====================== */}
      <div className="bg-card border border-border rounded-2xl p-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Notifications</h1>

          <p className="text-text-secondary mt-1">
            {unreadCount} unread notifications
          </p>
        </div>

        <button
          onClick={markAllRead}
          className="bg-primary text-sidebar px-4 py-2 rounded-xl font-semibold hover:bg-primary-dark transition-all"
        >
          Mark All as Read
        </button>
      </div>

      {/* ======================
          FILTER TABS
      ====================== */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
              filter === tab.key
                ? "bg-primary text-sidebar border-primary"
                : "bg-card text-text border-border hover:bg-background"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ======================
          LIST
      ====================== */}
      <div className="space-y-3">
        {filtered.map((item) => (
          <div
            key={item.id}
            className={`bg-card border border-border rounded-2xl p-4 flex items-start gap-4 transition-all ${
              item.isRead ? "opacity-80" : "shadow-sm"
            }`}
          >
            {/* ICON */}
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${getIconStyle(
                item.type,
              )}`}
            >
              {getIcon(item.type)}
            </div>

            {/* CONTENT */}
            <div className="flex-1">
              <h3 className="text-text font-semibold">{item.title}</h3>

              <p className="text-sm text-text-secondary mt-1">
                {item.description}
              </p>

              <div className="flex gap-4 text-xs text-text-secondary mt-2">
                <span>{item.branch}</span>
                <span>{item.time}</span>
              </div>
            </div>

            {/* UNREAD DOT */}
            {!item.isRead && (
              <div className="w-2.5 h-2.5 rounded-full bg-danger mt-2" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Notifications;
