import Sbom from './sbom.js'


/**
 *
 * @param component {PackageURL}
 * @param type type of package - application or library
 * @return {{"bom-ref": string, name, purl: string, type, version}}
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


function createDependency(purl)
{
	return {
		"ref" : purl.toString(),
		"dependsOn" : new Array()
	}

}



export default class CycloneDxSbom extends Sbom{

	sbomObject
	rootComponent
	components
	dependencies
	constructor() {
		super();
		this.dependencies = new Array()
		this.components = new Array()


	}
	/**
	 * @inheritDoc
	 */
	addRoot (root) {

		this.rootComponent =
			getComponent(root,"application")
		this.components.push(this.rootComponent)
		return this
	}



	/**
	 * @inheritDoc
	 */
	getRoot (){
		return this.rootComponent
	}
	/**
	 * @inheritDoc
	 */
	addDependency(sourceRef, targetRef){
		let componentIndex = this.getComponentIndex(sourceRef);
		if(componentIndex < 0)
		{
			this.components.push(getComponent(sourceRef,"library"))
		}
		let dependencyIndex = this.getDependencyIndex(sourceRef)
		if(dependencyIndex < 0)
		{
			this.dependencies.push(createDependency(sourceRef))
			dependencyIndex = this.getDependencyIndex(sourceRef)
		}
		this.dependencies[dependencyIndex].dependsOn.push(targetRef.toString())
		//TODO check validation if exists.
		// sourceComp.dependencies.add(targetComponent.bomRef)
		// if(this.sbomModel.dependencies.streams.find(dep => dep.ref === targetRef.ref) === undefined)
		if(this.getDependencyIndex(targetRef) < 0)
		{
			this.dependencies.push(createDependency(targetRef))
		}
		if(this.getComponentIndex(targetRef) < 0)
		{
			this.components.push(getComponent(targetRef,"library"))
		}
		return this
	}
	/**
	 * @inheritDoc
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
	getDependencyIndex(purl){
		return this.dependencies.findIndex(dep => dep.ref === purl.toString())
	}
	getComponentIndex(purl){
		return this.components.findIndex(component => component.purl === purl.toString())
	}

}
