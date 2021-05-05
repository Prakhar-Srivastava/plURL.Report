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

if (args.length) {
	const reads = args.map(read);

	for (const json of reads)
		for (const url in json) {
			parse(json[url])
				.then((val) => console.log(decodeURIComponent(url), val))
				.catch((err) => console.error('Exception', err));
		}
} else {
	let buffs = [];

	process.stdin
		.on('data', (buff) => buffs.push(buff))
		.on('end', () => {
			const json = read(buffs);

			for (const url in json) {
				parse(json[url])
					.then((val) => console.log(decodeURIComponent(url), val))
					.catch((err) => console.error('Exception', err));
			}
		});
}
