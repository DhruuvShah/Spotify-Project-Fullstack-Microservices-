import { subscribeToQueue } from "./rabbit.js";
import sendEmail from "../utils/email.js";

function startListener() {
  subscribeToQueue("user_created", async (msg) => {
    const {
      email,
      role,
      fullname: { firstName, lastName },
    } = msg;

    const template = `
      <h1>Welcome to Spotify!</h1>
      <p>Dear ${firstName} ${lastName},</p>
      <p>Thank you for joining our platform!</p>
      <p>Your account has been created with the role of ${role}.</p>
      <p>We hope you enjoy our services and have a great experience with us.</p>
      <br />
      <p>Best regards,</p>
      <p>The Spotify Team</p>`;

    await sendEmail(email, "Welcome to Spotify!", template);
  });
}

export default startListener;
