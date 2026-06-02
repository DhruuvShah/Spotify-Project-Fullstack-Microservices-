import sendEmail from "../utils/email.js";
import { welcomeTemplate } from "../templates/welcome.js";
import Notification from "../models/Notification.js";

export async function userCreatedHandler(msg) {
  const { email, role, fullname } = msg;

  if (!email || !fullname?.firstName || !role) {
    throw new Error(
      `Invalid user_created message — missing required fields. Received: ${JSON.stringify(msg)}`,
    );
  }

  const html = welcomeTemplate({ firstName: fullname.firstName, role });

  try {
    const info = await sendEmail(email, "Welcome to Spotify!", html);
    await Notification.create({
      recipientEmail: email,
      type: "welcome",
      status: "sent",
      messageId: info.messageId,
    });
  } catch (err) {
    await Notification.create({
      recipientEmail: email,
      type: "welcome",
      status: "failed",
      errorMessage: err.message,
    }).catch((dbErr) =>
      console.error("Failed to save failed notification record:", dbErr.message)
    );
    throw err;
  }
}
