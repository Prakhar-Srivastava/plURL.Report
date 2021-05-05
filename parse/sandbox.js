/** @format */

async function parse({ sandbox }) {
	try {
		const box = await sandbox;
		return box;
	} catch (err) {
		console.error('Execption occured while waiting for a download');
		console.error(err);
		return [];
	}
}

module.exports = {
	parse
};
