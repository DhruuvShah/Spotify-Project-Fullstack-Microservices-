import config from "../config/config.js";
import nodemailer from "nodemailer";
import { resolve4 } from "dns/promises";

let _transporter = null;

async function getTransporter() {
  if (_transporter) return _transporter;

  // Explicitly resolve to IPv4 — Render cannot reach Gmail over IPv6
  const [smtpHost] = await resolve4("smtp.gmail.com");

  _transporter = nodemailer.createTransport({
    host: smtpHost,         // IPv4 address, bypasses all DNS at connect time
    port: 465,
    secure: true,
    tls: { servername: "smtp.gmail.com" }, // correct cert validation despite IP host
    auth: {
      type: "OAuth2",
      user: config.EMAIL_USER,
      clientId: config.CLIENT_ID,
      clientSecret: config.CLIENT_SECRET,
      refreshToken: config.REFRESH_TOKEN,
    },
  });

  return _transporter;
}

const sendEmail = async (to, subject, html) => {
  const transporter = await getTransporter();
  const info = await transporter.sendMail({
    from: `"Lumina" <${config.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
  console.log("Email sent:", info.messageId);
  return info;
};

export default sendEmail;
