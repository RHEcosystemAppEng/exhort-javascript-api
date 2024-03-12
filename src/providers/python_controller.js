import {execSync} from "node:child_process";
import fs from "node:fs";
import path from 'node:path';
import {EOL} from "os";
import {environmentVariableIsPopulated,getCustom, handleSpacesInPath} from "../tools.js";


function getPipFreezeOutput() {
	return environmentVariableIsPopulated("EXHORT_PIP_FREEZE")  ? new Buffer(process.env["EXHORT_PIP_FREEZE"],'base64').toString('ascii') : execSync(`${this.pathToPipBin} freeze --all`, err => {
		if (err) {
			throw new Error('fail invoking pip freeze to fetch all installed dependencies in environment --> ' + err.message)
		}
	}).toString();
}

function getPipShowOutput(depNames) {

	return environmentVariableIsPopulated("EXHORT_PIP_SHOW")  ? new Buffer(process.env["EXHORT_PIP_SHOW"],'base64').toString('ascii')  : execSync(`${this.pathToPipBin} show ${depNames}`, err => {
		if (err) {
			throw new Error('fail invoking pip show to fetch all installed dependencies metadata --> ' + err.message)
		}
	}).toString();
}

/** @typedef {{name: string, version: string, dependencies: DependencyEntry[]}} DependencyEntry */



export default class Python_controller {

	pythonEnvDir
	pathToPipBin
	pathToPythonBin
	realEnvironment
	pathToRequirements
	options

	/**
	 * Constructor to create new python controller instance to interact with pip package manager
	 * @param {boolean} realEnvironment - whether to use real environment supplied by client or to create virtual environment
	 * @param {string} pathToPip - path to pip package manager
	 * @param {string} pathToPython - path to python binary
	 * @param {string} pathToRequirements
	 * @
	 */
	constructor(realEnvironment,pathToPip,pathToPython,pathToRequirements,options={}) {
		this.pathToPythonBin = pathToPython
		this.pathToPipBin = pathToPip
		this.realEnvironment= realEnvironment
		this.prepareEnvironment()
		this.pathToRequirements = pathToRequirements
		this.options = options
	}
	prepareEnvironment()
	{
		if(!this.realEnvironment) {
			this.pythonEnvDir = path.join(path.sep,"tmp","exhort_env_js")
			execSync(`${this.pathToPythonBin} -m venv ${this.pythonEnvDir} `, err => {
				if (err) {
					throw new Error('failed creating virtual python environment - ' + err.message)
				}
			})
			if(this.pathToPythonBin.includes("python3"))
			{
				this.pathToPipBin = path.join(this.pythonEnvDir,"bin","pip3");
				this.pathToPythonBin = path.join(this.pythonEnvDir,"bin","python3")
			}
			else {
				this.pathToPipBin = path.join(this.pythonEnvDir,"bin","pip");
				this.pathToPythonBin = path.join(this.pythonEnvDir,"bin","python")
			}
			// upgrade pip version to latest
			execSync(`${this.pathToPythonBin} -m pip install --upgrade pip `, err => {
				if (err) {
					throw new Error('failed upgrading pip version on virtual python environment - ' + err.message)
				}
			})
		}
		else{
			if(this.pathToPythonBin.startsWith("python")) {
				this.pythonEnvDir = process.cwd()
			}
			else
			{
				this.pythonEnvDir = path.dirname(this.pathToPythonBin)
			}
		}
	}

