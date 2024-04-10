import {XMLParser} from 'fast-xml-parser'
import {execSync} from "node:child_process"
import fs from 'node:fs'
import {getCustomPath,handleSpacesInPath} from "../tools.js";
import os from 'node:os'
import path from 'node:path'
import Sbom from '../sbom.js'
import {EOL} from 'os'
import Base_java from "./base_java.js";
import TOML from 'fast-toml'


/** @typedef {import('../provider').Provider} */

/** @typedef {import('../provider').Provided} Provided */

const ROOT_PROJECT_KEY_NAME = "root-project";


const EXHORT_IGNORE_NOTATION = "//exhortignore";

/**
 * Check if the dependency marked for exclusion has libs notation , so if it's true the rest of coordinates( GAV) should be fetched from TOML file.
 * @param {string} depToBeIgnored
 * @return {boolean} returns if the dependency type has library notation or not
 */
function depHasLibsNotation(depToBeIgnored) {
	let regex = /:/g
	return (depToBeIgnored.trim().startsWith("library(") || depToBeIgnored.trim().includes("libs."))
		    && depToBeIgnored.match(regex).length <= 1
}

function stripString(depPart) {
	return depPart.replaceAll(/["']/,"")
}

export default class Java_gradle extends Base_java {

	/**
	 * @param {string} manifestName - the subject manifest name-type
	 * @returns {boolean} - return true if `pom.xml` is the manifest name-type
	 */

	isSupported(manifestName) {
		return 'build.gradle' === manifestName
	}

	/**
	 * Provide content and content type for maven-maven stack analysis.
	 * @param {string} manifest - the manifest path or name
	 * @param {{}} [opts={}] - optional various options to pass along the application
	 * @returns {Provided}
	 */


	provideStack(manifest, opts = {}) {
		return {
			ecosystem: Base_java.ecosystem,
			content: this.#createSbomStackAnalysis(manifest, opts),
			contentType: 'application/vnd.cyclonedx+json'
		}
	}

	testMeNow() {
		return {hello: "there"}
	}

	/**
	 * Provide content and content type for maven-maven component analysis.
	 * @param {string} data - content of pom.xml for component report
	 * @param {{}} [opts={}] - optional various options to pass along the application
	 * @returns {Provided}
	 */

	provideComponent(data, opts = {}, path = '') {
		return {
			ecosystem: Base_java.ecosystem,
			content: this.#getSbomForComponentAnalysis(opts, path),
			contentType: 'application/vnd.cyclonedx+json'
		}
	}

	/**
	 * Create a Dot Graph dependency tree for a manifest path.
	 * @param {string} manifest - path for pom.xml
	 * @param {{}} [opts={}] - optional various options to pass along the application
	 * @returns {string} the Dot Graph content
	 * @private
	 */
	#createSbomStackAnalysis(manifest, opts = {}) {
		let ignoredDeps = new Array()
		let content = this.#getDependencies(manifest)
		let properties = this.#extractProperties(manifest, opts)
		// read dependency tree from temp file
		if (process.env["EXHORT_DEBUG"] === "true") {
			console.log("Dependency tree that will be used as input for creating the BOM =>" + EOL + EOL + content)
		}
		let sbom = this.#buildSbomFileFromTextFormat(content, properties, "runtimeClasspath", manifest)
		return sbom
	}

	/**
	 *
	 * @param {string} manifestPath - path to build.gradle.
	 * @param {Object} opts - contains various options settings from client.
	 * @return {{Object}} an object that contains all gradle properties
	 */
	#extractProperties(manifestPath, opts) {
		let properties = {}
		let propertiesContent = this.#getProperties(manifestPath, opts)
		let regExpMatchArray = propertiesContent.match(/([^:]+):\s+(.+)/);
		for (let i = 0; i < regExpMatchArray.length - 1; i++) {
			properties[regExpMatchArray[i]] = regExpMatchArray[i + 1]
		}
		let regExpMatchArray1 = propertiesContent.match("^Root project '(.+)'");
		if (regExpMatchArray1[0]) {
			properties[ROOT_PROJECT_KEY_NAME] = regExpMatchArray1[0]
		}
		return properties;
	}

	/**
	 *
	 * @param manifestPath - path to build.gradle
	 * @param {Object} opts - contains various options settings from client.
	 * @return {string} string content of the properties
	 */
	#getProperties(manifestPath, opts) {
		let gradle = getCustomPath("gradle", opts);
		let properties
		try {
			properties = execSync(`${gradle} properties`, {cwd: path.dirname(manifestPath)})
		} catch (e) {
			throw new Error(`Couldn't get properties of build.gradle file`)
		}
		return properties
	}

	/**
	 * Create a dependency list for a manifest content.
	 * @param {{}} [opts={}] - optional various options to pass along the application
	 * @returns {string} - sbom string of the direct dependencies of build.gradle
	 * @private
	 */
	#getSbomForComponentAnalysis(opts = {}, manifestPath) {
		let ignoredDeps = new Array()
		let content = this.#getDependencies(manifestPath)
		let properties = this.#extractProperties(manifestPath, opts)
		let configurationNames = new Array()
		configurationNames.push("api", "implementation", "compile")
		let configName
		for (let config of configurationNames) {
			let directDeps = this.#extractLines(content, config);
			if (directDeps.length > 0) {
				configName = config
				break

			}
		}
		let sbom = this.#buildSbomFileFromTextFormat(content, properties, configName, manifest)
		return sbom

	}

	/**
	 * Get a list of dependencies from gradle dependencies command.
	 * @param {string} manifest - path for build.gradle
	 * @returns {string} an array of dependencies
	 * @private
	 */

	#getDependencies(manifest) {
		let gradle
		let commandResult
		gradle = getCustomPath("gradle")
		try {
			commandResult = execSync(`${gradle} dependencies`)
		} catch (e) {
			throw new Error(`Couldn't run gradle dependencies command`)
		}
		return commandResult.toString()
	}

	/**
	 * Utility function for looking up a dependency in a list of dependencies ignoring the "ignored"
	 * field
	 * @param dep {Dependency} dependency to look for
	 * @param deps {[Dependency]} list of dependencies to look in
	 * @returns boolean true if found dep in deps
	 * @private
	 */
	#dependencyIn(dep, deps) {
		return deps.filter(d => dep.artifactId === d.artifactId && dep.groupId === d.groupId && dep.version === d.version && dep.scope === d.scope).length > 0
	}

	#dependencyInExcludingVersion(dep, deps) {
		return deps.filter(d => dep.artifactId === d.artifactId && dep.groupId === d.groupId && dep.scope === d.scope).length > 0
	}

	/**
	 *
	 * @param content {string} - content of the dependency tree received from gradle dependencies command
	 * @param properties {Object} - properties of the gradle project.
	 * @param configName {string} - the configuration name of dependencies to include in sbom.
	 * @return {string} return sbom json string of the build.gradle manifest file
	 */
	#buildSbomFileFromTextFormat(content, properties, configName, manifestPath) {
		let sbom = new Sbom();
		let root = `${properties.group}:${properties[ROOT_PROJECT_KEY_NAME]}:jar:${properties.version}`
		let rootPurl = this.parseDep(root)
		sbom.addRoot(rootPurl)
		let lines = this.#extractLines(content, configName)
		// transform gradle dependency tree to the form of maven dependency tree to use common sbom build algorithm in Base_java parent */
		let arrayForSbom = lines.map(dependency => dependency.replaceAll("---", "-").replaceAll("    ", "  "))
			.map(dependency => dependency.replaceAll(/:(.*):(.*) -> (.*)$/, ":$1:$3"))
			.map(dependency => dependency.replaceAll(/(.*):(.*):(.*)$/, "$1:$2:jar:$3"))
			.map(dependency => dependency.replaceAll(/(n)$/), "")
			.map(dependency => dependency.replaceAll(/$/), ":compile");
		this.parseDependencyTree(root, 0, arrayForSbom, sbom)
		let ignoredDeps = this.#getIgnoredDeps(manifestPath)
		return sbom.filterIgnoredDepsIncludingVersion(ignoredDeps).getAsJsonString();
	}

	/**
	 *
	 * @param {string}dependencies - gradle dependencies
	 * @param startMarker - the start marker configuration for dependencies collection
	 * @return {string[]} - An array of lines that match the parameter startMarker
	 * @private
	 */

	#extractLines(dependencies, startMarker) {
		let dependenciesList = dependencies.split(EOL);
		let resultList = new Array()
		let startFound = false
		for (const dependency in dependenciesList) {
			if (dependency.startsWith(startMarker)) {
				startFound = true
			}

			if (startFound && dependency.trim() !== "") {
				resultList.push(dependency)
			}

			if (startFound && dependency.trim() === "") {
				break
			}

		}
		return resultList
	}

	/**
	 * This method gets build.gradle manifest, and extracts from it all artifacts marks for exclusion using an //exhortignore comment.
	 * @param {string} manifestPath the build.gradle manifest path
	 * @return {string[]} an array with all dependencies to ignore - contains 'stringified' purls as elements
	 * @private
	 */
	#getIgnoredDeps(manifestPath) {
		let buildGradleLines = fs.readFileSync(manifestPath).toString().split(EOL)
		let ignored =
			buildGradleLines.filter(line => line && line.includes(EXHORT_IGNORE_NOTATION))
				.map(line => line.indexOf("/*") === -1 ? line : line.substring(0, line.indexOf("/*")))
				.map(line => line.trim().substring(0, line.indexOf(EXHORT_IGNORE_NOTATION)))

		let depsToIgnore = new Array
		ignored.forEach(depToBeIgnored => {
			let ignoredDepInfo
			if (depHasLibsNotation(depToBeIgnored)) {
				ignoredDepInfo = this.#getDepFromLibsNotation(depToBeIgnored, manifestPath);
			} else {
				ignoredDepInfo = this.#getDependencyFromStringOrMapNotation(depToBeIgnored)
			}
			if (ignoredDepInfo) {
				depsToIgnore.push(ignoredDepInfo)
			}
		})
		return depsToIgnore
	}

	#getDepFromLibsNotation(depToBeIgnored, manifestPath) {
		// Extract everything after "libs."
		let alias = depToBeIgnored.substring(depToBeIgnored.indexOf("libs.") + "libs.".length)
		alias = alias.replace(".", "-")
		// Read and parse the TOML file
        let pathOfToml = path.join(path.dirname(manifestPath),"gradle","libs.versions.toml");
		const tomlString = fs.readFileSync(pathOfToml).toString()
		let tomlObject = TOML.parse(tomlString)
		let groupPlusArtifactObject = JSON.parse(tomlObject.libraries[alias].replace("=",":"))
		let parts = groupPlusArtifactObject.module.split(":");
		let groupId = parts[0]
		let artifactId = parts[1]
		let versionRef = groupPlusArtifactObject["version.ref"]
		let version = tomlObject.versions[versionRef]
		return groupId && artifactId && version ? this.toPurl(groupId,artifactId,version).toString() : undefined

	}

	/**
	 * Gets a dependency line of type string/map notation from build.gradle, extract the coordinates from it and returns string purl
	 * @param depToBeIgnored
	 * @return {string|undefined} string of a purl format of the extracted coordinates.
	 */
	#getDependencyFromStringOrMapNotation(depToBeIgnored) {
		// dependency line is of form MapNotation
		if (depToBeIgnored.includes("group:") && depToBeIgnored.includes("name:") && depToBeIgnored.includes("version:")) {
			let matchedKeyValues = depToBeIgnored.match(/(group|name|version):\s*['"](.*?)['"]/g)
			let coordinates = {}
			for (let coordinatePair in matchedKeyValues) {
				let keyValue = coordinatePair.split(":");
				coordinates[keyValue[0].trim()] = stripString(keyValue[1].trim())
			}
			return this.toPurl(coordinates.group,coordinates.name,coordinates.version).toString()

		// 	Dependency line is of form String Notation
		} else {
			let depParts = depToBeIgnored.split(":");
			if(depParts.length() === 3) {
				let groupId = stripString(depParts[0])
				let artifactId = stripString(depParts[1])
				let version = stripString(depParts[2])
				return this.toPurl(groupId,artifactId,version).toString()
			}

		}

		return undefined
	}
}
