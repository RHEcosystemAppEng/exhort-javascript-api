// import {exec} from "child_process";
import { execSync } from "node:child_process"
import fs from 'node:fs'
import os from "node:os";
import {EOL} from "os";
import {getCustom, getCustomPath, handleSpacesInPath} from "../tools.js";
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
	return `${handleSpacesInPath(goBin)} mod graph `;
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
 *
 * @param line one row from go.mod file
 * @return {boolean} whether line from go.mod should be considered as ignored or not
 */
function ignoredLine(line) {
	let result = false
	if(line.match(".*exhortignore.*"))
	{
		if(line.match(".+//\\s*exhortignore") || line.match(".+//\\sindirect (//)?\\s*exhortignore"))
		{
			let trimmedRow = line.trim()
			if(!trimmedRow.startsWith("module ") && !trimmedRow.startsWith("go ") && !trimmedRow.startsWith("require (") && !trimmedRow.startsWith("require(")
				&& !trimmedRow.startsWith("exclude ") && !trimmedRow.startsWith("replace ") && !trimmedRow.startsWith("retract ") && !trimmedRow.startsWith("use ")
				&& !trimmedRow.includes("=>"))
			{
				if( trimmedRow.startsWith("require ") || trimmedRow.match("^[a-z.0-9/-]+\\s{1,2}[vV][0-9]\\.[0-9](\\.[0-9]){0,2}.*"))
				{
					result = true
				}
			}
		}
	}
	return result
}

/**
 * extract package name from go.mod line that contains exhortignore comment.
 * @param line a row contains exhortignore as part of a comment
 * @return {string} the full package name + group/namespace + version
 * @private
 */
function extractPackageName(line) {
	let trimmedRow = line.trim();
	let firstRemarkNotationOccurrence = trimmedRow.indexOf("//");
	return trimmedRow.substring(0,firstRemarkNotationOccurrence).trim();
}

/**
 *
 * @param {string } manifest - path to manifest
 * @return {[PackageURL]} list of ignored dependencies d
 */
function getIgnoredDeps(manifest) {
	let goMod = fs.readFileSync(manifest).toString().trim()
	let lines = goMod.split(EOL);
	return lines.filter(line => ignoredLine(line)).map(line=> extractPackageName(line)).map(dep => toPurl(dep,/[ ]{1,3}/,undefined))
}

/**
 *
 * @param {[PackageURL]}allIgnoredDeps - list of purls of all dependencies that should be ignored
 * @param {PackageURL} purl object to be checked if needed to be ignored
 * @return {boolean}
 */
function dependencyNotIgnored(allIgnoredDeps, purl) {
	return allIgnoredDeps.find(element => element.toString() === purl.toString()) === undefined;
}

function enforceRemovingIgnoredDepsInCaseOfAutomaticVersionUpdate(ignoredDeps, sbom) {
	// In case there is a dependency commented with exhortignore , but it is still in the list of direct dependencies of root, then
	// the reason for that is that go mod graph changed automatically the version of package/module to different version, and because of
	// mismatch between the version in go.mod manifest and go mod graph, it wasn't delete ==> in this case need to remove from sbom according to name only.
	ignoredDeps.forEach(packageUrl => {
		if (sbom.checkIfPackageInsideDependsOnList(sbom.getRoot(), packageUrl.name)) {
			sbom.filterIgnoredDeps(ignoredDeps.filter(purl => purl.name === packageUrl.name).map(purl => purl.name))
		}
	})
}

/**
 *
 * @param {[string]} lines - array of lines of go.mod manifest
 * @param {string} goMod - content of go.mod manifest
 * @return {[string]} all dependencies from go.mod file as array
 */
