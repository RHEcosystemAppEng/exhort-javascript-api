import { availableProviders, match } from './provider.js'
import {AnalysisReport} from '../generated/backend/AnalysisReport.js'
import analysis from './analysis.js'
import fs from 'node:fs'
import {getCustom} from "./tools.js";

export default { AnalysisReport, componentAnalysis, stackAnalysis, validateToken }

export const exhortDevDefaultUrl = 'http://alpha-exhort.apps.sssc-cl01.appeng.rhecoeng.com';


export const exhortDefaultUrl = "https://rhda.rhcloud.com";



/** This function is used to determine exhort url backend according to the following logic:
 * If EXHORT_DEV_MODE = true, then take the value of the EXHORT BACKEND URL of dev/staging environment in such a way:
 * take it as environment variable if exists, otherwise, take it from opts object if exists, otherwise, use the hardcoded default of DEV environment.
 * If EXHORT_DEV_MODE = false , then select the production url of EXHORT Backend, which is hardcoded.
 * EXHORT_DEV_MODE evaluated in the following order and selected when it finds it first:
 * 1. Environment Variable
 * 2. (key,value) from opts object
 * 3. Default False ( points to production URL )
 * @param {{}} [opts={}] - optional various options to override default EXHORT_DEV_MODE and DEV_EXHORT_BACKEND_URL.
 * @return {string} - The selected exhort backend
 * @private
 */
function selectExhortBackend(opts= {}) {
	let result
	let exhortDevModeBundled = "false"
	let exhortDevMode = getCustom("EXHORT_DEV_MODE",exhortDevModeBundled,opts)
	if(exhortDevMode !== null && exhortDevMode.toString() === "true") {
		result = getCustom('DEV_EXHORT_BACKEND_URL',exhortDevDefaultUrl,opts);
	}
	else
	{
		result = exhortDefaultUrl
	}
	return result;
}

/**
 *
 * @param opts
 * @return {string}
 */
export function testSelectExhortBackend(opts)
{
	return selectExhortBackend(opts)
}

/**
 * @type {string} backend url to send requests to
 * @private
 */
let url

/**
 * Get stack analysis report for a manifest file.
 * @param {string} manifest - path for the manifest
 * @param {boolean} [html=false] - true will return a html string, false will return AnalysisReport
 * @param {{}} [opts={}] - optional various options to pass along the application
 * @returns {Promise<string|AnalysisReport>}
 * @throws {Error} if manifest inaccessible, no matching provider, failed to get create content,
 * 		or backend request failed
 */
async function stackAnalysis(manifest, html = false, opts = {}) {
	url = selectExhortBackend(opts)
	fs.accessSync(manifest, fs.constants.R_OK) // throws error if file unreadable
	let provider = match(manifest, availableProviders) // throws error if no matching provider
	return await analysis.requestStack(provider, manifest, url, html, opts) // throws error request sending failed
}

/**
 * Get component analysis report for a manifest content.
 * @param {string} manifestType - the name and type of the manifest
 * @param {string} data - the content of the manifest
 * @param {{}} [opts={}] - optional various options to pass along the application
 * @returns {Promise<AnalysisReport>}
 * @throws {Error} if no matching provider, failed to get create content, or backend request failed
 */
async function componentAnalysis(manifestType, data, opts = {}) {
	url = selectExhortBackend(opts)
	let provider = match(manifestType, availableProviders) // throws error if no matching provider
	return await analysis.requestComponent(provider, data, url, opts) // throws error request sending failed
}

async function validateToken(opts = {}) {
	url = selectExhortBackend(opts)
	return await analysis.validateToken(url, opts) // throws error request sending failed
}
