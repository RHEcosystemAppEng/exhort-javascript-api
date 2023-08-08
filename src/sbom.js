import CycloneDxSbom from "./cyclone_dx_sbom.js";

export default class Sbom {
	sbomModel
	constructor() {
		this.sbomModel = new CycloneDxSbom()
	}

	/**
	 * @param {PackageURL} root - add main/root component for sbom
	 * @return Sbom
	 */
	addRoot (root) {
		return this.sbomModel.addRoot(root)
	}

	/**
	 * @return {{{"bom-ref": string, name, purl: string, type, version}}} root component of sbom.
	 */
	getRoot (){
		return this.sbomModel.getRoot()
	}

	/**
	 * This method gets an array of dependencies to be ignored, and remove all of them from sbom
	 * @param {Array} dependencies to be removed from sbom
	 * @return {Sbom} without ignored dependencies
	 */
	filterIgnoredDeps(deps){
		return this.sbomModel.filterIgnoredDeps(deps)
	}

	/**
	 * @param {Component} sourceRef current target Component ( Starting from root component by clients)
	 * @param {PackageURL} targetRef current dependency to add to Dependencies list of component sourceRef
	 * @return Sbom
	 */
	addDependency(sourceRef, targetRef){
		return this.sbomModel.addDependency(sourceRef,targetRef)
	}

	/**
	 * @return String sbom json in a string format
	 */
	getAsJsonString(){
		return this.sbomModel.getAsJsonString()
	}

	/**
	 * This method gets a PackageUrl, and returns a Component of Sbom
	 * @param purl {PackageURL}
	 * @return component
	 */
	purlToComponent(purl){
		return this.sbomModel.purlToComponent(purl)
	}
}



