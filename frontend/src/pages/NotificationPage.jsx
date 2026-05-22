import {
  FiBell,
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
  FiPackage,
} from "react-icons/fi";

const NotificationPage = () => {
  const notifications = [
    {
      type: "expired",
      title: "Product Expiration Warning",
      message: "Frozen Chicken Nugget will expire in 3 days.",
      time: "1 hour ago",
    },
    {
      type: "expired",
      title: "Expired Product Alert",
      message: "Frozen Beef Sausage has expired.",
      time: "2 hours ago",
    },
    {
      type: "warning",
      title: "Low Stock Alert",
      message: "Frozen Nugget stock is running low.",
      time: "5 minutes ago",
    },
    {
      type: "success",
      title: "Transaction Success",
      message: "Invoice INV-001 completed successfully.",
      time: "10 minutes ago",
    },
    {
      type: "hold",
      title: "Transaction Hold",
      message: "Transaction HOLD-001 has been saved.",
      time: "20 minutes ago",
    },
    {
      type: "warning",
      title: "Low Stock Alert",
      message: "Frozen Sausage stock is almost empty.",
      time: "30 minutes ago",
    },
  ];

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
        {notifications.map((notif, index) => (
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
                  {notif.time}
                </span>
              </div>

              <p className="text-text-secondary mt-2">{notif.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationPage;
