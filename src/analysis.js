export default { requestComponent, requestStack }

/**
 * Send a stack analysis request and get the report as 'text/html' or 'application/json'.
 * @param {import('./provider').Provider} provider - the provided data for constructing the request
 * @param {string} manifest - path for the manifest
 * @param {string} url - the backend url to send the request to
 * @param {boolean} [html=false] - true will return 'text/html', false will return 'application/json'
 * @returns {Promise<string|import('../generated/backend/AnalysisReport').AnalysisReport>}
 */
async function requestStack(provider, manifest, url, html = false) {
	let provided = provider.provideStack(manifest) // throws error if content providing failed
	let resp = await fetch(`${url}/api/v3/dependency-analysis/${provided.ecosystem}`, {
		method: 'POST',
		headers: {
			'Accept': html ? 'text/html' : 'application/json',
			'Content-Type': provided.contentType,
			...getTokenHeaders()
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
 * @returns {Promise<import('../generated/backend/AnalysisReport').AnalysisReport>}
 */
async function requestComponent(provider, data, url) {
	let provided = provider.provideComponent(data) // throws error if content providing failed
	let resp = await fetch(`${url}/api/v3/component-analysis/${provided.ecosystem}`, {
		method: 'POST',
		headers: {
			'Accept': 'application/json',
			'Content-Type': provided.contentType,
			...getTokenHeaders(),
		},
		body: provided.content
	})
	return resp.json()
}

function getTokenHeaders() {
	let supportedTokens = ['snyk']
	let headers = {}
	supportedTokens.forEach(vendor => {
		let token = process.env[`CRDA_${vendor.toUpperCase()}_TOKEN`]
		if (token) {
			headers[`crda-${vendor}-token`] = token
		}
	})
	return headers
}
