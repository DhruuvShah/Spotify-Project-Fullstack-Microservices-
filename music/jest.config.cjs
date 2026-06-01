module.exports = {
  testEnvironment: "node",
  transform: { "^.+\\.js$": "babel-jest" },
  testMatch: ["<rootDir>/tests/**/*.test.js"],
  testTimeout: 60000,
  setupFiles: ["<rootDir>/tests/helpers/env.js"],
  transformIgnorePatterns: ["/node_modules/(?!(uuid)/)"],
};
