/** @format */

'use-strict';
const prelimParser = require('./preliminary');
const boxParser = require('./sandbox');

const parse = async (json) => ({
	...prelimParser.parse(json),
	sandbox: await boxParser.parse(json)
});

function TI(parsed) {
	const default_threat = { critical: [], high: [], medium: [], low: [] };

	let { threats = default_threat } = parsed;

	for (const i of parsed.sandbox) {
		for (const j of i) {
			for (const level in j.threats) {
				threats[level] =
					threats[level]?.concat(j.threats[level]) ??
					j.threats[level];
			}
		}
	}

	parsed.threats = threats;
	const maxScore = 100;
	let score = maxScore;

	if ((threats.critical?.length ?? 0) >= 1) score -= 70;
	if ((threats.high?.length ?? 0) >= 1) score -= 50;
	const medLength = threats.medium?.length ?? 0;
	if (medLength >= 1) score -= medLength <= 5 ? 10 : 30;
	const lowLength = threats.low?.length ?? 0;
	if (lowLength >= 1) score -= lowLength > 5 ? 20 : 10;

	score = Math.max(score, 0);
	let ratings = { score, rating: 'A', description: 'Minimal Issues' };
	const inLeftOpen = (x, min, max) => x >= min && x < max;

	if (inLeftOpen(score, 90, 100)) {
		ratings.rating = 'A';
		ratings.description = 'Minimal Issues';
	} else if (inLeftOpen(score, 80, 90)) {
		ratings.rating = 'B';
		ratings.description = 'Data Risk';
	} else if (inLeftOpen(score, 70, 80)) {
		ratings.rating = 'C';
		ratings.description = 'Several Vulnerabiities';
	} else if (inLeftOpen(score, 60, 80)) {
		ratings.rating = 'D';
		ratings.description = 'Not Safe';
	} else if (inLeftOpen(score, 50, 60)) {
		ratings.rating = 'E';
		ratings.description = 'Malacious';
	} else if (inLeftOpen(score, -1, 50)) {
		ratings.rating = 'F';
		ratings.description = 'Malacious';
	}

	parsed.ratings = ratings;

	return parsed;
}

module.exports = {
	prelimParser,
	boxParser,
	parse: async (json) => TI(await parse(json))
};
