import {exec} from "child_process";
import { execSync } from "node:child_process"
import fs from 'node:fs'
import os from "node:os";
import {EOL} from "os";
import { getCustomPath } from "../tools.js";
import path from 'node:path'
import Sbom from '../sbom.js'
import {PackageURL} from 'packageurl-js'

export default { isSupported, provideComponent, provideStack }

/** @typedef {import('../provider').Provider} */

/** @typedef {import('../provider').Provided} Provided */

/** @typedef {{name: string, version: string}} Package */

/** @typedef {{groupId: string, artifactId: string, version: string, scope: string, ignore: boolean}} Dependency */

/**
 * @type {string} ecosystem for npm-npm is 'maven'
 * @private
 */
const ecosystem = 'golang'
const defaultMainModuleVersion = "v0.0.0";
/**
 * @param {string} manifestName - the subject manifest name-type
 * @returns {boolean} - return true if `pom.xml` is the manifest name-type
 */
function isSupported(manifestName) {
	return 'go.mod' === manifestName
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
	let tmpGoMod = path.join(tmpDir, 'go.mod')
	fs.writeFileSync(tmpGoMod, data)
	let sbom = getSBOM(tmpGoMod,opts,false);
	fs.rmSync(tmpDir, {recursive: true, force: true})
	return sbom

}

/**
 * Provide content and content type for maven-maven component analysis.
 * @param {string} data - content of go.mod for component report
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


function getGoGraphCommand(goBin) {
	return `${goBin} mod graph `;
}

/**
 *
 * @param {string} edge containing an edge of direct graph of source dependency (parent) and target dependency (child)
 * @return {string} the parent (source) dependency
 */
function getParentVertexFromEdge(edge) {
	return edge.split(" ")[0];
}
/**
 *
 * @param {string} edge containing an edge of direct graph of source dependency (parent) and target dependency (child)
 * @return {string} the child (target) dependency
 */
function getChildVertexFromEdge(edge) {
	return edge.split(" ")[1];
}


function getGoModGraph(goGraphCommand, options) {
	return execSync(goGraphCommand, options).toString()
	//
	// let result = ""
	// return new Promise((resolveF => {
	// 	child.stdout.on("data", (x) => result+=x)
	// 	child.stderr.on("data", (x) => result+=x)
	// 	child.on("exit", () => resolveF(result))
	// }))
}

/**
 * Create SBOM json string for go Module.
 * @param {string} manifest - path for go.mod
 * @param {{}} [opts={}] - optional various options to pass along the application
 * @returns {string} the SBOM json content
 * @private
 */
function getSBOM(manifest, opts = {}, includeTransitive) {
	// get custom goBin path
	let goBin = getCustomPath('go', opts)
	// verify goBin is accessible
	execSync(`${goBin} version`, err => {
		if (err) {
			throw new Error('go binary is not accessible')
		}
	})
	let manifestDir = path.dirname(manifest)
	let goGraphCommand = getGoGraphCommand(goBin)
	let options = {cwd: manifestDir}
	let goGraphOutput
	goGraphOutput = getGoModGraph(goGraphCommand, options);

	let sbom = new Sbom();
	let rows = goGraphOutput.split(EOL);
	let root = getParentVertexFromEdge(rows[0])
	let mainModule = toPurl(root, "@", {})
	sbom.addRoot(mainModule)


	if (includeTransitive) {
		let sourceComponent
		let currentParent = ""
		rows.filter(row => row.trim() !== "").forEach(row => {
			if (getParentVertexFromEdge(row) !== currentParent) {
				currentParent = getParentVertexFromEdge(row)
				let source = toPurl(currentParent, "@", {})
				sourceComponent = sbom.purlToComponent(source);
			}
			let target = toPurl(getChildVertexFromEdge(row), "@", {});
			sbom.addDependency(sourceComponent, target)
		})
	} else {
		let directDependencies = rows.filter(row => row.startsWith(root));
		directDependencies.forEach(pair => {
			let dependency = getChildVertexFromEdge(pair)
			let depPurl = toPurl(dependency, "@", {});
			let mainModuleComponent = sbom.purlToComponent(mainModule);
			sbom.addDependency(mainModuleComponent, depPurl)
		})
	}

	return sbom.getAsJsonString()
}


/**
 * Utility function for creating Purl String

 * @param {string }dependency the name of the artifact, can include a namespace(group) or not - namespace/artifactName.
 * @param {string} delimiter delimiter between name of dependency and version
 * @param { object } qualifiers - contains key values related to the go environment
 * @private
 * @returns {PackageURL|null} PackageUrl Object ready to be used in SBOM
 */
function toPurl(dependency, delimiter, qualifiers) {
	let lastSlashIndex = dependency.lastIndexOf("/");
	let pkg
	if (lastSlashIndex === -1)
	{
		let splitParts = dependency.split(delimiter);
		pkg = new PackageURL(ecosystem,undefined,splitParts[0],splitParts[1],undefined,undefined)
	}
	else
	{
		let namespace = dependency.slice(0,lastSlashIndex)
		let dependencyAndVersion = dependency.slice(lastSlashIndex+1)
		let parts = dependencyAndVersion.split(delimiter);
		if(parts.length === 2 )
		{
			pkg = new PackageURL(ecosystem,namespace,parts[0],parts[1],undefined,undefined);
		}
		else
		{
			pkg = new PackageURL(ecosystem,namespace,parts[0],defaultMainModuleVersion,undefined,undefined);
		}
	}
	return pkg
}

