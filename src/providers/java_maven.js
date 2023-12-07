import { XMLParser } from 'fast-xml-parser'
import { execSync } from "node:child_process"
import fs from 'node:fs'
import { getCustomPath } from "../tools.js";
import os from 'node:os'
import path from 'node:path'
import Sbom from '../sbom.js'
import {PackageURL} from 'packageurl-js'
import  {EOL} from 'os'

export default { isSupported, provideComponent, provideStack }

/** @typedef {import('../provider').Provider} */

/** @typedef {import('../provider').Provided} Provided */

/** @typedef {{name: string, version: string}} Package */

/** @typedef {{groupId: string, artifactId: string, version: string, scope: string, ignore: boolean}} Dependency */

/**
 * @type {string} ecosystem for maven-maven is 'maven'
 * @private
 */
const ecosystem = 'maven'

/**
 * @param {string} manifestName - the subject manifest name-type
 * @returns {boolean} - return true if `pom.xml` is the manifest name-type
 */
function isSupported(manifestName) {
	return 'pom.xml' === manifestName
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
		content: createSbomStackAnalysis(manifest, opts),
		contentType: 'application/vnd.cyclonedx+json'
	}
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
		content: getSbomForComponentAnalysis(data, opts),
		contentType: 'application/vnd.cyclonedx+json'
	}
}

/**
 *
 * @param {String} dotGraphList Text graph String of the pom.xml manifest
 * @param {[String]} ignoredDeps List of ignored dependencies to be omitted from sbom
 * @return {String} formatted sbom Json String with all dependencies
 * @private
 */
function createSbomFileFromTextFormat(dotGraphList, ignoredDeps) {
	let lines = dotGraphList.split(EOL);
	// get root component
	let root = lines[0];
	let rootPurl = parseDep(root);
	let sbom = new Sbom();
	sbom.addRoot(rootPurl);
	parseDependencyTree(root, 0, lines.slice(1), sbom);
	return sbom.filterIgnoredDepsIncludingVersion(ignoredDeps).getAsJsonString();
}
const DEP_REGEX = /(([-a-zA-Z0-9._]{2,})|[0-9])/g
// const DEP_REGEX = /(?:([-a-zA-Z0-9._]+):([-a-zA-Z0-9._]+):[-a-zA-Z0-9._]+:([-a-zA-Z0-9._]+):[-a-zA-Z]+)/
// const ROOT_REGEX = /(?:([-a-zA-Z0-9._]+):([-a-zA-Z0-9._]+):[-a-zA-Z0-9._]+:([-a-zA-Z0-9._]+))/
const CONFLICT_REGEX = /.*omitted for conflict with (\S+)\)/

/**
 * Recursively populates the SBOM instance with the parsed graph
 * @param {string} src - Source dependency to start the calculations from
 * @param {number} srcDepth - Current depth in the graph for the given source
 * @param {Array} lines - Array containing the text files being parsed
 * @param {Sbom} sbom - The SBOM where the dependencies are being added
 * @private
 */
function parseDependencyTree(src, srcDepth, lines, sbom) {
	if(lines.length === 0) {
		return;
	}
	if((lines.length === 1 && lines[0].trim() === "")) {
		return;
	}
	let index = 0;
	let target = lines[index];
	let targetDepth = getDepth(target);
	while(targetDepth > srcDepth && index < lines.length) {
		if(targetDepth === srcDepth + 1) {
			let from = parseDep(src);
			let to = parseDep(target);
			sbom.addDependency(sbom.purlToComponent(from), to)
		} else {
			parseDependencyTree(lines[index-1], getDepth(lines[index-1]), lines.slice(index), sbom)
		}
		target = lines[++index];
		targetDepth = getDepth(target);
	}
}

/**
 * Calculates how deep in the graph is the given line
 * @param {string} line - line to calculate the depth from
 * @returns {number} The calculated depth
 * @private
 */
function getDepth(line) {
	if(line === undefined) {
		return -1;
	}
	return ((line.indexOf('-') - 1) / 3) + 1;
}

