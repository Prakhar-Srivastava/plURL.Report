/** @format */

'use-strict';
const { isEqual } = require('lodash');
const { relativePath, purge } = require('../utils');

function stripParamerters(json, isBrowser = true) {
	if (isBrowser) {
		let {
			_browser_type,
			_agents,
			_config,
			_arguments,
			_script_name,
			_object_id,
			...useful
		} = json;
		delete useful.window.appVersion;
		delete useful.window.navigator.appVersion;
		delete useful.window.navigator._props;

		return useful;
	}

	let { _object_id, lcname, _config, _arguments, _script_name, ...useful } =
		json;

	return useful;
}

function loadDefault(isBrowser = true) {
	const defaultFile = `/defaults/${isBrowser ? 'chrome' : 'wscript'}.json`;
	const json = require(relativePath(defaultFile));

	return Object.freeze(stripParamerters(json, isBrowser));
}

function diff(obj1, obj2) {
	const diff = Object.keys(obj1).reduce((result, key) => {
		if (!obj2.hasOwnProperty(key)) {
			result.push(key);
		} else if (isEqual(obj1[key], obj2[key])) {
			const resultKeyIndex = result.indexOf(key);
			result.splice(resultKeyIndex, 1);
		}
		return result;
	}, Object.keys(obj2));

	return diff;
}

const BROWSERS = new Set([
	'IE11_W10',
	'IE8',
	'IE7',
	'iPhone',
	'Firefox',
	'Chrome'
]);

async function parse({ sandbox }) {
	try {
		const unzippedReports = await sandbox;

		return purge(
			unzippedReports.map(({ endpoint, zipReport }) =>
				purge(
					zipReport.map(({ name, data }) => {
						const regex = /__env-(.+?)__([0-9]+?)\.json$/;
						const [, emulator, timeOfScan] = name.match(regex);
						const isBrowser = BROWSERS.has(emulator);
						const changedKeys = diff(
							loadDefault(isBrowser),
							stripParamerters(data, isBrowser)
						);

						return {
							endpoint,
							emulator,
							changedKeys,
							// data,
							name,
							timeOfScan
						};
					})
				)
			)
		);
	} catch (err) {
		console.error('Execption occured while waiting for a download');
		console.error(err);
		return [];
	}
}

module.exports = {
	parse,
	diff
};
