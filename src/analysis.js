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
	let resp = await fetch(`${url}/api/v4/analysis`, {
		method: 'POST',
		headers: {
			'Accept': html ? 'text/html' : 'application/json',
			'Content-Type': provided.contentType,
			...getTokenHeaders(opts)
		},
		body: provided.content
	})
	let result
	if(!html) {
		result = await resp.json()
	}
	else {
		result = await resp.text()
	}
	if (process.env["EXHORT_DEBUG"] === "true") {
		let exRequestId = resp.headers.get("ex-request-id");
		if(exRequestId)
		{
			console.log("Unique Identifier associated with this request - ex-request-id=" + exRequestId)
		}
		EndTime = new Date()
		console.log("Response body received from exhort server : " + EOL + EOL)
		console.log(console.log(JSON.stringify(result,null , 4)))
		console.log("Ending time of sending stack analysis request to exhort server= " + EndTime)
		let time = (EndTime - startTime) / 1000
		console.log("Total Time in seconds: " + time)

	}
	return Promise.resolve(result)
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
	let resp = await fetch(`${url}/api/v4/analysis`, {
		method: 'POST',
		headers: {
			'Accept': 'application/json',
			'Content-Type': provided.contentType,
			...getTokenHeaders(opts),
		},
		body: provided.content
	})
	let result = await resp.json()
	if (process.env["EXHORT_DEBUG"] === "true") {
		let exRequestId = resp.headers.get("ex-request-id");
		if(exRequestId)
		{
			console.log("Unique Identifier associated with this request - ex-request-id=" + exRequestId)
		}
		console.log("Response body received from exhort server : " + EOL + EOL)
		console.log(JSON.stringify(result,null , 4))
		console.log("Ending time of sending component analysis request to exhort server= " + new Date())


	}

	return Promise.resolve(result)
}

/**
 *
 * @param url the backend url to send the request to
 * @param {{}} [opts={}] - optional various options to pass headers for t he validateToken Request
 * @return {Promise<number>} return the HTTP status Code of the response from the validate token request.
 */
async function validateToken(url, opts = {}) {
	let resp = await fetch(`${url}/api/v4/token`, {
		method: 'GET',
		headers: {
			// 'Accept': 'text/plain',
			...getTokenHeaders(opts),
		}
	})
	let exRequestId = resp.headers.get("ex-request-id");
	if(exRequestId)
	{
		console.log("Unique Identifier associated with this request - ex-request-id=" + exRequestId)
	}
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
	let supportedTokens = ['snyk','oss-index']
	let headers = {}
	supportedTokens.forEach(vendor => {
		let token = getCustom(`EXHORT_${vendor.replace("-","_").toUpperCase()}_TOKEN`, null, opts);
		if (token) {
			headers[`ex-${vendor}-token`] = token
		}
		let user = getCustom(`EXHORT_${vendor.replace("-","_").toUpperCase()}_USER`, null, opts);
		if (user) {
			headers[`ex-${vendor}-user`] = user
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
