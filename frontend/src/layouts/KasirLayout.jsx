import { Outlet, useNavigate, useLocation } from "react-router-dom";

import {
  FiShoppingCart,
  FiClock,
  FiLogOut,
  FiFileText,
} from "react-icons/fi";

const KasirLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const handleLogout = () => {
    localStorage.removeItem("userInfo");

    navigate("/");
  };

  const userInfo = JSON.parse(localStorage.getItem("userInfo"));

  return (
    <div className="flex h-screen bg-background font-poppins">
      {/* SIDEBAR */}
      <div id="tour-sidebar" className="w-[280px] bg-sidebar text-white flex flex-col justify-between p-5">
        <div>
          {/* LOGO */}
          <div>
            <h1 className="text-3xl font-bold">Nicky Frozen</h1>

            <p className="text-primary mt-1">Cashier</p>
          </div>

          {/* PROFILE */}
          <div className="bg-sidebar-light rounded-2xl p-5 flex items-center gap-4 mt-8">
            <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center font-bold text-xl">
              {userInfo?.nama_lengkap?.charAt(0)}
            </div>

            <div>
              <h3 className="font-semibold">{userInfo?.nama_lengkap}</h3>

              <p className="text-sm text-gray-300">{userInfo?.role}</p>
            </div>
          </div>

          {/* MENU */}
          <div className="flex flex-col gap-4 mt-10">
            <button
              onClick={() => navigate("/kasir")}
              className={`p-4 rounded-2xl text-left font-medium flex items-center gap-3 transition ${
                location.pathname === "/kasir"
                  ? "bg-primary"
                  : "hover:bg-sidebar-light"
              }`}
            >
              <FiShoppingCart size={20} />
              POS Transaction
            </button>

            <button
              onClick={() => navigate("/history")}
              className={`p-4 rounded-2xl text-left font-medium flex items-center gap-3 transition ${
                location.pathname === "/history"
                  ? "bg-primary"
                  : "hover:bg-sidebar-light"
              }`}
            >
              <FiClock size={20} />
              History
            </button>

            <button
              onClick={() => navigate("/hold")}
              className={`p-4 rounded-2xl text-left font-medium flex items-center gap-3 transition ${
                location.pathname === "/hold"
                  ? "bg-primary"
                  : "hover:bg-sidebar-light"
              }`}
            >
              <FiShoppingCart size={20} />
              Hold Transactions
            </button>

            <button
              onClick={() => navigate("/report")}
              className={`p-4 rounded-2xl text-left font-medium flex items-center gap-3 transition ${
                location.pathname === "/report"
                  ? "bg-primary"
                  : "hover:bg-sidebar-light"
              }`}
            >
              <FiFileText size={20} />
              Report
            </button>


          </div>
        </div>

        {/* LOGOUT */}
        <button
          onClick={handleLogout}
          className="bg-sidebar-light p-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-red-500 transition"
        >
          Logout
        </button>
      </div>

      {/* PAGE CONTENT */}
      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
};

export default KasirLayout;
