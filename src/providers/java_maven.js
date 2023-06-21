import { XMLParser } from 'fast-xml-parser'
import { execSync } from "node:child_process"
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

export default { isSupported, provideComponent, provideStack }

/** @typedef {import('../provider').Provider} */

/** @typedef {import('../provider').Provided} Provided */

/** @typedef {{name: string, version: string}} Package */

/** @typedef {{groupId: string, artifactId: string, version: string, scope: string, ignore: boolean}} Dependency */

/**
 * @type {string} ecosystem for java-maven is 'maven'
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
 * Provide content and content type for java-maven stack analysis.
 * @param {string} manifest - the manifest path or name
 * @returns {Provided}
 */
function provideStack(manifest) {
	return {
		ecosystem,
		content: getGraph(manifest),
		contentType: 'text/vnd.graphviz'
	}
}

/**
 * Provide content and content type for java-maven component analysis.
 * @param {string} data - content of pom.xml for component report
 * @returns {Provided}
 */
function provideComponent(data) {
	return {
		ecosystem,
		content: JSON.stringify(getList(data)),
		contentType: 'application/json'
	}
}

/**
 * Create a Dot Graph dependency tree for a manifest path.
 * @param {string} manifest - path for pom.xml
 * @returns {string} the Dot Graph content
 * @private
 */
function getGraph(manifest) {
	// verify maven is accessible
	execSync('mvn --version', err => {
		if (err) {
			throw new Error('mvn is not accessible')
		}
	})
	// clean maven target
	execSync(`mvn -q clean -f ${manifest}`, err => {
		if (err) {
			throw new Error('failed cleaning maven target')
		}
	})
	// create dependency graph in a temp file
	let tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'crda_'))
	let tmpDepTree = path.join(tmpDir, 'mvn_deptree.txt')
	// build initial command
	let depTreeCmd = `mvn -q dependency:tree -DoutputType=dot -DoutputFile=${tmpDepTree} -f ${manifest}`
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
	// delete temp file and directory
	fs.rmSync(tmpDir, {recursive: true, force: true})
	// return dependency graph as string
	return content.toString()
}

/**
 * Create a dependency list for a manifest content.
 * @param {string} data - content of pom.xml
 * @returns {[Package]} the Dot Graph content
 * @private
 */
function getList(data) {
	// verify maven is accessible
	execSync('mvn --version', err => {
		if (err) {
			throw new Error('mvn is not accessible')
		}
	})
	// create temp files for pom and effective pom
	let tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'crda_'))
	let tmpEffectivePom = path.join(tmpDir, 'effective-pom.xml')
	let tmpTargetPom = path.join(tmpDir, 'target-pom.xml')
	// write target pom content to temp file
	fs.writeFileSync(tmpTargetPom, data)
	// create effective pom and save to temp file
	execSync(`mvn -q help:effective-pom -Doutput=${tmpEffectivePom} -f ${tmpTargetPom}`, err => {
		if (err) {
			throw new Error('failed creating maven effective pom')
		}
	})
	// iterate over all dependencies and create a package for every non-ignored one
	/** @type [Package] */
	let packages = getDependencies(tmpEffectivePom)
		.filter(dep => !dep.ignore)
		.map(dep => { return {name: `${dep.groupId}:${dep.artifactId}`, version: dep.version} })
	// delete temp files and directory
	fs.rmSync(tmpDir, {recursive: true, force: true})
	// return packages list
	return packages
}

/**
 * Get a list of dependencies with marking of dependencies commented with <!--crdaignore-->.
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
	// iterate over all dependencies and chery pick dependencies with a crdaignore comment
	pomJson['project']['dependencies']['dependency'].forEach(dep => {
		let ignore = false
		if (dep['#comment'] && dep['#comment'].includes('crdaignore')) { // #comment is an array or a string
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
