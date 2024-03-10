const ElderAppHome = async (req, res) => {
  res.status(200).send("<h1>ElderCall</h1>");
};

module.exports = {
  getHome,
};
