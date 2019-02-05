const express = require("express");
const app = express();

app.use(express.static("test/e2e"));

app.listen(4444, function () {
  console.log("server listening on port 4444");
});
