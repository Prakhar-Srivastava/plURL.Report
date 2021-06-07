/** @format */

'use-strict';
const { getSandboxResults, fullPath, parseJSON } = require('./utils');
const { parse } = require('./parse');

const args = process.argv.slice(2).map(fullPath);

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

if (args.length) {
	const reads = args.map(read);

	for (const json of reads)
		try {
			parseFile(json)
				.then((result) => console.log(JSON.stringify(result)))
				.catch((exp) => console.error('Exception', exp));
		} catch (exp) {
			console.error('Exception', exp);
		}
} else {
	let buffs = [];

	process.stdin
		.on('data', (buff) => buffs.push(buff))
		.on('end', () => {
			const json = read(buffs);

			parseFile(json)
				.then((result) => console.log(JSON.stringify(result)))
				.catch((exp) => console.error('Exception', exp));
		});
}

module.exports = {
	read,
	parseFile,
};
