'use-strict';
const { get } = require('axios');
const zip = require('adm-zip');

async function fetchZip(url) {
	return (await get(url, { responseType: 'arraybuffer' })).data;
}

function deflate(zipFile) {
	return (new zip(zipFile)).getEntries().filter(
		({entryName}) => /\.json$/.test(entryName)
	).map((el) => ({
		name: el.entryName,
		data: JSON.parse(el.getData().toString('utf8'))
	}));
}

function getSandboxResult(url) {
	return new Promise((resolve, reject) => {
		fetchZip(url)
		.then((zipBuff) => resolve(deflate(zipBuff)))
		.catch((err) => reject(err));
	});
}

const getSandboxResults = (urls) => Promise.all(urls.map(getSandboxResult));

module.exports = {
	deflate,
	getSandboxResults,
	getSandboxResult
};

