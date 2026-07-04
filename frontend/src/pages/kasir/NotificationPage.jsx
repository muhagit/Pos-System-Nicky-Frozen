import {
  FiBell,
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
  FiPackage,
} from "react-icons/fi";

import { useEffect, useState } from "react";
import axios from "axios";

const NotificationPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchNotif = async () => {
      try {
        const userInfo = JSON.parse(localStorage.getItem("userInfo"));
        const config = {
          headers: { Authorization: `Bearer ${userInfo?.token}` },
        };
        const res = await axios.get(
          "http://localhost:5000/api/transactions/notifications",
          config
        );

        setNotifications(res.data);
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotif();
  }, []);

  const getIcon = (type) => {
    if (type === "warning") {
      return (
        <div className="bg-yellow-100 text-yellow-600 p-4 rounded-2xl">
          <FiAlertTriangle size={24} />
        </div>
      );
    }

    if (type === "expired") {
      return (
        <div className="bg-red-100 text-red-600 p-4 rounded-2xl">
          <FiPackage size={24} />
        </div>
      );
    }

    if (type === "success") {
      return (
        <div className="bg-green-100 text-green-600 p-4 rounded-2xl">
          <FiCheckCircle size={24} />
        </div>
      );
    }

    return (
      <div className="bg-blue-100 text-blue-600 p-4 rounded-2xl">
        <FiClock size={24} />
      </div>
    );
  };

  return (
    <div className="p-8 bg-background h-screen overflow-y-auto font-poppins">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-text">Notifications</h1>

          <p className="text-text-secondary mt-2">
            Monitor cashier system activities
          </p>
        </div>

        <div className="bg-primary text-white p-4 rounded-2xl">
          <FiBell size={28} />
        </div>
      </div>

      {/* NOTIFICATION LIST */}
      <div className="space-y-5 mt-8">
        {loading ? (
          <p className="text-center text-text-secondary">
            Loading notifications...
          </p>
        ) : notifications.length === 0 ? (
          <p className="text-center text-text-secondary">No notifications</p>
        ) : (
          notifications.map((notif, index) => (
            <div
              key={index}
              className="bg-white rounded-3xl p-6 flex items-start gap-5 hover:shadow-md transition"
            >
              {/* ICON */}
              {getIcon(notif.type)}

              {/* CONTENT */}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">{notif.title}</h2>

                  <span className="text-sm text-text-secondary">
                    {new Date(notif.time).toLocaleString("id-ID")}
                  </span>
                </div>

                <p className="text-text-secondary mt-2">{notif.message}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationPage;
