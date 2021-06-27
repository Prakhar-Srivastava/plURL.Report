/** @format */

'use-strict';
const { isEqual, pick } = require('lodash');
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
			lcname,
			ret,
			vname,
			...useful
		} = json;
		delete useful.window.appVersion;
		delete useful.window.navigator.appVersion;
		delete useful.window.navigator._props;
		delete useful.window.id;

		return useful;
	}

	let {
		_object_id,
		lcname,
		_config,
		_arguments,
		_script_name,
		ret,
		vname,
		...useful
	} = json;

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

function analyzeChanges(keys, data, isBrowser) {
	const handleKey = (key) => {
		switch (key) {
			case 'window': {
				const value = data[key];
				const default_value = loadDefault(isBrowser)[key];
				const ignore = new Set(['_location', '_name', '_props']);
				const changes = diff(default_value, value).filter((k) =>
					ignore.has(k)
				);

				if (changes.length)
					return {
						threats: {
							low: {
								window_object_changes: changes,
								remarks: ['Data Loss', 'Potential Obfuscation']
							}
						}
					};
				else break;
			}
			case 'ENV':
				return {
					threats: {
						critical: {
							environment_tampered: data[key],
							remarks: [
								'PATH Tampered',
								'Unauthorised Install',
								'Malicious Software'
							]
						}
					}
				};
			case 'FS':
				return {
					threats: {
						critical: {
							reads_writes: data[key],
							remarks: [
								'Malicious files in critical directories',
								'Unauthorised Install',
								'Unwanted Software',
								'Malicious Software'
							]
						}
					}
				};
			case 'REG':
				return {
					threats: {
						critical: {
							registry_tampered: data[key],
							remarks: [
								'Unauthorised Install',
								'Unwanted Software',
								'Malicious Software'
							]
						}
					}
				};
			case '_browser_documents':
				break;
			case '_unescape_calls':
				return {
					threats: {
						high: {
							unescape_calls: data[key],
							remarks: ['Deprecated', 'Obfuscation']
						}
					}
				};
			case '_unescape_retuns':
				return {
					threats: {
						high: {
							unescape_returns: data[key],
							remarks: ['Deprecated', 'Obfuscation']
						}
					}
				};
			case '_wscript_objects':
				return {
					threats: {
						high: {
							windows_script_objects: data[key],
							remarks: ['Malicious', 'Malware', 'Windows Script']
						}
					}
				};
			case '_wscript_urls':
				return {
					threats: {
						critical: {
							payload_urls: data[key],
							remarks: [
								'Malicious',
								'Malware',
								'Windows Script',
								'Payload'
							]
						}
					}
				};
			case '_wscript_wmis':
				return {
					threats: {
						critical: {
							wmi: data[key],
							remarks: [
								'Malicious',
								'Malware',
								'Windows Script',
								'Remote Execution',
								'Remote Connection'
							]
						}
					}
				};
			case 'document':
				break;
			default:
				return {
					threats: {
						medium: {
							global_scope: key,
							remarks: ['Data Loss', 'Potential Obfuscation']
						}
					}
				};
		}
	};

	let global_threats = {
		critical: [],
		high: [],
		medium: [],
		low: []
	};

	keys.forEach((key) => {
		const { threats = {} } = handleKey(key) || {};
		const levels = Object.keys(threats);
		levels.forEach((level) => {
			global_threats[level] = global_threats[level].concat(
				threats[level]
			);
		});
	});

	return { threats: { ...global_threats } };
}

async function parse({ sandbox }) {
	try {
		const unzippedReports = await sandbox;

		return purge(
			unzippedReports.map(({ endpoint, zipReport }) =>
				purge(
					zipReport.map(({ name, data }) => {
						const envRE = /__env-(.+?)__([0-9]+?)\.json$/;
						const outRE = /output_(.+?)urls.json$/;

						const envMatch = name.match(envRE);
						const outMatch = name.match(outRE);

						if (envMatch) {
							const [, emulator, timeOfScan] = envMatch;
							const isBrowser = BROWSERS.has(emulator);
							const changedKeys = diff(
								loadDefault(isBrowser),
								stripParamerters(data, isBrowser)
							);

							return {
								endpoint,
								emulator,
								changedKeys,
								//data,
								name,
								timeOfScan,
								...analyzeChanges(changedKeys, data, isBrowser)
							};
						} else if (outMatch) {
							const [, emulator] = outMatch;
							const payload = data;

							return {
								endpoint,
								emulator,
								name,
								payload,
								threats: {
									critical: {
										payload,
										remarks: [
											'Malware',
											'Payload downloaded'
										]
									}
								}
							};
						}
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
	diff,
	stripParamerters
};