/**
 * Create a PackageURL from any line in a Text Graph dependency tree for a manifest path.
 * @param {string} line - line to parse from a dependencies.txt file
 * @returns {PackageURL} The parsed packageURL
 * @private
 */
function parseDep(line) {

	let match = line.match(DEP_REGEX);
	if(!match) {
		throw new Error(`Unable generate SBOM from dependency tree. Line: ${line} cannot be parsed into a PackageURL`);
	}
	let version
	if(match.length >=5 && ['compile','provided','runtime'].includes(match[5])) {
		version = `${match[4]}-${match[3]}`
	}
	else {
		version = match[3]
	}
	let override = line.match(CONFLICT_REGEX);
	if (override) {
		version = override[1];
	}
	return toPurl(match[0], match[1], version);
}

/**
 * Create a Dot Graph dependency tree for a manifest path.
 * @param {string} manifest - path for pom.xml
 * @param {{}} [opts={}] - optional various options to pass along the application
 * @returns {string} the Dot Graph content
 * @private
 */
function createSbomStackAnalysis(manifest, opts = {}) {
	// get custom maven path
	let mvn = getCustomPath('mvn', opts)
	// verify maven is accessible
	execSync(`${mvn} --version`, err => {
		if (err) {
			throw new Error('mvn is not accessible')
		}
	})
	// clean maven target
	execSync(`${mvn} -q clean -f ${manifest}`, err => {
		if (err) {
			throw new Error('failed cleaning maven target')
		}
	})
	// create dependency graph in a temp file
	let tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'exhort_'))
	let tmpDepTree = path.join(tmpDir, 'mvn_deptree.txt')
	// build initial command (dot outputType is not available for verbose mode)
	let depTreeCmd = `${mvn} -q org.apache.maven.plugins:maven-dependency-plugin:3.6.0:tree -Dverbose -DoutputType=text -Dscope=compile -Dscope=runtime -DoutputFile=${tmpDepTree} -f ${manifest}`
	// exclude ignored dependencies, exclude format is groupId:artifactId:scope:version.
	// version and scope are marked as '*' if not specified (we do not use scope yet)
	let ignoredDeps = new Array()
	getDependencies(manifest).forEach(dep => {
		if (dep.ignore) {
			depTreeCmd += ` -Dexcludes=${dep['groupId']}:${dep['artifactId']}:${dep['scope']}:${dep['version']}`
			ignoredDeps.push(toPurl(dep.groupId,dep.artifactId,dep.version).toString())
		}
	})
	// execute dependency tree command
	execSync(depTreeCmd, err => {
		if (err) {
			throw new Error('failed creating maven dependency tree')
		}
	})
	// read dependency tree from temp file
	let content= fs.readFileSync(`${tmpDepTree}`)
	if(process.env["EXHORT_DEBUG"] === "true") {
		console.log("Dependency tree that will be used as input for creating the BOM =>" + EOL + EOL + content.toString())
	}
	let sbom = createSbomFileFromTextFormat(content.toString(),ignoredDeps);
	// delete temp file and directory
	fs.rmSync(tmpDir, {recursive: true, force: true})
	// return dependency graph as string
	return sbom
}

/**
 * Create a dependency list for a manifest content.
 * @param {string} data - content of pom.xml
 * @param {{}} [opts={}] - optional various options to pass along the application
 * @returns {[Dependency]} the Dot Graph content
 * @private
 */
