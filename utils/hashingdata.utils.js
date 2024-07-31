const bcrypt = require('bcrypt');

const hashData = async (data) => {
	const salt = bcrypt.genSaltSync(10);
	const hashedData = await bcrypt.hash(data, salt);
	return hashedData;
};

const compareData = async (unhashedData, hashed) => {
	try {
		const matchingData = await bcrypt.compare(unhashedData, hashed);
		return matchingData;
	} catch (err) {
		throw new Error(`${Data} do not match`);
	}
};

module.exports = {
	hashData,
	compareData,
};
