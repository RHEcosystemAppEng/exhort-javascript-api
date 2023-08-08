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
	 * @param {Array} deps
	 * @return Sbom
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
	 *
	 * @param purl {PackageURL}
	 * @return component
	 */
	purlToComponent(purl){
		return this.sbomModel.purlToComponent(purl)
	}
}



