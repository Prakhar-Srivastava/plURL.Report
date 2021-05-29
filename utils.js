/** @format */

'use-strict';
const { get } = require('axios');
const zip = require('adm-zip');
const { isAbsolute, join } = require('path');

const parseJSON = (strBuff) => JSON.parse(strBuff.toString('utf8'));

const IS_ARRAY = [].constructor.name,
	IS_OBJECT = {}.constructor.name;
const falsy = (obj) => {
	if (!obj) return true;

	switch (obj.constructor.name) {
		case IS_ARRAY:
			return obj.length === 0;
		case IS_OBJECT:
			return Object.keys(obj).length === 0;
	}

	return false;
};

const purge = (arr) => arr.filter((el) => !falsy(el));

function prune(container) {
	if (!falsy(container)) {
		prune.prototype.return_type =
			prune.prototype?.return_type ??
			container.constructor.name === IS_ARRAY
				? []
				: null;

		const container_type = container.constructor.name;
		if (container_type === IS_ARRAY) {
			return container.map(prune).filter((el) => !falsy(el));
		} else if (container_type === IS_OBJECT) {
			const first = Object.keys(container);
			const second = first.map((el) => prune(container[el]));

			for (let x = 0; x < first.length; ++x)
				if (falsy(second[x])) delete container[first[x]];
		}

		if (falsy(container)) return null;
	} else return prune.prototype.return_type;

	return container;
}

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

const relativePath = (p) => join(__dirname, p);

module.exports = {
	deflate,
	getSandboxResults,
	getSandboxResult,
	fullPath,
	relativePath,
	parseJSON,
	purge,
	prune
};
