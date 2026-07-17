import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, allowedRoles }) => {
    const userInfoString = localStorage.getItem("userInfo");

    if (!userInfoString) {
        // Belum login, arahkan ke login
        return <Navigate to="/" replace />;
    }

    try {
        const userInfo = JSON.parse(userInfoString);

        if (!userInfo || !userInfo.token) {
            // Token tidak valid atau kosong
            localStorage.removeItem("userInfo");
            return <Navigate to="/" replace />;
        }

        if (allowedRoles && !allowedRoles.includes(userInfo.role)) {
            // Role tidak sesuai, arahkan ke portal role masing-masing
            if (userInfo.role === "Owner") {
                return <Navigate to="/owner" replace />;
            } else if (userInfo.role === "Admin") {
                return <Navigate to="/admin" replace />;
            } else if (userInfo.role === "Kasir") {
                return <Navigate to="/kasir" replace />;
            } else {
                localStorage.removeItem("userInfo");
                return <Navigate to="/" replace />;
            }
        }

        return children;
    } catch (e) {
        // JSON parse error (data local storage korup)
        localStorage.removeItem("userInfo");
        return <Navigate to="/" replace />;
    }
};

export default ProtectedRoute;
