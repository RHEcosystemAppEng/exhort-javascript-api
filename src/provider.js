import javascriptNpmProvider from './providers/javascript_npm.js'
import golangGomodulesProvider from './providers/golang_gomodules.js'
import pythonPipProvider from './providers/python_pip.js'
import path from 'node:path'
import Java_maven from "./providers/java_maven.js";
import Java_gradle from "./providers/java_gradle.js";

/** @typedef {{ecosystem: string, contentType: string, content: string}} Provided */
/** @typedef {{isSupported: function(string): boolean, provideComponent: function(string, {}): Provided, provideStack: function(string, {}): Provided}} Provider */

/**
 * MUST include all providers here.
 * @type {[Provider]}
 */
export const availableProviders = [new Java_maven(),new Java_gradle(),javascriptNpmProvider,golangGomodulesProvider,pythonPipProvider]

/**
 * Match a provider from a list or providers based on file type.
 * Each provider MUST export 'isSupported' taking a file name-type and returning true if supported.
 * Each provider MUST export 'provideComponent' taking manifest data returning a {@link Provided}.
 * Each provider MUST export 'provideStack' taking manifest path returning a {@link Provided}.
 * @param {string} manifest - the name-type or path of the manifest
 * @param {[Provider]} providers - list of providers to iterate over
 * @returns {Provider}
 * @throws {Error} when the manifest is not supported and no provider was matched
 */
export function match(manifest, providers) {
	let manifestPath = path.parse(manifest)
	let provider = providers.find(prov => prov.isSupported(manifestPath.base))
	if (provider) {
		return provider
	}
	throw new Error(`${manifestPath.base} is not supported`)
}
