import { availableProviders, match } from './provider.js'
// import {AnalysisReport} from '../generated/backend/AnalysisReport.js'
import analysis from './analysis.js'
import fs from 'node:fs'
import {getCustom} from "./tools.js";

export default { componentAnalysis, stackAnalysis }

/**
 * @type {string} backend url to send requests to
 * @private
 */
const url = getCustom(
	'EXHORT_BACKEND_URL',
	'http://dev-exhort.apps.cn-lab2-eu.lue0.p1.openshiftapps.com'
)

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
 * @throws {Error} if o matching provider, failed to get create content, or backend request failed
 */
async function componentAnalysis(manifestType, data, opts = {}) {
	let provider = match(manifestType, availableProviders) // throws error if no matching provider
	return await analysis.requestComponent(provider, data, url, opts) // throws error request sending failed
}
