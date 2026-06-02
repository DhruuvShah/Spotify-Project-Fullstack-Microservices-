module.exports = {
  testEnvironment: "node",
  transform: { "^.+\\.js$": "babel-jest" },
  testMatch: ["<rootDir>/src/tests/**/*.test.js"],
  testTimeout: 60000,
};
