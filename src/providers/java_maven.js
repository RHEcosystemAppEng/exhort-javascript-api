import { XMLParser } from 'fast-xml-parser'
import { execSync } from "node:child_process"
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

export default { isSupported, provideComponent, provideStack }

/** @typedef {import('../provider').Provider} */

/** @typedef {import('../provider').Provided} Provided */

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
function provideComponent(data) { // WIP
	return {
		ecosystem,
		content: 'WIP',
		contentType: 'WIP'
	}
}

/**
 * Create a Dot Graph dependency tree for maven.
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
	// exclude ignored dependencies
	getIgnored(manifest).forEach(ignoredDep => depTreeCmd += ` -Dexcludes=${ignoredDep}`)
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
 * Get a list of dependencies marked with <!--crdaignore-->.
 * @param {string} manifest - path for pom.xml
 * @returns {string[]} an array of dependencies to be ignored, group-id:artifact-id:*:version
 * 		(the * marks any type, if no version specified, * will be used)
 * @private
 */
function getIgnored(manifest) {
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
		if (dep['#comment'] && dep['#comment'].includes('crdaignore')) { // #comment is an array or a string
			ignored.push(`${dep['groupId']}:${dep['artifactId']}:*:${dep['version'] ? dep['version'] : '*'}`)
		}
	})
	// return list of dependencies to ignore
	return ignored
}
