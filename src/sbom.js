
import { PackageURL } from 'packageurl-js';
export default class Sbom {
	constructor() {
	}

	/**
	 * @param {PackageURL} root - content of pom.xml for component report
	 * @return Sbom
	 */
	addRoot (root) {}

	/**
	 * @return PackageURL
	 */
	getRoot (){}

	/**
	 * @param {Set} deps
	 * @return Sbom
	 */
	filterIgnoredDeps(deps){}

	/**
	 * @param {PackageURL} sourceRef
	 * @param {PackageURL} targetRef
	 * @return Sbom
	 */
	addDependency(sourceRef, targetRef){}

	/**
	 * @return String sbom json in a string format
	 */
	getAsJsonString(){}
}