	/**
	 *
	 * @param {boolean} includeTransitive - whether to return include in returned object transitive dependencies or not
	 * @return {[DependencyEntry]}
	 */
	getDependencies(includeTransitive)
	{
		let startingTime
		let endingTime
		if (process.env["EXHORT_DEBUG"] === "true") {
			startingTime = new Date()
			console.log("Starting time to get requirements.txt dependency tree = " + startingTime)
		}
		if(!this.realEnvironment) {
			let installBestEfforts = getCustom("EXHORT_PYTHON_INSTALL_BEST_EFFORTS","false",this.options);
			if(installBestEfforts === "false")
			{
				execSync(`${this.pathToPipBin} install -r ${handleSpacesInPath(this.pathToRequirements)}`, err =>{
					if (err) {
						throw new Error('fail installing requirements.txt manifest in created virtual python environment --> ' + err.message)
					}
				})
			}
			// make best efforts to install the requirements.txt on the virtual environment created from the python3 passed in.
			// that means that it will install the packages without referring to the versions, but will let pip choose the version
			// tailored for version of the python environment( and of pip package manager) for each package.
			else {
				let matchManifestVersions = getCustom("MATCH_MANIFEST_VERSIONS","true",this.options);
				if(matchManifestVersions === "true")
				{
					throw new Error("Conflicting settings, EXHORT_PYTHON_INSTALL_BEST_EFFORTS=true can only work with MATCH_MANIFEST_VERSIONS=false")
				}
				this.#installingRequirementsOneByOne()
			}
		}
		let dependencies = this.#getDependenciesImpl(includeTransitive)
		this.#cleanEnvironment()
		if (process.env["EXHORT_DEBUG"] === "true") {
			endingTime = new Date()
			console.log("Ending time to get requirements.txt dependency tree = " + endingTime)
			let time = ( endingTime - startingTime ) / 1000
			console.log("total time to get requirements.txt dependency tree = " + time)
		}
		return dependencies
	}

