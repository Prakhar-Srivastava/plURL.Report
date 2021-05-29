/** @format */

'use-strict';
const { prune } = require('../utils');

function parse({ preliminary: prelim }) {
	const {
		blacklists = null,
		links = {},
		ratings: static_ratings,
		site,
		scan: pref,
		tls = {},
		recommendations: recom = {},
		warnings: warn,
		software = {},
		...misc
	} = prelim;

	const info = { ...site, ...software };

	const { iframes = [], js_external = [], js_local = [], urls = [] } = links;

	const { x_frame_options, ...header } = recom?.headers_minor ?? {};
	let threats = {
		critical: [{ blacklists }],
		high: [
			{
				tls_error: {
					error: tls?.error,
					recommendation: recom?.tls_major
				}
			},
			{
				obsoltete: warn?.outdated
			}
		],
		medium: [
			{
				header_issues: x_frame_options
			}
		],
		low: [
			header?.csp,
			header?.no_csp,
			header?.server_banners,
			header?.strict_transport_security,
			header?.x_content_type_options,
			warn?.scan_failed,
			warn?.site_issue
		]
	};

	return prune({
		info,
		js: {
			total: js_external.length + js_local.length,
			local: js_local,
			external: js_external
		},
		iframes,
		urls,
		threats,
		misc: {
			static_ratings,
			pref,
			...misc
		}
	});
}

module.exports = {
	parse
};
