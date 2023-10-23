import {EOL} from "os";
import {RegexNotToBeLogged, getCustom} from "./tools.js";

export default { requestComponent, requestStack, validateToken }

const rhdaTokenHeader = "rhda-token";
const rhdaSourceHeader = "rhda-source"
const rhdaOperationTypeHeader = "rhda-operation-type"

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
	opts[rhdaOperationTypeHeader.toUpperCase().replaceAll("-","_")] = "stack-analysis"
	let startTime = new Date()
	let EndTime
	if (process.env["EXHORT_DEBUG"] === "true") {
		console.log("Starting time of sending stack analysis request to exhort server= " + startTime)
	}
	let resp = await fetch(`${url}/api/v3/analysis`, {
		method: 'POST',
		headers: {
			'Accept': html ? 'text/html' : 'application/json',
			'Content-Type': provided.contentType,
			...getTokenHeaders(opts)
		},
		body: provided.content
	})
	if (process.env["EXHORT_DEBUG"] === "true") {
		EndTime = new Date()
		console.log("Ending time of sending stack analysis request to exhort server= " + EndTime)
		let time = (EndTime - startTime) / 1000
		console.log("Total Time in seconds: " + time)
	}
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
	opts[rhdaOperationTypeHeader.toUpperCase().replaceAll("-","_")] = "component-analysis"
	if (process.env["EXHORT_DEBUG"] === "true") {
		console.log("Starting time of sending component analysis request to exhort server= " + new Date())
	}
	let resp = await fetch(`${url}/api/v3/analysis`, {
		method: 'POST',
		headers: {
			'Accept': 'application/json',
			'Content-Type': provided.contentType,
			...getTokenHeaders(opts),
		},
		body: provided.content
	})
	if (process.env["EXHORT_DEBUG"] === "true") {
		console.log("Ending time of sending component analysis request to exhort server= " + new Date())
	}
	return resp.json()
}

/**
 *
 * @param url the backend url to send the request to
 * @param {{}} [opts={}] - optional various options to pass headers for t he validateToken Request
 * @return {Promise<number>} return the HTTP status Code of the response from the validate token request.
 */
async function validateToken(url, opts = {}) {
	let resp = await fetch(`${url}/api/v3/token`, {
		method: 'GET',
		headers: {
			// 'Accept': 'text/plain',
			...getTokenHeaders(opts),
		}
	})
	return resp.status
}


function setRhdaHeader(headerName,headers,opts) {
	let rhdaHeaderValue = getCustom(headerName.toUpperCase().replaceAll("-", "_"), null, opts);
	if (rhdaHeaderValue) {
		headers[headerName] = rhdaHeaderValue
	}
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
	setRhdaHeader(rhdaTokenHeader,headers, opts);
	setRhdaHeader(rhdaSourceHeader,headers, opts);
	setRhdaHeader(rhdaOperationTypeHeader, headers,opts);
	if (process.env["EXHORT_DEBUG"] === "true")
	{
		console.log("Headers Values to be sent to exhort:" + EOL)
		for (const headerKey in headers) {
			if(!headerKey.match(RegexNotToBeLogged))
			{
				console.log(`${headerKey}: ${headers[headerKey]}`)
			}
		}
	}
	return headers
}
