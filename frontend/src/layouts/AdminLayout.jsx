import { Outlet, useNavigate, useLocation } from "react-router-dom";

import {
    FiGrid,
    FiPackage,
    FiActivity,
    FiAlertTriangle,
    FiUsers,
    FiRefreshCw,
    FiFileText,
    FiLogOut,
    FiTag,
} from "react-icons/fi";

const AdminLayout = () => {
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
            <div className="w-[280px] bg-sidebar text-white flex flex-col justify-between p-5">
                <div>
                    {/* LOGO */}
                    <div>
                        <h1 className="text-3xl font-bold">Nicky Frozen</h1>
                        {userInfo?.cabang && (
                            <p className="text-sm text-gray-300 mt-0.5 font-medium">{userInfo.cabang}</p>
                        )}
                        <p className="text-primary mt-1">Admin</p>
                    </div>

                    {/* PROFILE */}
                    <div className="bg-sidebar-light rounded-2xl p-5 flex items-center gap-4 mt-8">
                        <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center font-bold text-xl">
                            {userInfo?.nama_lengkap?.charAt(0) || "A"}
                        </div>

                        <div>
                            <h3 className="font-semibold">
                                {userInfo?.nama_lengkap || "Admin User"}
                            </h3>
                            <p className="text-sm text-gray-300">
                                {userInfo?.role || "Admin"}
                            </p>
                        </div>
                    </div>

                    {/* MENU */}
                    <div className="flex flex-col gap-4 mt-10 overflow-y-auto max-h-[55vh] pr-2 scrollbar-hide">
                        <button
                            onClick={() => navigate("/admin")}
                            className={`p-4 rounded-2xl text-left font-medium flex items-center gap-3 transition ${location.pathname === "/admin"
                                    ? "bg-primary"
                                    : "hover:bg-sidebar-light"
                                }`}
                        >
                            <FiGrid size={20} />
                            Dashboard
                        </button>

                        <button
                            onClick={() => navigate("/admin/products")}
                            className={`p-4 rounded-2xl text-left font-medium flex items-center gap-3 transition ${location.pathname === "/admin/products"
                                    ? "bg-primary"
                                    : "hover:bg-sidebar-light"
                                }`}
                        >
                            <FiPackage size={20} />
                            Products
                        </button>

                        <button
                            onClick={() => navigate("/admin/categories")}
                            className={`p-4 rounded-2xl text-left font-medium flex items-center gap-3 transition ${location.pathname === "/admin/categories"
                                    ? "bg-primary"
                                    : "hover:bg-sidebar-light"
                                }`}
                        >
                            <FiTag size={20} />
                            Categories
                        </button>

                        <button
                            onClick={() => navigate("/admin/stock")}
                            className={`p-4 rounded-2xl text-left font-medium flex items-center gap-3 transition ${location.pathname === "/admin/stock"
                                    ? "bg-primary"
                                    : "hover:bg-sidebar-light"
                                }`}
                        >
                            <FiActivity size={20} />
                            Stock Management
                        </button>

                        <button
                            onClick={() => navigate("/admin/expired")}
                            className={`p-4 rounded-2xl text-left font-medium flex items-center gap-3 transition ${location.pathname === "/admin/expired"
                                    ? "bg-primary"
                                    : "hover:bg-sidebar-light"
                                }`}
                        >
                            <FiAlertTriangle size={20} />
                            Expired Monitoring
                        </button>

                        <button
                            onClick={() => navigate("/admin/branch-sync")}
                            className={`p-4 rounded-2xl text-left font-medium flex items-center gap-3 transition ${location.pathname === "/admin/branch-sync"
                                    ? "bg-primary"
                                    : "hover:bg-sidebar-light"
                                }`}
                        >
                            <FiRefreshCw size={20} />
                            Branch Sync
                        </button>

                        <button
                            onClick={() => navigate("/admin/reports")}
                            className={`p-4 rounded-2xl text-left font-medium flex items-center gap-3 transition ${location.pathname === "/admin/reports"
                                    ? "bg-primary"
                                    : "hover:bg-sidebar-light"
                                }`}
                        >
                            <FiFileText size={20} />
                            Reports
                        </button>


                    </div>
                </div>

                {/* LOGOUT */}
                <button
                    onClick={handleLogout}
                    className="bg-sidebar-light p-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-red-500 transition mt-4"
                >
                    <FiLogOut size={20} />
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

export default AdminLayout;
