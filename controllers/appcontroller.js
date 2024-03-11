const path = require("path");
const fs = require("fs");

const ElderAppHome = async (req, res) => {
  const templatePath = path.join(
    __dirname,
    "../views/templates/elderMessage.html"
  );

  // Read the contents of the HTML file
  fs.readFile(templatePath, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading HTML file:", err);
      res.status(500).send("Internal Server Error");
      return;
    }
    // Send the HTML content to the client
    res.status(200).send(data);
  });
};

module.exports = {
  ElderAppHome,
};
