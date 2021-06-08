/** @format */

'use-strict';
const { getSandboxResults, parseJSON } = require('./utils');
const { parse } = require('./parse');

function read(plURLOutput) {
	let json = Array.isArray(plURLOutput)
		? parseJSON(Buffer.concat(plURLOutput))
		: require(plURLOutput);

	for (const url in json)
		json[url].sandbox = getSandboxResults(json[url].sandbox);

	return json;
}

async function parseFile(json) {
	const urls = Object.keys(json);
	return await Promise.all(urls.map((url) => parse(json[url])));
}

module.exports = {
	read,
	parseFile,
};
