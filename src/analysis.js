import {getCustom} from "./tools.js";

export default { requestComponent, requestStack }

/**
 * Send a stack analysis request and get the report as 'text/html' or 'application/json'.
 * @param {import('./provider').Provider} provider - the provided data for constructing the request
 * @param {string} manifest - path for the manifest
 * @param {string} url - the backend url to send the request to
 * @param {boolean} [html=false] - true will return 'text/html', false will return 'application/json'
 * @param {{}} [opts={}] - optional various options to pass along the application
 * @returns {Promise<string|import('../generated/backend/AnalysisReport').AnalysisReport>}
 */
async function requestStack(provider, manifest, url, html = false, opts = {}) {
	let provided = provider.provideStack(manifest, opts) // throws error if content providing failed
	let resp = await fetch(`${url}/api/v3/analysis}`, {
		method: 'POST',
		headers: {
			'Accept': html ? 'text/html' : 'application/json',
			'Content-Type': provided.contentType,
			...getTokenHeaders(opts)
		},
		body: provided.content
	})
	return html ? resp.text() : resp.json()
}

/**
 * Send a component analysis request and get the report as 'application/json'.
 * @param {import('./provider').Provider} provider - the provided data for constructing the request
 * @param {string} data - the content of the manifest
 * @param {string} url - the backend url to send the request to
 * @param {{}} [opts={}] - optional various options to pass along the application
 * @returns {Promise<import('../generated/backend/AnalysisReport').AnalysisReport>}
 */
async function requestComponent(provider, data, url, opts = {}) {
	let provided = provider.provideComponent(data, opts) // throws error if content providing failed
	let resp = await fetch(`${url}/api/v3/analysis}`, {
		method: 'POST',
		headers: {
			'Accept': 'application/json',
			'Content-Type': provided.contentType,
			...getTokenHeaders(opts),
		},
		body: provided.content
	})
	return resp.json()
}

/**
 * Utility function for fetching vendor tokens
 * @param {{}} [opts={}] - optional various options to pass along the application
 * @returns {{}}
 */
function getTokenHeaders(opts = {}) {
	let supportedTokens = ['snyk']
	let headers = {}
	supportedTokens.forEach(vendor => {
		let token = getCustom(`EXHORT_${vendor.toUpperCase()}_TOKEN`, null, opts);
		if (token) {
			headers[`ex-${vendor}-token`] = token
		}
	})
	return headers
}
