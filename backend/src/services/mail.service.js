import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.GOOGLE_USER,
        pass: process.env.GOOGLE_APP_PASSWORD
    }
});

export async function sendEmail({ to, subject, text, html }) {
    return await transporter.sendMail({
        from: process.env.GOOGLE_USER,
        to,
        subject,
        text,
        html
    });
}