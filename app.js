const express = require("express");
const twilio = require("twilio");
const path = require("path");
const handlebars = require("handlebars");
const bodyParser = require("body-parser");
const session = require("express-session");
const logger = require("morgan");
const router = require("./routes");
const connectDb = require("./config/db");

const app = express();
const PORT = process.env.PORT || 3000;


app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(session({ secret: "secret", resave: false, saveUninitialized: false }));

app.use("/", router);

connectDb();

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
module.exports = app;
