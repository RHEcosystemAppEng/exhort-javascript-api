import {Enums} from "@cyclonedx/cyclonedx-library";

import Sbom from './sbom.js'
import CDX from '@cyclonedx/cyclonedx-library'



export default class CycloneDxSbom extends Sbom{

	sbomModel
	rootComponent
	constructor() {
		super();
		this.sbomModel = new CDX.Models.Bom()
		this.sbomModel.version=1
		this.sbomModel.bomFormat="CycloneDX"
		this.sbomModel.specVersion="1.4"
		let metadata = new CDX.Models.Metadata()
		this.sbomModel.dependencies =  new CDX.Models.BomRefRepository()
		this.sbomModel.components = new CDX.Models.ComponentRepository()
		metadata.timestamp = new Date()
		this.sbomModel.metadata = metadata
	}
	/**
	 * @inheritDoc
	 */
	addRoot (root) {
		this.rootComponent = root
		let component = new CDX.Models.Component(Enums.ComponentType.Library, this.rootComponent.name,{
			bomRef: this.rootComponent.toString(),
			version: this.rootComponent.version,
			group: this.rootComponent.namespace,
			purl: this.rootComponent
		})
		this.sbomModel.metadata.component = component
		this.sbomModel.components.add(component)
		this.sbomModel.dependencies.add(component.bomRef)
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


		let sourceComp
		let sourceComponent = new CDX.Models.Component(Enums.ComponentType.Library, sourceRef.name,{
			bomRef: sourceRef.toString(),
			version: sourceRef.version,
			group: sourceRef.namespace,
			purl: sourceRef
		})
		let targetComponent = new CDX.Models.Component(Enums.ComponentType.Library, targetRef.name,{
			bomRef: targetRef.toString(),
			version: targetRef.version,
			group: targetRef.namespace,
			purl: targetRef
		})


		// this.sbomModel.components.forEach(comp => {comp.bomRef === sourceComponent.bomRef)
		if(!DependencyIsInComponents(this.sbomModel.components,sourceComponent))
		{
			this.sbomModel.components.add(sourceComponent)
			this.sbomModel.dependencies.add(sourceComponent.bomRef)
			sourceComp = sourceComponent
		}
		else
		{
			// sourceComp = this.sbomModel.components.streams.find(comp => comp.bomRef === sourceComponent.bomRef);
			sourceComp = findComponent(this.sbomModel.components,sourceComponent)
		}
		//TODO check validation if exists.
		sourceComp.dependencies.add(targetComponent.bomRef)
		// if(this.sbomModel.dependencies.streams.find(dep => dep.ref === targetRef.ref) === undefined)
		if(!bomRefIsInDependencies(this.sbomModel.dependencies,targetComponent))
		{
			this.sbomModel.dependencies.add(targetComponent.bomRef)
		}
		if(!DependencyIsInComponents(this.sbomModel.components,targetComponent))
		{
			this.sbomModel.components.add(targetComponent)
		}
		return this
	}
	/**
	 * @inheritDoc
	 */
	getAsJsonString(){
		return JSON.stringify(this.sbomModel)
	}


}

function DependencyIsInComponents(collection, dependency) {
	let result = false
	collection.forEach(component=> {
		if(dependency.bomRef.compare(component.bomRef) === 0)
		{
			result =true
			return
		}
	})
	return result
}

function bomRefIsInDependencies(collection, dependency) {
	let result = false
	collection.forEach(bomRef=> {
		if(dependency.bomRef.compare(bomRef) === 0)
		{
			result =true
			return
		}
	})
	return result
}



function findComponent(components, sourceComponent) {
	let result = undefined
	components.forEach(component => {
		if(component.bomRef.compare(sourceComponent.bomRef) == 0)
		{
			result=component
			return
		}
	})
	return result
}
