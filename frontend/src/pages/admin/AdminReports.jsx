import React from "react";
import {
    FiBarChart2,
    FiTrendingUp,
    FiPieChart,
    FiDownload,
    FiLock,
} from "react-icons/fi";

const AdminReports = () => {
    return (
        <div className="h-full flex flex-col bg-background font-poppins px-6 py-4 overflow-hidden">
            {/* Header Section */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm mb-4 flex-shrink-0 flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">
                        Reports & Analytics
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">
                        View comprehensive sales and inventory reports
                    </p>
                </div>
                <button
                    disabled
                    className="bg-gray-100 text-gray-400 px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 cursor-not-allowed border-none"
                >
                    <FiDownload size={20} /> Export Report
                </button>
            </div>

            {/* Coming Soon Content */}
            <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
                {/* Background Dekoratif (Samar-samar) */}
                <div className="absolute top-10 left-10 text-gray-50 opacity-50 pointer-events-none">
                    <FiTrendingUp size={200} />
                </div>
                <div className="absolute -bottom-10 -right-10 text-gray-50 opacity-50 pointer-events-none">
                    <FiPieChart size={250} />
                </div>

                {/* Animated Icon Container */}
                <div className="relative mb-8 z-10">
                    <div className="w-32 h-32 bg-cyan-50 rounded-full flex items-center justify-center shadow-inner">
                        {/* Ikon grafik dengan animasi membesar-mengecil halus */}
                        <FiBarChart2
                            size={56}
                            className="text-primary animate-pulse"
                            style={{ animationDuration: "2s" }}
                        />
                    </div>
                    {/* Aksen Gembok untuk menandakan fitur masih terkunci/dibangun */}
                    <div className="absolute -bottom-2 -right-2 bg-white text-amber-500 p-2.5 rounded-full shadow-md border border-gray-100">
                        <FiLock size={20} />
                    </div>
                </div>

                <h3 className="text-3xl font-bold text-gray-800 mb-3 z-10">
                    Laporan & Analitik
                </h3>
                <div className="w-16 h-1.5 bg-primary rounded-full mb-6 z-10"></div>

                <p className="text-gray-500 max-w-md text-center leading-relaxed mb-8 z-10">
                    Modul{" "}
                    <span className="font-semibold text-gray-700">
                        Laporan Komprehensif
                    </span>{" "}
                    sedang dirakit. Nantinya, Anda bisa melihat grafik penjualan
                    bulanan, menganalisis produk terlaris, dan mengekspor data
                    mutasi stok langsung ke PDF atau Excel.
                </p>

                <div className="flex items-center gap-2 text-sm font-medium text-amber-600 bg-amber-50 px-6 py-3 rounded-xl border border-amber-100 cursor-not-allowed z-10">
                    <span className="relative flex h-3 w-3 mr-1">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                    </span>
                    Fitur Segera Dibuka Pada Pembaruan Berikutnya
                </div>
            </div>
        </div>
    );
};

export default AdminReports;
