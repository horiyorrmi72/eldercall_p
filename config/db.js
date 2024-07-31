require('dotenv').config();
const mongoose = require('mongoose');
const URL = process.env.db_url;

const connectDb = async () => {
	try {
		await mongoose.connect(URL, { dbName: 'elderApp' });
		console.log('Connected to the database successfully!');
	} catch (err) {
		console.error(`Error connecting to the database: ${err}`);
	}
};

module.exports = connectDb;
