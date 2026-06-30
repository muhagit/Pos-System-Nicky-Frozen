import midtransClient from "midtrans-client";

// Setup Snap API Midtrans
const snap = new midtransClient.Snap({
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true",
    serverKey: process.env.MIDTRANS_SERVER_KEY,
    clientKey: process.env.MIDTRANS_CLIENT_KEY,
});

export const createTransaction = async (req, res) => {
    try {
        const { order_id, gross_amount, customer_name, email } = req.body;

        if (!gross_amount || !customer_name) {
            return res.status(400).json({ message: "Data tidak lengkap" });
        }

        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

        const parameter = {
            transaction_details: {
                order_id: order_id || `NICKY-${Date.now()}`,
                gross_amount: gross_amount,
            },
            customer_details: {
                first_name: customer_name,
                email: email || "customer@example.com",
            },
            callbacks: {
                finish: `${frontendUrl}/kasir`,
                error: `${frontendUrl}/kasir`,
                pending: `${frontendUrl}/kasir`
            }
        };

        const transaction = await snap.createTransaction(parameter);

        // Kirim kembali token Snap ke Frontend
        res.status(200).json({
            status: "success",
            token: transaction.token,
            redirect_url: transaction.redirect_url,
        });
    } catch (error) {
        console.error("Midtrans Error:", error.message);
        res.status(500).json({
            message: "Gagal memproses pembayaran",
            error: error.message,
        });
    }
};

export const handleWebhook = async (req, res) => {
    try {
        const notificationJson = req.body;

        // Validasi & ekstrak data notifikasi menggunakan SDK Midtrans
        const statusResponse =
            await snap.transaction.notification(notificationJson);

        const orderId = statusResponse.order_id;
        const transactionStatus = statusResponse.transaction_status;

        console.log(
            `Notifikasi diterima. Order ID: ${orderId}. Status: ${transactionStatus}`,
        );

        // Tentukan status pembayaran baru berdasarkan respon Midtrans
        let statusPembayaranBaru = "";

        if (transactionStatus === "settlement") {
            statusPembayaranBaru = "Lunas";
        } else if (
            transactionStatus === "cancel" ||
            transactionStatus === "deny" ||
            transactionStatus === "expire"
        ) {
            statusPembayaranBaru = "Gagal";
        } else if (transactionStatus === "pending") {
            statusPembayaranBaru = "Pending";
        }

        // Contoh Update status di Database (Silakan sesuaikan dengan model Anda nanti)
        if (statusPembayaranBaru) {
            console.log(
                `Database (Simulasi) berhasil diperbarui. Order ${orderId} -> ${statusPembayaranBaru}`,
            );
            // await Transaction.findOneAndUpdate({ order_id: orderId }, { status_pembayaran: statusPembayaranBaru });
        }

        // Kirim respon HTTP 200 ke Midtrans
        res.status(200).json({
            status: "OK",
            message: "Webhook diproses sukses",
        });
    } catch (error) {
        console.error("Webhook Error:", error.message);
        res.status(500).json({
            message: "Internal Server Error",
            error: error.message,
        });
    }
};
