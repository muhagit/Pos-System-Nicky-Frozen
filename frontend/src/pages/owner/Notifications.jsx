import { useEffect, useState } from "react";
import api from "../../utils/api";

import {
  FiAlertTriangle,
  FiDollarSign,
  FiPackage,
  FiCheckCircle,
} from "react-icons/fi";

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  // ======================
  // FETCH DATA
  // ======================
  const fetchNotifications = async () => {
    try {
      setLoading(true);

      const res = await api.get("/transactions/notifications");

      const data = res.data.map((item, index) => ({
        id: index + 1,
        type: item.type,
        title: item.title,
        description: item.message,
        branch: item.branch || "-",
        isRead: item.isRead || false,
        time: item.createdAt
          ? new Date(item.createdAt).toLocaleString("id-ID")
          : "-",
      }));

      setNotifications(data);
    } catch (err) {
      console.error("Error fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  // ======================
  // USE EFFECT (INIT + POLLING)
  // ======================
  useEffect(() => {
    fetchNotifications();

    const interval = setInterval(() => {
      fetchNotifications();
    }, 10000); // refresh tiap 10 detik

    return () => clearInterval(interval);
  }, []);

  // ======================
  // FILTER
  // ======================
  const filtered = notifications.filter((n) => {
    if (filter === "all") return true;
    return n.type === filter;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // ======================
  // MARK ALL READ (frontend only)
  // ======================
  const markAllRead = () => {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, isRead: true }))
    );
  };

  // ======================
  // ICON STYLE
  // ======================
  const getIconStyle = (type) => {
    switch (type) {
      case "expired":
        return "bg-red-500/10 text-red-500";

      case "cash":
        return "bg-yellow-500/10 text-yellow-500";

      case "stock":
        return "bg-blue-500/10 text-blue-500";

      default:
        return "bg-gray-500/10 text-gray-500";
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case "expired":
        return <FiAlertTriangle />;

      case "cash":
        return <FiDollarSign />;

      case "stock":
        return <FiPackage />;

      default:
        return <FiCheckCircle />;
    }
  };

  const tabs = [
    { key: "all", label: "Semua" },
    { key: "cash", label: "Selisih Kas" },
    { key: "expired", label: "Produk Expired" },
    { key: "stock", label: "Stok Menipis" },
  ];

  // ======================
  // LOADING
  // ======================
  if (loading) {
    return (
      <div className="p-6 text-text-secondary">
        Loading notifications...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">

      {/* HEADER */}
      <div className="bg-card border border-border rounded-2xl p-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Notifications</h1>
          <p className="text-text-secondary mt-1">
            {unreadCount} unread notifications
          </p>
        </div>

        <button
          onClick={markAllRead}
          className="bg-primary text-white px-4 py-2 rounded-xl font-semibold"
        >
          Mark All as Read
        </button>
      </div>

      {/* FILTER */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-xl text-sm border ${
              filter === tab.key
                ? "bg-primary text-white border-primary"
                : "bg-card text-text border-border"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* LIST */}
      <div className="space-y-3">

        {filtered.length === 0 ? (
          <div className="bg-card p-6 rounded-xl text-center text-text-secondary">
            Tidak ada notifikasi
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className={`bg-card border border-border rounded-2xl p-4 flex gap-4 ${
                item.isRead ? "opacity-60" : ""
              }`}
            >

              {/* ICON */}
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${getIconStyle(
                  item.type
                )}`}
              >
                {getIcon(item.type)}
              </div>

              {/* CONTENT */}
              <div className="flex-1">
                <h3 className="text-text font-semibold">
                  {item.title}
                </h3>

                <p className="text-sm text-text-secondary mt-1">
                  {item.description}
                </p>

                <div className="flex gap-4 text-xs text-text-secondary mt-2">
                  <span>{item.branch}</span>
                  <span>{item.time}</span>
                </div>
              </div>

              {/* DOT */}
              {!item.isRead && (
                <div className="w-2 h-2 rounded-full bg-red-500 mt-2" />
              )}

            </div>
          ))
        )}

      </div>
    </div>
  );
};

export default Notifications;