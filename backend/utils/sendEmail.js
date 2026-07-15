import nodemailer from "nodemailer";

const sendEmail = async (options) => {
    // Create a transporter
    const transporter = nodemailer.createTransport({
        service: "gmail", // Can be configured via .env later
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    // Define email options
    const mailOptions = {
        from: `Nicky Frozen POS <${process.env.EMAIL_USER}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.htmlMessage, // Support for HTML formatting
    };

    // Send the email
    await transporter.sendMail(mailOptions);
};

export default sendEmail;
