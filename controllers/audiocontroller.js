require('dotenv').config();
const audio = require('../models/audio.model');
const { S3Client } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const bucketName = process.env.BUCKET_NAME;

const client = new S3Client({
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  },
  region: 'eu-north-1',
});

const uploadDataToS3 = async (filename, bucket, fileBuffer) => {
  try {
    const data = new Upload({
      client,
      params: {
        Bucket: bucket,
        Key: filename,
        Body: fileBuffer,
        ContentType: 'audio/mpeg',
        ACL: 'public-read',
      },
    });
    const result = await data.done();
    return result;
  } catch (error) {
    /* eslint-disable-next-line no-console */
    console.error('Error uploading file:', error);
    throw error;
  }
};

// handling file data and creating asset
/**
 * Uploads an audio asset.
 * uploads audio to S3 bucket
 * return the location [URL] of the audio
 * use it as the asset link and save it to the audio model
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function if need be (optional)
 * @argument friendlyName - Name of the audio file (keep it precise and unique)
 * @argument category - category the audio file belongs to (['birthday', 'house-warming', 'wedding', 'naming', 'others']), this is base on the model object
 * @argument assetLink - audio file url generated. this is returned after the audio file has been uploaded to the S3 Bucket on AWS
 *
 * @returns {Promise}
 */
const uploadAsset = async (req, res) => {
  const { friendlyName, category } = req.body;
  const file = req.file;

  if (!file) {
    return res.status(404).json({
      success: false,
      message:
				'No file uploaded. Ensure you have selected an audio file to upload.',
    });
  }

  if (file.mimetype != 'audio/mpeg')
  {
    const fileFormat = file.mimetype;
    return res.status(400).json({
      success: false,
      format:fileFormat,
      message:
				'File format not supported! Make sure to upload a file of the supported format.',
    });
  }

  if (!friendlyName || !category) {
    return res.status(400).json({ error: 'All inputs required' });
  }
  let assetLink;
  try {
    const existingAsset = await audio.findOne({
      $or: [{ friendlyName }, { assetLink }],
    });

    if (existingAsset) {
      return res.status(409).json({
        error: 'File with this data already exists',
      });
    }

    const uniqueSuffix =
			`${Date.now()}_${'byAdmin'}` + Math.round(Math.random() * 1e10);
    const newName = `eldercall-${uniqueSuffix}-${file.originalname}`;

    const uploadedData = await uploadDataToS3(newName, bucketName, file.buffer);

    const asset = new audio({
      friendlyName,
      category,
      assetLink: uploadedData.Location,
    });

    await asset.save();

    res.status(200).json({
      success: true,
      message: 'Asset created successfully',
      asset,
      assetLink: uploadedData.Location,
    });
  } catch (error) {
    // console.error('Error uploading asset:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Fetches a random audio file link by category.
 *
 * @param {string} category - The audio category to fetch a random file from
 * //  * @returns {Promise<string>} The TwiML markup for the random audio file
 * @throws {Error} If no audio files found for the category
 */
const getAudioLinkByCategory = async (category) => {
  try {
    const audioFiles = await audio.find(category);

    if (audioFiles.length === 0) {
      throw new Error(`No audio files found for category: ${category}`);
    }
    const randomIndex = Math.floor(Math.random() * audioFiles.length);
    const randomAudioFile = audioFiles[randomIndex];
    const result = randomAudioFile.assetLink;
    // console.log(result);
    return result.toString();
  } catch (error) {
    /* eslint-disable-next-line no-console */
    console.log({
      status: 500,
      error: `Error fetching audio files: ${error.message}`,
    });
  }
};

module.exports = {
  uploadAsset,
  getAudioLinkByCategory,
};
