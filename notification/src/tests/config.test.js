import { validateEnv } from "../utils/validateEnv.js";

describe("validateEnv", () => {
  it("throws when a single required variable is missing", () => {
    expect(() => validateEnv({}, ["RABBITMQ_URI"])).toThrow(
      "Missing required environment variables: RABBITMQ_URI"
    );
  });

  it("lists every missing variable in the error message", () => {
    expect(() => validateEnv({}, ["EMAIL_USER", "MONGO_URI"])).toThrow(
      "EMAIL_USER, MONGO_URI"
    );
  });

  it("does not throw when all required variables are present", () => {
    expect(() =>
      validateEnv(
        {
          CLIENT_ID: "x",
          CLIENT_SECRET: "x",
          REFRESH_TOKEN: "x",
          EMAIL_USER: "x",
          RABBITMQ_URI: "x",
          MONGO_URI: "x",
        },
        ["CLIENT_ID", "CLIENT_SECRET", "REFRESH_TOKEN", "EMAIL_USER", "RABBITMQ_URI", "MONGO_URI"]
      )
    ).not.toThrow();
  });

  it("does not throw for an empty required list", () => {
    expect(() => validateEnv({}, [])).not.toThrow();
  });

  it("treats empty string values as missing", () => {
    expect(() => validateEnv({ RABBITMQ_URI: "" }, ["RABBITMQ_URI"])).toThrow(
      "RABBITMQ_URI"
    );
  });
});
