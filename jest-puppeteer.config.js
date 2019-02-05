module.exports = {
  launch: {
    dumpio: true,
    headless: process.env.HEADLESS !== "false",
  },
  server: {
    command: "node ./test/e2e/server.js",
    port: 4444,
  },
};
