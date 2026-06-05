import config from "../config/config.js";
import { google } from "googleapis";

const oauth2Client = new google.auth.OAuth2(
  config.CLIENT_ID,
  config.CLIENT_SECRET,
  "https://developers.google.com/oauthplayground"
);

oauth2Client.setCredentials({ refresh_token: config.REFRESH_TOKEN });

const gmail = google.gmail({ version: "v1", auth: oauth2Client });

const sendEmail = async (to, subject, html) => {
  const raw = [
    `From: "Lumina" <${config.EMAIL_USER}>`,
    `To: ${to}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/html; charset=utf-8",
    "",
    html,
  ].join("\r\n");

  const encoded = Buffer.from(raw).toString("base64url");

  const res = await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw: encoded },
  });

  console.log("Email sent via Gmail API:", res.data.id);
  return { messageId: res.data.id };
};

export default sendEmail;
