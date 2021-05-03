'use-strict';
const fs = require('fs');
const { getSandboxResults } = require('./utils');
const json = require('../../babyscan/babymart.json');
const urls = Object.keys(json);
const sandbox_results = Promise.all(
	urls.map((key) => getSandboxResults(json[key].sandbox))
).then((table) => console.log(table)).catch((err) => console.error(err));


