import { execSync } from "node:child_process"
import fs from 'node:fs'
import os from "node:os";
import { getCustomPath, handleSpacesInPath } from "../tools.js";
import path from 'node:path'
import Sbom from '../sbom.js'
import {PackageURL} from 'packageurl-js'

export var npmInteractions = {
	listing: function runNpmListing(npmListing) {
		let npmOutput = execSync(npmListing, err => {
			if (err) {
				throw new Error('failed to get npmOutput json from npm')
			}
		});
		return npmOutput;
	},
	version: function checkNpmVersion(npm) {
		execSync(`${npm} --version`, err => {
			if (err) {
				throw new Error('npm is not accessible')
			}
		})
	},
	createPackageLock: function createPackageLock(npm, manifestDir) {
		execSync(`${npm} i --package-lock-only --prefix ${handleSpacesInPath(manifestDir)}`, err => {
			if (err) {
				throw new Error('failed to create npmOutput list')
			}
		})
	}
}
export default { isSupported, provideComponent, provideStack, npmInteractions }

/** @typedef {import('../provider').Provider} */

/** @typedef {import('../provider').Provided} Provided */

/** @typedef {{name: string, version: string}} Package */

/** @typedef {{groupId: string, artifactId: string, version: string, scope: string, ignore: boolean}} Dependency */

/**
 * @type {string} ecosystem for npm-npm is 'maven'
 * @private
 */
const ecosystem = 'npm'
const defaultVersion = 'v0.0.0'

/**
 * @param {string} manifestName - the subject manifest name-type
 * @returns {boolean} - return true if `pom.xml` is the manifest name-type
 */
function isSupported(manifestName) {
	return 'package.json' === manifestName
}

/**
 * Provide content and content type for maven-maven stack analysis.
 * @param {string} manifest - the manifest path or name
 * @param {{}} [opts={}] - optional various options to pass along the application
 * @returns {Provided}
 */
function provideStack(manifest, opts = {}) {
	return {
		ecosystem,
		content: getSBOM(manifest, opts, true),
		contentType: 'application/vnd.cyclonedx+json'
	}
}

function getComponent(data, opts) {
	let tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'exhort_'))
	let tmpPackageJson = path.join(tmpDir, 'package.json')
	fs.writeFileSync(tmpPackageJson, data)
	let sbom = getSBOM(tmpPackageJson,opts,false);
	fs.rmSync(tmpDir, {recursive: true, force: true})
	return sbom

}

/**
 * Provide content and content type for maven-maven component analysis.
 * @param {string} data - content of pom.xml for component report
 * @param {{}} [opts={}] - optional various options to pass along the application
 * @returns {Provided}
 */
function provideComponent(data, opts = {}) {
	return {
		ecosystem,
		content: getComponent(data,opts),
		contentType: 'application/vnd.cyclonedx+json'
	}
}


function getNpmListing(npm, allFilter, manifestDir) {
	return `${npm} ls${allFilter} --omit=dev --package-lock-only --json --prefix ${manifestDir}`;
}







/**
 * Create SBOM json string for npm Package.
 * @param {string} manifest - path for package.json
 * @param {{}} [opts={}] - optional various options to pass along the application
 * @returns {string} the SBOM json content
 * @private
 */
function getSBOM(manifest, opts = {}, includeTransitive) {
	// get custom npm path
	let npm = getCustomPath('npm', opts)
	// verify npm is accessible
	npmInteractions.version(npm);
	let manifestDir = path.dirname(manifest)
	npmInteractions.createPackageLock(npm, manifestDir);
	let allFilter = includeTransitive? " --all" : ""
	let npmListing = getNpmListing(npm, allFilter, handleSpacesInPath(manifestDir))
	let npmOutput = npmInteractions.listing(npmListing);
	let depsObject = JSON.parse(npmOutput);
	let rootName = depsObject["name"]
	let rootVersion = depsObject["version"]
	if(!rootVersion) {
		rootVersion = defaultVersion
	}
	let mainComponent = toPurl(rootName,rootVersion);

	let sbom = new Sbom();
	sbom.addRoot(mainComponent)

	let dependencies = depsObject["dependencies"];
	addAllDependencies(sbom,sbom.getRoot(),dependencies)
	let packageJson = fs.readFileSync(manifest).toString()
	let packageJsonObject = JSON.parse(packageJson);
	if(packageJsonObject.exhortignore !== undefined) {
		let ignoredDeps = Array.from(packageJsonObject.exhortignore);
		sbom.filterIgnoredDeps(ignoredDeps)
	}
	return sbom.getAsJsonString()
}




/**
 * Utility function for creating Purl String

 * @param name the name of the artifact, can include a namespace(group) or not - namespace/artifactName.
 * @param version the version of the artifact
 * @private
 * @returns {PackageURL|null} PackageUrl Object ready to be used in SBOM
 */
function toPurl(name, version) {
	let parts = name.split("/");
	var pkg
	if(parts.length === 2 )
	{
		pkg = new PackageURL('npm',parts[0],parts[1],version,undefined,undefined);
	}
	else
	{
		pkg = new PackageURL('npm',undefined,parts[0],version,undefined,undefined);
	}
	return pkg
}

/**
 * This function recursively build the Sbom from the JSON that npm listing returns
 * @param sbom this is the sbom object
 * @param from this is the current component in bom (Should start with root/main component of SBOM) for which we want to add all its dependencies.
 * @param dependencies the current dependency list (initially it's the list of the root component)
 * @private
 */
function addAllDependencies(sbom, from, dependencies) {
	Object.entries(dependencies)
		.filter(entry => entry[1].version !== undefined)
		.forEach(entry => {
			let name, artifact ;
			[name, artifact] = entry;
			let purl = toPurl(name,artifact.version);
			sbom.addDependency(from,purl)
			let transitiveDeps = artifact.dependencies
			if(transitiveDeps !== undefined)
			{
				addAllDependencies(sbom,sbom.purlToComponent(purl),transitiveDeps)
			}
		});

}
