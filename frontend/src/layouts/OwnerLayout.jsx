import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../utils/api";

import {
  FiHome,
  FiBarChart2,
  FiGitBranch,
  FiBell,
  FiBook,
  FiUsers,
  FiLogOut,
  FiFileText,
} from "react-icons/fi";

const OwnerLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const userInfo = JSON.parse(localStorage.getItem("userInfo"));

  const handleLogout = () => {
    localStorage.removeItem("userInfo");
    navigate("/");
  };

  const [unreadNotif, setUnreadNotif] = useState(0);
  const fetchNotifications = async () => {
  try {
    const res = await api.get("/transactions/notifications");

    const unread = res.data.filter((item) => !item.isRead).length;

    setUnreadNotif(unread);
  } catch (error) {
    console.error("Gagal mengambil notifikasi", error);
  }
};
useEffect(() => {
  fetchNotifications();

  const interval = setInterval(() => {
    fetchNotifications();
  }, 10000);

  return () => clearInterval(interval);
}, []);

  const menus = [
    {
      name: "Dashboard",
      path: "/owner",
      icon: <FiHome size={18} />,
    },
    {
      name: "Reports",
      path: "/owner/reports",
      icon: <FiFileText size={18} />,
    },
    {
      name: "Analytics",
      path: "/owner/analytics",
      icon: <FiBarChart2 size={18} />,
    },
    {
      name: "Branches",
      path: "/owner/branches",
      icon: <FiGitBranch size={18} />,
    },
    {
      name: "Users",
      path: "/owner/users",
      icon: <FiUsers size={18} />,
    },
  ];

  return (
    <div className="flex h-screen font-poppins bg-background">

      {/* SIDEBAR */}
      <div className="w-[260px] bg-sidebar text-white flex flex-col justify-between py-6 px-4 flex-shrink-0">

        <div>

          {/* LOGO */}
          <div className="px-2">
            <h1 className="text-2xl font-bold tracking-tight">
              Nicky Frozen
            </h1>

            <p className="text-primary text-sm mt-1">
              Owner Panel
            </p>
          </div>

          {/* PROFILE */}
          <div className="bg-sidebar-light rounded-2xl p-4 flex items-center gap-3 mt-6">

            <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center font-bold text-lg text-sidebar shrink-0">
              {userInfo?.nama_lengkap
                ? userInfo.nama_lengkap.charAt(0).toUpperCase()
                : "O"}
            </div>

            <div className="overflow-hidden">
              <p className="font-semibold text-sm text-white truncate">
                {userInfo?.nama_lengkap ?? "Owner"}
              </p>

              <p className="text-xs text-primary capitalize">
                {userInfo?.role ?? "owner"} ({userInfo?.cabang ?? "Pusat"})
              </p>
            </div>

          </div>

          {/* MENU */}
          <div className="mt-8 flex flex-col gap-2">

            {menus.map((menu, index) => {
              const isActive = location.pathname === menu.path;

              return (
                <button
                  key={index}
                  onClick={() => navigate(menu.path)}
                  className={`w-full px-4 py-3 rounded-2xl text-left text-sm font-medium flex items-center gap-3 transition-all duration-200 ${
                    isActive
                      ? "bg-primary text-sidebar font-semibold"
                      : "text-white/70 hover:bg-sidebar-light hover:text-white"
                  }`}
                >
                  {menu.icon}

                  <span className="flex-1">
                    {menu.name}
                  </span>

                  {menu.badge > 0 && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isActive
                          ? "bg-sidebar text-primary"
                          : "bg-danger text-white"
                      }`}
                    >
                      {menu.badge}
                    </span>
                  )}
                </button>
              );
            })}

          </div>

        </div>

        {/* LOGOUT */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium text-white/70 hover:bg-danger hover:text-white transition-all duration-200"
        >
          <FiLogOut size={18} />
          Logout
        </button>

      </div>

      {/* CONTENT */}
      <main className="flex-1 h-screen overflow-y-auto bg-background">
        <Outlet />
      </main>

    </div>
  );
};

export default OwnerLayout;