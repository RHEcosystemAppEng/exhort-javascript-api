
import { PackageURL } from 'packageurl-js';
export default class Sbom {
	constructor() {
	}

	/**
	 * @param {PackageURL} root - add main/root component for sbom
	 * @return Sbom
	 */
	addRoot (root) {}

	/**
	 * @return {PackageURL} root component of sbom.
	 */
	getRoot (){}

	/**
	 * @param {Array} deps
	 * @return Sbom
	 */
	filterIgnoredDeps(deps){}

	/**
	 * @param {Component} sourceRef current target Component ( Starting from root component by clients)
	 * @param {PackageURL} targetRef current dependency to add to Dependencies list of component sourceRef
	 * @return Sbom
	 */
	addDependency(sourceRef, targetRef){}

	/**
	 * @return String sbom json in a string format
	 */
	getAsJsonString(){}

	/**
	 *
	 * @param purl {PackageURL}
	 * @return component
	 */
	purlToComponent(purl){}
}