function collectAllDepsFromManifest(lines, goMod) {
	let result
	// collect all deps that starts with require keyword

	result = lines.filter((line) => line.trim().startsWith("require") && !line.includes("(")).map((dep) => dep.substring("require".length).trim())



	// collect all deps that are inside `require` blocks
	let currentSegmentOfGoMod = goMod
	let requirePositionObject = decideRequireBlockIndex(currentSegmentOfGoMod)
	while(requirePositionObject.index > -1) {
		let depsInsideRequirementsBlock = currentSegmentOfGoMod.substring(requirePositionObject.index + requirePositionObject.startingOffeset).trim();
		let endOfBlockIndex = depsInsideRequirementsBlock.indexOf(")")
		let currentIndex = 0
		while(currentIndex < endOfBlockIndex)
		{
			let endOfLinePosition = depsInsideRequirementsBlock.indexOf(EOL, currentIndex);
			let dependency = depsInsideRequirementsBlock.substring(currentIndex, endOfLinePosition)
			result.push(dependency.trim())
			currentIndex = endOfLinePosition + 1
		}
		currentSegmentOfGoMod = currentSegmentOfGoMod.substring(endOfBlockIndex + 1).trim()
		requirePositionObject = decideRequireBlockIndex(currentSegmentOfGoMod)
	}

	function decideRequireBlockIndex(goMod) {
		let object = {}
		let index = goMod.indexOf("require(")
		object.startingOffeset = "require(".length
		if (index === -1)
		{
			index = goMod.indexOf("require (")
			object.startingOffeset = "require (".length
			if(index === -1)
			{
				index = goMod.indexOf("require  (")
				object.startingOffeset = "require  (".length
			}
		}
		object.index = index
		return object
	}
	return result
}

/**
 *
 * @param {string} rootElementName the rootElementName element of go mod graph, to compare only direct deps from go mod graph against go.mod manifest
 * @param{[string]} goModGraphOutputRows the goModGraphOutputRows from go mod graph' output
 * @param {string }manifest path to go.mod manifest on file system
 * @private
 */
function performManifestVersionsCheck(rootElementName, goModGraphOutputRows, manifest) {
	let goMod = fs.readFileSync(manifest).toString().trim()
	let lines = goMod.split(EOL);
	let comparisonLines = goModGraphOutputRows.filter((line)=> line.startsWith(rootElementName)).map((line)=> getChildVertexFromEdge(line))
	let manifestDeps = collectAllDepsFromManifest(lines,goMod)
	try {
		comparisonLines.forEach((dependency) => {
			let parts = dependency.split("@")
			let version = parts[1]
			let depName = parts[0]
			manifestDeps.forEach(dep => {
				let components = dep.trim().split(" ");
				let currentDepName = components[0]
				let currentVersion = components[1]
				if (currentDepName === depName) {
					if (currentVersion !== version) {
						throw new Error(`versions mismatch for dependency name ${depName}, manifest version=${currentVersion}, installed Version=${version}, if you want to allow version mismatch for analysis between installed and requested packages, set environment variable/setting - MATCH_MANIFEST_VERSIONS=false`)
					}
				}
			})
		})
	}
	catch(error) {
		console.error("Can't continue with analysis")
		throw error
	}
}

/**
 * Create SBOM json string for go Module.
 * @param {string} manifest - path for go.mod
 * @param {{}} [opts={}] - optional various options to pass along the application
 * @param {boolean} includeTransitive - whether the sbom should contain transitive dependencies of the main module or not.
 * @returns {string} the SBOM json content
 * @private
 */
function getSBOM(manifest, opts = {}, includeTransitive) {
	// get custom goBin path
	let goBin = getCustomPath('go', opts)
	// verify goBin is accessible
	execSync(`${handleSpacesInPath(goBin)} version`, err => {
		if (err) {
			throw new Error('go binary is not accessible')
		}
	})
	let manifestDir = path.dirname(manifest)
	let goGraphCommand = getGoGraphCommand(goBin)
	let options = {cwd: manifestDir}
	let goGraphOutput
	goGraphOutput = getGoModGraph(goGraphCommand, options);
	let ignoredDeps = getIgnoredDeps(manifest);
	let allIgnoredDeps = ignoredDeps.map((dep) => dep.toString())
	let sbom = new Sbom();
	let rows = goGraphOutput.split(EOL);
	let root = getParentVertexFromEdge(rows[0])
	let matchManifestVersions = getCustom("MATCH_MANIFEST_VERSIONS","false",opts);
	if(matchManifestVersions === "true") {
		{
			performManifestVersionsCheck(root, rows, manifest)
		}
	}
	let mainModule = toPurl(root, "@", undefined)
	sbom.addRoot(mainModule)
	let exhortGoMvsLogicEnabled = getCustom("EXHORT_GO_MVS_LOGIC_ENABLED","false",opts)
	if(includeTransitive && exhortGoMvsLogicEnabled === "true")
	{
		rows = getFinalPackagesVersionsForModule(rows,manifest,goBin)
	}
	if (includeTransitive) {
		let sourceComponent
		let currentParent = ""
		let source;
		let rowsWithoutBlankRows = rows.filter(row => row.trim() !== "")
		rowsWithoutBlankRows.forEach(row => {
			if (getParentVertexFromEdge(row) !== currentParent) {
				currentParent = getParentVertexFromEdge(row)
				source = toPurl(currentParent, "@", undefined);
				sourceComponent = sbom.purlToComponent(source);
			}
			let target = toPurl(getChildVertexFromEdge(row), "@", undefined);
			sbom.addDependency(sourceComponent, target)

		})
		// at the end, filter out all ignored dependencies including versions.
		sbom.filterIgnoredDepsIncludingVersion(allIgnoredDeps)
		enforceRemovingIgnoredDepsInCaseOfAutomaticVersionUpdate(ignoredDeps, sbom);
	} else {
		let directDependencies = rows.filter(row => row.startsWith(root));
		directDependencies.forEach(pair => {
			let dependency = getChildVertexFromEdge(pair)
			let depPurl = toPurl(dependency, "@", undefined);
			let mainModuleComponent = sbom.purlToComponent(mainModule);
			if(dependencyNotIgnored(ignoredDeps, depPurl)) {
				sbom.addDependency(mainModuleComponent, depPurl)
			}
		})
		enforceRemovingIgnoredDepsInCaseOfAutomaticVersionUpdate(ignoredDeps,sbom)
	}

	return sbom.getAsJsonString(opts)
}


