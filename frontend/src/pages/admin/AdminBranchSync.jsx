import React from "react";
import { FiRefreshCw, FiClock, FiSettings } from "react-icons/fi";

const AdminBranchSync = () => {
    return (
        <div className="h-full flex flex-col bg-background font-poppins px-6 py-4 overflow-hidden">
            {/* Header Section */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm mb-4 flex-shrink-0">
                <h2 className="text-2xl font-bold text-gray-800">
                    Branch Synchronization
                </h2>
                <p className="text-gray-500 text-sm mt-1">
                    Sync inventory and data across multiple branches
                </p>
            </div>

            {/* Coming Soon Content */}
            <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center p-8 text-center">
                {/* Animated Icon Container */}
                <div className="relative mb-8">
                    {/* Lingkaran luar yang berputar */}
                    <div
                        className="w-32 h-32 bg-cyan-50 rounded-full flex items-center justify-center animate-spin"
                        style={{ animationDuration: "4s" }}
                    >
                        <FiRefreshCw
                            size={56}
                            className="text-primary opacity-30"
                        />
                    </div>
                    {/* Lingkaran dalam statis */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white w-20 h-20 rounded-full shadow-lg flex items-center justify-center border-4 border-cyan-50 z-10">
                        <FiClock size={32} className="text-primary" />
                    </div>
                    {/* Aksen tambahan */}
                    <div className="absolute -top-2 -right-2 bg-amber-100 text-amber-600 p-2 rounded-full shadow-sm animate-bounce">
                        <FiSettings size={16} />
                    </div>
                </div>

                <h3 className="text-3xl font-bold text-gray-800 mb-3">
                    Coming Soon!
                </h3>
                <div className="w-16 h-1.5 bg-primary rounded-full mb-6"></div>

                <p className="text-gray-500 max-w-md text-center leading-relaxed mb-8">
                    Kami sedang membangun infrastruktur untuk fitur{" "}
                    <span className="font-semibold text-gray-700">
                        Branch Sync
                    </span>
                    . Nantinya, Anda dapat memantau pergerakan stok dan
                    mentransfer barang antar cabang secara{" "}
                    <span className="italic">real-time</span> dari satu layar.
                </p>

                <div className="flex items-center gap-2 text-sm font-medium text-gray-400 bg-gray-50 px-6 py-3 rounded-xl border border-gray-100 cursor-not-allowed">
                    <FiSettings
                        className="animate-spin"
                        style={{ animationDuration: "3s" }}
                    />
                    Fitur Sedang Dalam Pengembangan...
                </div>
            </div>
        </div>
    );
};

export default AdminBranchSync;
