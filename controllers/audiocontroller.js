const twilio = require("twilio");
// const multer = require("multer");
const audio = require("../models/audio.model");

// handling file data and creating asset
const uploadAsset = async (req, res, next) => {
  const { friendlyName, category, assetLink } = req.body;

  console.log(req.body);

  try {
    if (!friendlyName || !category || !assetLink) {
      return res.status(400).json({ error: "All inputs required" });
    }

    const existingAsset = await audio.findOne({
      $or: [{ friendlyName }, { assetLink }],
    });
    if (existingAsset) {
      return res.status(409).json({
        error: "File with this data already exists",
      });
    }

    const asset = new audio({
      friendlyName,
      category,
      assetLink,
    });

    await asset.save();

    return res
      .status(200)
      .json({ message: "Asset created successfully", asset, assetLink });
  } catch (error) {
    console.error("Error creating asset:", error);
    res.status(500).json({ error: `Error creating asset: ${error.message}` });
  }
};

const getAudioLinkByCategory = async (category) => {
  try {
    const audioFiles = await audio.find({ category });

    if (audioFiles.length === 0) {
      throw new Error(`No audio files found for category: ${category}`);
    }

    const randomIndex = Math.floor(Math.random() * audioFiles.length);
    const randomAudioFile = audioFiles[randomIndex];

    const twiml = new twilio.twiml.VoiceResponse();
    twiml.play(randomAudioFile.assetLink, { loop: 1 });

    // No <Dial> verb here, which will keep the call connected to the original party

    return twiml.toString();
  } catch (error) {
    console.error("Error fetching audio files:", error);
    throw new Error(`Error fetching audio files: ${error.message}`);
  }
};

module.exports = {
  uploadAsset,
  getAudioLinkByCategory,
};
