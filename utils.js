/** @format */

'use-strict';
const { get } = require('axios');
const zip = require('adm-zip');
const { isAbsolute, join } = require('path');

const parseJSON = (strBuff) => JSON.parse(strBuff.toString('utf8'));

async function fetchZip(url) {
	return (await get(url, { responseType: 'arraybuffer' })).data;
}

function deflate(zipFile) {
	return new zip(zipFile)
		.getEntries()
		.filter(({ entryName }) => /\.json$/.test(entryName))
		.map((el) => ({
			name: el.entryName,
			data: parseJSON(el.getData())
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

const fullPath = (p) => (isAbsolute(p) ? p : join(process.cwd(), p));

module.exports = {
	deflate,
	getSandboxResults,
	getSandboxResult,
	fullPath,
	parseJSON
};