/**
 * Utility function for creating Purl String

 * @param {string }dependency the name of the artifact, can include a namespace(group) or not - namespace/artifactName.
 * @param {RegExp} delimiter delimiter between name of dependency and version
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
		pkg = new PackageURL(ecosystem,undefined,splitParts[0],splitParts[1],qualifiers,undefined)
	}
	else
	{
		let namespace = dependency.slice(0,lastSlashIndex)
		let dependencyAndVersion = dependency.slice(lastSlashIndex+1)
		let parts = dependencyAndVersion.split(delimiter);
		if(parts.length === 2 )
		{
			pkg = new PackageURL(ecosystem,namespace,parts[0],parts[1],qualifiers,undefined);
		}
		else
		{
			pkg = new PackageURL(ecosystem,namespace,parts[0],defaultMainModuleVersion,qualifiers,undefined);
		}
	}
	return pkg
}

/** This function gets rows from go mod graph , and go.mod graph, and selecting for all
 * packages the has more than one minor the final versions as selected by golang MVS algorithm.
 * @param {[string]}rows all the rows from go modules dependency tree
 * @param {string} manifestPath the path of the go.mod file
 * @param {string} path to go binary
 * @return {[string]} rows that contains final versions.
 */
function getFinalPackagesVersionsForModule(rows,manifestPath,goBin) {
	let manifestDir = path.dirname(manifestPath)
	let options = {cwd: manifestDir}
	execSync(`${handleSpacesInPath(goBin)} mod download`, options)
	let finalVersionsForAllModules = execSync(`${handleSpacesInPath(goBin)} list -m all`, options).toString()
	let finalVersionModules = new Map()
	finalVersionsForAllModules.split(EOL).filter(string => string.trim()!== "")
		.filter(string => string.trim().split(" ").length === 2)
		.forEach((dependency) => {
			let dep = dependency.split(" ")
			finalVersionModules[dep[0]] = dep[1]
		})
	let finalVersionModulesArray = new Array()
	rows.filter(string => string.trim()!== "").forEach( module => {
		let child = getChildVertexFromEdge(module)
		let parent = getParentVertexFromEdge(module)
		let parentName = getPackageName(parent)
		let childName = getPackageName(child)
		let parentFinalVersion = finalVersionModules[parentName]
		let childFinalVersion =  finalVersionModules[childName]
		// if this condition will be uncommented, there will be several differences between sbom and go list -m all listing...
		// let parentOriginalVersion = getVersionOfPackage(parent)
		// if( parentOriginalVersion !== undefined && parentOriginalVersion === parentFinalVersion) {
		if (parentName !== parent) {
			finalVersionModulesArray.push(`${parentName}@${parentFinalVersion} ${childName}@${childFinalVersion}`)
		} else {
			finalVersionModulesArray.push(`${parentName} ${childName}@${childFinalVersion}`)
		}
		// }
	})

	return finalVersionModulesArray
}

/**
 *
 * @param {string} fullPackage - full package with its name and version
 * @return -{string} package name only
 * @private
 */
function getPackageName(fullPackage) {
	return fullPackage.split("@")[0]
}

// /**
//  *
//  * @param {string} fullPackage - full package with its name and version-
//  * @return {string} package version only
//  */
// function getVersionOfPackage(fullPackage) {
// 	return fullPackage.split("@")[1]
// }
