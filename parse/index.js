/** @format */

const prelimParser = require('./preliminary');
const boxParser = require('./sandbox');

const parse = async (json) => ({
	...prelimParser.parse(json),
	sandbox: await boxParser.parse(json)
});

module.exports = {
	prelimParser,
	boxParser,
	parse
};