	#installingRequirementsOneByOne() {
		let requirementsContent = fs.readFileSync(this.pathToRequirements);
		let requirementsRows = requirementsContent.toString().split(EOL);
		requirementsRows.filter((line) => !line.trim().startsWith("#")).filter((line) => line.trim() !== "").forEach( (dependency) => {
			let dependencyName = getDependencyName(dependency);
			execSync(`${this.pathToPipBin} install ${dependencyName}`, err =>{
				if (err) {
					throw new Error(`Best efforts process - failed installing ${dependencyName}  in created virtual python environment --> error message: ` + err.message)
				}
			})
		} )
	}
	/**
	 * @private
	 */
	#cleanEnvironment()
	{
		if(!this.realEnvironment)
		{
			execSync(`${this.pathToPipBin} uninstall -y -r ${handleSpacesInPath(this.pathToRequirements)}`, err =>{
				if (err) {
					throw new Error('fail uninstalling requirements.txt in created virtual python environment --> ' + err.message)
				}
			})
		}
	}
	#getDependenciesImpl(includeTransitive) {
		let dependencies = new Array()
		let usePipDepTree = getCustom("EXHORT_PIP_USE_DEP_TREE","false",this.options);
		let freezeOutput
		let lines
		let depNames
		let pipShowOutput
		let allPipShowDeps
		let pipDepTreeJsonArrayOutput
		if(usePipDepTree !== "true") {
			freezeOutput = getPipFreezeOutput.call(this);
			 lines = freezeOutput.split(EOL)
			depNames = lines.map( line => getDependencyName(line)).join(" ")
		}
		else {
			pipDepTreeJsonArrayOutput = getDependencyTreeJsonFromPipDepTree(this.pathToPipBin,this.pathToPythonBin)
		}


		if(usePipDepTree !== "true") {
			pipShowOutput = getPipShowOutput.call(this, depNames);
			allPipShowDeps = pipShowOutput.split( EOL +"---" + EOL);
		}
		//debug
		// pipShowOutput = "alternative pip show output goes here for debugging"

		let matchManifestVersions = getCustom("MATCH_MANIFEST_VERSIONS","true",this.options);
		let linesOfRequirements = fs.readFileSync(this.pathToRequirements).toString().split(EOL).filter( (line) => !line.startsWith("#")).map(line => line.trim())
		let CachedEnvironmentDeps = {}
		if(usePipDepTree !== "true") {
			allPipShowDeps.forEach((record) => {
				let dependencyName = getDependencyNameShow(record).toLowerCase()
				CachedEnvironmentDeps[dependencyName] = record
				CachedEnvironmentDeps[dependencyName.replace("-", "_")] = record
				CachedEnvironmentDeps[dependencyName.replace("_", "-")] = record
			})
		}
		else {
			pipDepTreeJsonArrayOutput.forEach( depTreeEntry => {
				let packageName = depTreeEntry["package"]["package_name"].toLowerCase()
				let pipDepTreeEntryForCache = {
					name: packageName,
					version: depTreeEntry["package"]["installed_version"],
					dependencies: depTreeEntry["dependencies"].map(dep => dep["package_name"])
				};
				CachedEnvironmentDeps[packageName] = pipDepTreeEntryForCache
				CachedEnvironmentDeps[packageName.replace("-", "_")] = pipDepTreeEntryForCache
				CachedEnvironmentDeps[packageName.replace("_", "-")] = pipDepTreeEntryForCache
			})
		}
		linesOfRequirements.forEach( (dep) => {
			// if matchManifestVersions setting is turned on , then
			if(matchManifestVersions === "true")
			{
				let dependencyName
				let manifestVersion
				let installedVersion
				let doubleEqualSignPosition
				if(dep.includes("=="))
				{
					doubleEqualSignPosition = dep.indexOf("==")
					manifestVersion = dep.substring(doubleEqualSignPosition + 2).trim()
					if(manifestVersion.includes("#"))
					{
						let hashCharIndex = manifestVersion.indexOf("#");
						manifestVersion = manifestVersion.substring(0,hashCharIndex)
					}
					dependencyName = getDependencyName(dep)
					// only compare between declared version in manifest to installed version , if the package is installed.
					if(CachedEnvironmentDeps[dependencyName.toLowerCase()] !== undefined) {
						if(usePipDepTree !== "true") {
							installedVersion = getDependencyVersion(CachedEnvironmentDeps[dependencyName.toLowerCase()])
						}
						else {
							installedVersion = CachedEnvironmentDeps[dependencyName.toLowerCase()].version
						}
					}
					if(installedVersion) {
						if (manifestVersion.trim() !== installedVersion.trim()) {
							throw new Error(`Can't continue with analysis - versions mismatch for dependency name ${dependencyName}, manifest version=${manifestVersion}, installed Version=${installedVersion}, if you want to allow version mismatch for analysis between installed and requested packages, set environment variable/setting - MATCH_MANIFEST_VERSIONS=false`)
						}
					}

				}
			}
			let path = new Array()
			let depName = getDependencyName(dep)
			//array to track a path for each branch in the dependency tree
			path.push(depName.toLowerCase())
			bringAllDependencies(dependencies,depName,CachedEnvironmentDeps,includeTransitive,path,usePipDepTree)
		})
		dependencies.sort((dep1,dep2) =>{
			const DEP1 = dep1.name.toLowerCase()
			const DEP2 = dep2.name.toLowerCase()
			if(DEP1 < DEP2) {
				return -1;
			}
			if(DEP1 > DEP2)
			{
				return 1;
			}
			return 0;})
		return dependencies
	}
}

/**
 *
 * @param {string} record - a record block from pip show
 * @return {string} the name of the dependency of the pip show record.
 */
function getDependencyNameShow(record) {
	let versionKeyIndex = record.indexOf("Name:")
	let versionToken = record.substring(versionKeyIndex + 5)
	let endOfLine = versionToken.indexOf(EOL)
	return versionToken.substring(0,endOfLine).trim()
}

/**
 *
 * @param {string} record - a record block from pip show
 * @return {string} the name of the dependency of the pip show record.
 */
function getDependencyVersion(record) {
	let versionKeyIndex = record.indexOf("Version:")
	let versionToken = record.substring(versionKeyIndex + 8)
	let endOfLine = versionToken.indexOf(EOL)
	return versionToken.substring(0,endOfLine).trim()
}

/**
 *
 * @param depLine the dependency with version/ version requirement as shown in requirements.txt
 * @return {string} the name of dependency
 */
function getDependencyName(depLine) {
	const regex = /[^\w\s-_.]/g;
	let endIndex = depLine.search(regex);
	return depLine.substring(0,endIndex) ;
}

