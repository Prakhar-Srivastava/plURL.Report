/** @format */

'use-strict';
const { prune, purge } = require('../utils');

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
	const {
		no_csp,
		server_banners,
		strict_transport_security,
		x_content_type_options,
	} = header;

	const threats = {
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
			{
				header_issues: {
					no_csp,
					server_banners,
					strict_transport_security,
					x_content_type_options,
				}
			},
			{
				warnings: {
					scan_issue:  warn?.scan_failed,
					site_issue: warn?.site_issue
				}
			}
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
