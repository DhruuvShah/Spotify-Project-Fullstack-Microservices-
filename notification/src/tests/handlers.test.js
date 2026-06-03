import { userCreatedHandler } from "../handlers/userCreated.js";
import sendEmail from "../utils/email.js";
import Notification from "../models/Notification.js";

jest.mock("../utils/email.js", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("../models/Notification.js", () => ({
  __esModule: true,
  default: { create: jest.fn() },
}));

const validMsg = {
  email: "test@example.com",
  role: "user",
  fullname: { firstName: "Dhruv", lastName: "Shah" },
};

describe("userCreatedHandler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sendEmail.mockResolvedValue({ messageId: "<test-message-id@example.com>" });
    Notification.create.mockResolvedValue({});
  });

  it("calls sendEmail with correct email and subject", async () => {
    await userCreatedHandler(validMsg);
    expect(sendEmail).toHaveBeenCalledWith(
      "test@example.com",
      "Welcome to Lumina!",
      expect.stringContaining("<!DOCTYPE html>")
    );
  });

  it("passes the recipient's name into the email body", async () => {
    await userCreatedHandler(validMsg);
    const html = sendEmail.mock.calls[0][2];
    expect(html).toContain("Dhruv");
  });

  it("saves a sent notification record on success", async () => {
    await userCreatedHandler(validMsg);
    expect(Notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientEmail: "test@example.com",
        type: "welcome",
        status: "sent",
        messageId: "<test-message-id@example.com>",
      })
    );
  });

  it("saves a failed notification record and rethrows when sendEmail fails", async () => {
    sendEmail.mockRejectedValue(new Error("SMTP connection refused"));

    await expect(userCreatedHandler(validMsg)).rejects.toThrow("SMTP connection refused");

    expect(Notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientEmail: "test@example.com",
        type: "welcome",
        status: "failed",
        errorMessage: "SMTP connection refused",
      })
    );
  });

  it("throws a validation error and skips sendEmail when email is missing", async () => {
    const bad = { role: "user", fullname: { firstName: "Dhruv" } };
    await expect(userCreatedHandler(bad)).rejects.toThrow("Invalid user_created message");
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("throws a validation error and skips sendEmail when firstName is missing", async () => {
    const bad = { email: "test@example.com", role: "user", fullname: {} };
    await expect(userCreatedHandler(bad)).rejects.toThrow("Invalid user_created message");
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("throws a validation error and skips sendEmail when role is missing", async () => {
    const bad = { email: "test@example.com", fullname: { firstName: "Dhruv" } };
    await expect(userCreatedHandler(bad)).rejects.toThrow("Invalid user_created message");
    expect(sendEmail).not.toHaveBeenCalled();
  });
});