/**
 *
 * @param record - a dependency record block from pip show
 * @return {[string]} array of all direct deps names of that dependency
 */
function getDepsList(record) {
	let requiresKeyIndex = record.indexOf("Requires:")
	let requiresToken = record.substring(requiresKeyIndex + 9)
	let endOfLine = requiresToken.indexOf(EOL)
	let listOfDepsString = requiresToken.substring(0,endOfLine)
	let list = listOfDepsString.split(",").filter(line => line.trim() !== "").map(line => line.trim())
	return list
}

/**
 *
 * @param {[DependencyEntry]} dependencies
 * @param dependencyName
 * @param cachedEnvironmentDeps
 * @param includeTransitive
 * @param usePipDepTree
 * @param {[string]}path array representing the path of the current branch in dependency tree, starting with a root dependency - that is - a given dependency in requirements.txt
 */
function bringAllDependencies(dependencies, dependencyName, cachedEnvironmentDeps, includeTransitive, path, usePipDepTree) {
	if(dependencyName === null || dependencyName === undefined || dependencyName.trim() === "" ) {
		return
	}
	let record = cachedEnvironmentDeps[dependencyName.toLowerCase()]
	if(record === null || record  === undefined) {
		throw new Error(`Package name=>${dependencyName} is not installed on your python environment,
		                         either install it ( better to install requirements.txt altogether) or turn on
		                         environment variable EXHORT_PYTHON_VIRTUAL_ENV=true to automatically installs
		                          it on virtual environment ( will slow down the analysis) `)
	}
	let depName
	let version;
	let directDeps
    if(usePipDepTree !== "true") {
		depName = getDependencyNameShow(record)
		version = getDependencyVersion(record);
	    directDeps = getDepsList(record)
	}
	else {
		depName = record.name
		version = record.version
		directDeps = record.dependencies
	}
	let targetDeps = new Array()

	let entry = { "name" : depName , "version" : version, "dependencies" : [] }
	dependencies.push(entry)
	directDeps.forEach( (dep) => {
		let depArray = new Array()
		// to avoid infinite loop, check if the dependency not already on current path, before going recursively resolving its dependencies.
		if(!path.includes(dep.toLowerCase())) {
			// send to recurrsion the path + the current dep
			depArray.push(dep.toLowerCase())
			if (includeTransitive) {
				// send to recurrsion the array of all deps in path + the current dependency name which is not on the path.
				bringAllDependencies(targetDeps, dep, cachedEnvironmentDeps, includeTransitive, path.concat(depArray), usePipDepTree)
			}
		}
		// sort ra
		targetDeps.sort((dep1,dep2) =>{
			const DEP1 = dep1.name.toLowerCase()
			const DEP2 = dep2.name.toLowerCase()
			if(DEP1 < DEP2) {
				return -1;
			}
			if(DEP1 > DEP2)
			{
				return 1;
			}
			return 0;})

		entry["dependencies"] = targetDeps
	})
}

/**
 * This function install tiny pipdeptree tool using pip ( if it's not already installed on python environment), and use it to fetch the dependency tree in json format.
 * @param {string }pipPath - the filesystem path location of pip binary
 * @param {string }pythonPath - the filesystem path location of python binary
 * @return {Object[] } json array containing objects with the packages and their dependencies from pipdeptree utility
 * @private
 */
function getDependencyTreeJsonFromPipDepTree(pipPath,pythonPath) {
	let dependencyTree
	try {
		execSync(`${pipPath} install pipdeptree`)
	} catch (e) {
		throw new Error(`Couldn't install pipdeptree utility, reason: ${e.getMessage}`)
	}
	finally {
		try {
			if(pythonPath.startsWith("python")) {
				dependencyTree = execSync(`pipdeptree  --json`).toString()
			}
			else {
				dependencyTree = execSync(`pipdeptree  --json --python  ${pythonPath} `).toString()
			}
		} catch (e) {
			throw new Error(`couldn't produce dependency tree using pipdeptree tool, stop analysis, message -> ${e.getMessage}`)
		}


	}
	return JSON.parse(dependencyTree)
}
