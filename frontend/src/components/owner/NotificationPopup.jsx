import React, { useEffect } from "react";
import {
  FiBell,
  FiClock,
  FiPackage,
  FiAlertTriangle,
  FiX,
} from "react-icons/fi";

const notifStyle = {
  expired: {
    title: "Produk Expired",
    icon: FiClock,
    bg: "bg-amber-50",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    badge: "bg-amber-100 text-amber-700",
  },

  stok: {
    title: "Stok Menipis",
    icon: FiPackage,
    bg: "bg-blue-50",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    badge: "bg-blue-100 text-blue-700",
  },

  selisih: {
    title: "Selisih Kas",
    icon: FiAlertTriangle,
    bg: "bg-red-50",
    iconBg: "bg-red-100",
    iconColor: "text-red-600",
    badge: "bg-red-100 text-red-700",
  },
};

const NotificationPopup = ({
  open,
  onClose,
  notifications = [],
}) => {

  useEffect(() => {

    if (!open) return;

    const esc = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";

    window.addEventListener("keydown", esc);

    return () => {
      document.body.style.overflow = "auto";
      window.removeEventListener("keydown", esc);
    };

  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      {/* BACKDROP */}

      <div
        onClick={onClose}
        className="
          fixed
          inset-0
          bg-black/25
          backdrop-blur-md
          z-40
          transition-all
          duration-300
        "
      />

      {/* MODAL */}

      <div className="fixed inset-0 z-50 flex items-center justify-center p-6">

        <div
          className="
            w-full
            max-w-[640px]
            max-h-[720px]
            bg-white
            rounded-[34px]
            shadow-[0_30px_100px_rgba(0,0,0,.25)]
            overflow-hidden
            border
            border-gray-200
            animate-in
            fade-in
            zoom-in-95
            duration-300
          "
        >

          {/* HEADER */}

          <div className="px-8 py-7 border-b border-gray-100 flex justify-between items-start">

            <div className="flex gap-5">

              <div className="w-16 h-16 rounded-3xl bg-sky-100 flex items-center justify-center">

                <FiBell
                  size={28}
                  className="text-sky-600"
                />

              </div>

              <div>

                <h2 className="text-3xl font-bold text-gray-800">
                  Notifications
                </h2>

                <p className="text-gray-500 mt-1">
                  {notifications.length} alerts require your attention
                </p>

              </div>

            </div>

            <button
              onClick={onClose}
              className="
                w-11
                h-11
                rounded-xl
                hover:bg-gray-100
                flex
                items-center
                justify-center
                transition
              "
            >
              <FiX size={24} />
            </button>

          </div>

          {/* BODY */}

          <div className="p-6 overflow-y-auto max-h-[560px] space-y-5">

            {notifications.length === 0 ? (

              <div className="flex flex-col items-center justify-center py-20">

                <FiBell
                  size={55}
                  className="text-gray-300"
                />

                <h3 className="font-semibold text-lg mt-5">
                  Tidak ada notifikasi
                </h3>

                <p className="text-gray-400 text-sm mt-2">
                  Semua sistem berjalan normal.
                </p>

              </div>

            ) : (

              notifications.map((notif) => {

                const style =
                  notifStyle[notif.tipe] ||
                  notifStyle.stok;

                const Icon = style.icon;

                return (

                  <div
                    key={notif._id}
                    className={`
                      ${style.bg}
                      rounded-2xl
                      p-4
                      flex
                      gap-5
                      border
                      border-gray-100
                      hover:shadow-lg
                      transition
                    `}
                  >

                    <div
                      className={`
                        w-12
                        h-12
                        rounded-2xl
                        flex
                        items-center
                        justify-center
                        ${style.iconBg}
                      `}
                    >

                      <Icon
                        size={22}
                        className={style.iconColor}
                      />

                    </div>

                    <div className="flex-1">
                    <div className="flex items-center justify-between">

                        <span
                          className={`
                            px-3
                            py-1
                            rounded-full
                            text-xs
                            font-semibold
                            ${style.badge}
                          `}
                        >
                          {style.title}
                        </span>

                        <span className="text-xs text-gray-400">
                          {notif.createdAt
                            ? new Date(notif.createdAt).toLocaleTimeString(
                                "id-ID",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )
                            : ""}
                        </span>

                      </div>

                      <h3 className="font-semibold text-gray-800 text-lg mt-2">
                        {notif.cabang}
                      </h3>

                      <p className="text-gray-500 text-sm mt-2 leading-5">
                        {notif.pesan}
                      </p>

                      <div className="flex justify-between items-center mt-5">

                        <span className="text-xs text-gray-400">

                          {notif.createdAt
                            ? new Date(notif.createdAt).toLocaleDateString(
                                "id-ID",
                                {
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric",
                                }
                              )
                            : ""}

                        </span>



                      </div>

                    </div>

                  </div>

                );

              })

            )}

          </div>

          {/* FOOTER */}

          <div className="border-t border-gray-100 p-5 bg-gray-50">

            <button
              onClick={onClose}
              className="
                w-full
                py-3
                rounded-2xl
                bg-sky-500
                hover:bg-sky-600
                text-white
                font-semibold
                transition
              "
            >
              Tutup
            </button>

          </div>

        </div>

      </div>

    </>
  );

};

export default NotificationPopup;