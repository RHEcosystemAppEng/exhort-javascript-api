/**
 *
 * @param component {PackageURL}
 * @param type type of package - application or library
 * @return {{"bom-ref": string, name, purl: string, type, version}}
 * @private
 */
function getComponent(component,type) {
	let componentObject;
	if(component.namespace) {
		componentObject = {
			"group": component.namespace,
			"name": component.name,
			"version": component.version,
			"purl": component.toString(),
			"type": type,
			"bom-ref": component.toString()
		}
	}
	else
	{
		componentObject = {
			"name": component.name,
			"version": component.version,
			"purl": component.toString(),
			"type": type,
			"bom-ref": component.toString()
		}
	}
	return componentObject
}


function createDependency(dependency)
{
	return {
		"ref" : dependency,
		"dependsOn" : new Array()
	}

}



export default class CycloneDxSbom {

	sbomObject
	rootComponent
	components
	dependencies
	constructor() {
		this.dependencies = new Array()
		this.components = new Array()


	}
	/**
	 * @param {PackageURL} root - add main/root component for sbom
	 * @return {CycloneDxSbom} the CycloneDxSbom Sbom Object
	 */
	addRoot (root) {

		this.rootComponent =
			getComponent(root,"application")
		this.components.push(this.rootComponent)
		return this
	}



	/**
	 * @return {{{"bom-ref": string, name, purl: string, type, version}}} root component of sbom.
	 */
	getRoot (){
		return this.rootComponent
	}

	/**
	 * @param {Component} sourceRef current target Component ( Starting from root component by clients)
	 * @param {PackageURL} targetRef current dependency to add to Dependencies list of component sourceRef
	 * @return Sbom
	 */
	addDependency(sourceRef, targetRef){
		let componentIndex = this.getComponentIndex(sourceRef);
		if(componentIndex < 0)
		{
			this.components.push(getComponent(sourceRef,"library"))
		}
		let dependencyIndex = this.getDependencyIndex(sourceRef.purl)
		if(dependencyIndex < 0)
		{
			this.dependencies.push(createDependency(sourceRef.purl))
			dependencyIndex = this.getDependencyIndex(sourceRef.purl)
		}

		//Only if the dependency doesn't exists on the dependency list of dependency, then add it to this list.
		if(this.dependencies[dependencyIndex].dependsOn.findIndex(dep => dep === targetRef.toString()) === -1)
		{
			this.dependencies[dependencyIndex].dependsOn.push(targetRef.toString())
		}
		if(this.getDependencyIndex(targetRef.toString()) < 0)
		{
			this.dependencies.push(createDependency(targetRef.toString()))
		}
		let newComponent = getComponent(targetRef,"library");
		// Only if component doesn't exists in component list, add it to the list.
		if(this.getComponentIndex(newComponent) < 0)
		{
			this.components.push(newComponent)
		}
		return this
	}
	/**
	 * @return String CycloneDx Sbom json object in a string format
	 */
	getAsJsonString(){
		this.sbomObject = {
			"bomFormat" : "CycloneDX",
			"specVersion" : "1.4",
			"version" : 1,
			"metadata" : {
				"timestamp" : new Date(),
				"component" : this.rootComponent
			},
			"components" : this.components,
			"dependencies" : this.dependencies
		}
		return JSON.stringify(this.sbomObject)
	}

	/**
	 *
	 * @param {String} dependency - purl string of the component.
	 * @return {int} - the index of the dependency in dependencies Array, returns -1 if not found.
	 */
	getDependencyIndex(dependency){
		return this.dependencies.findIndex(dep => dep.ref === dependency)
	}

	/**
	 *
	 * @param {Conponent} theComponent - Component Object with purl field.
	 * @return {int} index of the found component entry, if not found returns -1.
	 * @private
	 */
	getComponentIndex(theComponent){

		return this.components.findIndex(component => component.purl === theComponent.purl)
	}

	/** This method gets a PackageUrl, and returns a Component of CycloneDx Sbom
	 * @param purl {PackageURL}
	 * @return component
	 */
	purlToComponent(purl)
	{
		return getComponent(purl,"library")
	}
	/**
	 * This method gets an array of dependencies to be ignored, and remove all of them from CycloneDx Sbom
	 * @param {Array} dependencies to be removed from sbom
	 * @return {CycloneDxSbom} without ignored dependencies
	 */
	filterIgnoredDeps(deps){
		deps.forEach(dep => {
			let index = this.components.findIndex(component => component.name === dep );
			if(index>=0)
			{
				this.components.splice(index,1)
			}
			index = this.dependencies.findIndex(dependency => dependency.ref.includes(dep));
			if(index>=0)
			{
				this.dependencies.splice(index,1)
			}

			this.dependencies.forEach(dependency => {
				let indexDependsOn = dependency.dependsOn.findIndex(theDep => theDep.includes(dep));
				if (indexDependsOn > -1 )
				{
					dependency.dependsOn.splice(indexDependsOn,1)
				}
			})
		})
		return this
	}


}
