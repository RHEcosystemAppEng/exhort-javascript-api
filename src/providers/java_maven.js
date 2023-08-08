import { XMLParser } from 'fast-xml-parser'
import { execSync } from "node:child_process"
import fs from 'node:fs'
import { getCustomPath } from "../tools.js";
import os from 'node:os'
import path from 'node:path'
import Sbom from '../sbom.js'
import {PackageURL} from 'packageurl-js'

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
 * convert a dog graph dependency into a Package URL Object.
 * @param {string} root one dependency from one line of a dot graph
 * @return {PackageURL} returns package URL of the artifact
 * @private
 */
function dotGraphToPurl(root) {
	let parts = root.split(":")
	let group = parts[0].replaceAll("\"","")
	let name = parts[1]
	let version = parts[3].replaceAll("\"","")
	return new PackageURL('maven',group,name,version,undefined,undefined);


}

/**
 *
 * @param {String} dotGraphList Dot Graph tree String of the pom.xml manifest
 * @return {String} formatted sbom Json String with all dependencies
 * @private
 */
function createSbomFileFromDotGraphFormat(dotGraphList) {
	// get root component
	let lines = dotGraphList.replaceAll(";","").split('\n');
	let root = lines[0].split("\"")[1];
	let rootPurl = dotGraphToPurl(root);
	lines.splice(0,1);
	let sbom = new Sbom()
	sbom.addRoot(rootPurl)
	lines.forEach(pair => {
		if(pair.trim() !== "}") {
			let thePair = pair.split("->")
			if(thePair.length === 2) {
				let from = dotGraphToPurl(thePair[0].trim())
				let to = dotGraphToPurl(thePair[1].trim())
				sbom.addDependency(sbom.purlToComponent(from), to)
			}
		}
	})
	return sbom.getAsJsonString()
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
	// build initial command
	let depTreeCmd = `${mvn} -q dependency:tree -DoutputType=dot -DoutputFile=${tmpDepTree} -f ${manifest}`
	// exclude ignored dependencies, exclude format is groupId:artifactId:scope:version.
	// version and scope are marked as '*' if not specified (we do not use scope yet)
	getDependencies(manifest).forEach(dep => {
		if (dep.ignore) {
			depTreeCmd += ` -Dexcludes=${dep['groupId']}:${dep['artifactId']}:${dep['scope']}:${dep['version']}`
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
	let sbom = createSbomFileFromDotGraphFormat(content.toString());
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
		ignored.push({
			groupId: dep['groupId'],
			artifactId: dep['artifactId'],
			version: dep['version'] ? dep['version'] : '*',
			scope: '*',
			ignore: ignore
		})
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
