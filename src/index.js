import { availableProviders, match } from './provider.js'
import {AnalysisReport} from '../generated/backend/AnalysisReport.js'
import analysis from './analysis.js'
import fs from 'node:fs'

export default { AnalysisReport, componentAnalysis, stackAnalysis }

/**
 * @type {string} backend url to send requests to
 * @private
 */
const url = process.env.CRDA_BACKEND_URL ?
	process.env.CRDA_BACKEND_URL :
	'http://crda-backend-crda.apps.sssc-cl01.appeng.rhecoeng.com/api/v3'

/**
 * Get stack analysis report for a manifest file.
 * @param {string} manifest - path for the manifest
 * @param {boolean} [html=false] - true will return a html string, false will return AnalysisReport
 * @returns {Promise<string|AnalysisReport>}
 * @throws {Error} if manifest inaccessible, no matching provider, failed to get create content,
 * 		or backend request failed
 */
async function stackAnalysis(manifest, html = false) {
	fs.accessSync(manifest, fs.constants.R_OK) // throws error if file unreadable
	let provider = match(manifest, availableProviders) // throws error if no matching provider
	return await analysis.requestStack(provider, manifest, url, html) // throws error request sending failed
}

/**
 * Get component analysis report for a manifest content.
 * @param {string} manifestType - the name and type of the manifest
 * @param {string} data - the content of the manifest
 * @returns {Promise<AnalysisReport>}
 * @throws {Error} if o matching provider, failed to get create content, or backend request failed
 */
async function componentAnalysis(manifestType, data) {
	let provider = match(manifestType, availableProviders) // throws error if no matching provider
	return await analysis.requestComponent(provider, data, url) // throws error request sending failed
}
