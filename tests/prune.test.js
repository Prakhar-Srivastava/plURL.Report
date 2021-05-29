/** @format */

const { prune } = require('../utils');

const trivials = [{}, [], 0, -0, '', NaN, false, null, undefined].map(
	(trivial_case) => ({ test: trivial_case, expect: undefined })
);

const cases = [
	...trivials,
	{
		test: {
			hey: [
				{
					yo: {
						sup: []
					}
				}
			]
		},
		expect: null
	},
	{
		test: {
			hey: [
				{
					yo: {
						sup: [1]
					}
				}
			]
		},
		expect: {
			hey: [
				{
					yo: {
						sup: [1]
					}
				}
			]
		}
	},
	{
		test: [{}, [], [[[{}]]], 0, 1],
		expect: [1]
	},
	{
		test: [{}, [1], [[[{}]]], 0, 1],
		expect: [1, [1]]
	}
];

cases.forEach(({ test, expect }) =>
	console.log(
		'\x1b[33m',
		JSON.stringify(test, null, 2),
		'\n---------------------------------------------------------------------\n',
		'\x1b[32m',
		JSON.stringify(expect, null, 2),
		'\x1b[31m',
		JSON.stringify(prune(test), null, 2),
		'\n======================================================================\n'
	)
);