function getSbomForComponentAnalysis(data, opts = {}) {
	// get custom maven path
	let mvn = getCustomPath('mvn', opts)
	// verify maven is accessible
	execSync(`${mvn} --version`, err => {
		if (err) {
			throw new Error('mvn is not accessible')
		}
	})
	// create temp files for pom and effective pom
	let tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'exhort_'))
	let tmpEffectivePom = path.join(tmpDir, 'effective-pom.xml')
	let tmpTargetPom = path.join(tmpDir, 'target-pom.xml')
	// write target pom content to temp file
	fs.writeFileSync(tmpTargetPom, data)
	// create effective pom and save to temp file
	execSync(`${mvn} -q help:effective-pom -Doutput=${tmpEffectivePom} -f ${tmpTargetPom}`, err => {
		if (err) {
			throw new Error('failed creating maven effective pom')
		}
	})
	// iterate over all dependencies in original pom and collect all ignored ones
	let ignored = getDependencies(tmpTargetPom).filter(d => d.ignore)
	// iterate over all dependencies and create a package for every non-ignored one
	/** @type [Dependency] */
	let dependencies = getDependencies(tmpEffectivePom)
		.filter(d => !(dependencyIn(d, ignored)) && !(dependencyInExcludingVersion(d, ignored)))
	let sbom = new Sbom();
	let rootDependency = getRootFromPom(tmpTargetPom);
	let purlRoot = toPurl(rootDependency.groupId,rootDependency.artifactId,rootDependency.version)
	sbom.addRoot(purlRoot)
	let rootComponent = sbom.getRoot();
	dependencies.forEach(dep => {
		let currentPurl = toPurl(dep.groupId,dep.artifactId,dep.version)
		sbom.addDependency(rootComponent,currentPurl)
	})
	// delete temp files and directory
	fs.rmSync(tmpDir, {recursive: true, force: true})
	// return dependencies list
	return sbom.getAsJsonString()
}




/**
 *
 * @param pom.xml manifest path
 * @return {Dependency} returns the root dependency for the pom
 * @private
 */
function getRootFromPom(manifest) {

	let parser = new XMLParser()
	let buf = fs.readFileSync(manifest)
	let pomStruct = parser.parse(buf.toString())
	let pomRoot = pomStruct['project'];
	/** @type Dependency */
	let rootDependency = {
		groupId: pomRoot['groupId'],
		artifactId: pomRoot['artifactId'],
		version: pomRoot['version'],
		scope: '*',
		ignore: false
	}
	return rootDependency
}

/**
 * Returns a PackageUrl For maven dependencies
 * @param group
 * @param artifact
 * @param version
 * @return {PackageURL}
 */
function toPurl(group,artifact,version)
{
	if(typeof version === "number")
	{
		version = version.toString()
	}
	return new PackageURL('maven',group,artifact,version,undefined,undefined);
}

/**
 * Get a list of dependencies with marking of dependencies commented with <!--exhortignore-->.
 * @param {string} manifest - path for pom.xml
 * @returns {[Dependency]} an array of dependencies
 * @private
 */
function getDependencies(manifest) {
	/** @type [Dependency] */
	let ignored = []
	// build xml parser with options
	let parser = new XMLParser({
		commentPropName: '#comment', // mark comments with #comment
		isArray: (_, jpath) => 'project.dependencies.dependency' === jpath // load deps as array
	})
	// read manifest pom.xml file into buffer
	let buf = fs.readFileSync(manifest)
	// parse manifest pom.xml to json
	let pomJson = parser.parse(buf.toString())
	// iterate over all dependencies and chery pick dependencies with a exhortignore comment
	pomJson['project']['dependencies']['dependency'].forEach(dep => {
		let ignore = false
		if (dep['#comment'] && dep['#comment'].includes('exhortignore')) { // #comment is an array or a string
			ignore = true
		}
		if(dep['scope'] !== 'test') {
			ignored.push({
				groupId: dep['groupId'],
				artifactId: dep['artifactId'],
				version: dep['version'] ? dep['version'].toString() : '*',
				scope: '*',
				ignore: ignore
			})
		}
	})
	// return list of dependencies
	return ignored
}

/**
 * Utility function for looking up a dependency in a list of dependencies ignoring the "ignored"
 * field
 * @param dep {Dependency} dependency to look for
 * @param deps {[Dependency]} list of dependencies to look in
 * @returns boolean true if found dep in deps
 * @private
 */
function dependencyIn(dep, deps) {
	return deps.filter(d => dep.artifactId === d.artifactId &&
		dep.groupId === d.groupId &&
		dep.version === d.version &&
		dep.scope === d.scope) .length > 0
}
function dependencyInExcludingVersion(dep, deps) {
	return deps.filter(d => dep.artifactId === d.artifactId &&
		dep.groupId === d.groupId &&
		dep.scope === d.scope) .length > 0
}
