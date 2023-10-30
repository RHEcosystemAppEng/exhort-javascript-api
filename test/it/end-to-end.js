import fs from "node:fs";
// import {AnalysisReport} from '../../generated/backend/AnalysisReport.js'
import index from "../../src/index.js"
import { expect } from 'chai'
// import fs from 'node:fs'

function getManifestNamePerPm(packageManager) {
	return packageManagersDict[packageManager];
}

const packageManagersDict =
	{
		"maven" : "pom.xml",
		"npm" : "package.json",
		"go" : "go.mod",
		"pip" : "requirements.txt"
	}

function getParsedSummaryFromHtml(html) {
	return JSON.parse(html.substring(html.indexOf("\"summary\"") + 10,html.indexOf("\"}]}") + 4));
}

suite('Integration Tests', () => {
	// let opts = {
	// 	EXHORT_DEV_MODE: "true",
	// 	EXHORT_SNYK_TOKEN: "ee64316c-a4ba-4ca0-a785-18cb05ed3f25"
	//
	// }
	["maven",
		"npm",
		"go",
		"pip"
	].forEach(packageManager => {
		test(`Stack Analysis json for ${packageManager}`, async () => {
			// process.env["EXHORT_DEBUG"]= "true"
			// process.env["EXHORT_DEV_MODE"]= "false"
			// process.env["EXHORT_GO_PATH"]= "/home/zgrinber/test-go/go/bin/go"
			// process.env["RHDA_TOKEN"] = "34JKLDS-4234809-66666666666"
			// process.env["RHDA_SOURCE"] = "Zvika Client"
			// let result = await index.stackAnalysis("/tmp/rajan-0410/go.mod", false, opts);
			if(packageManager === "pip")
			{
				process.env["EXHORT_PYTHON_VIRTUAL_ENV"] = "true"
			}
			else
			{
				process.env["EXHORT_PYTHON_VIRTUAL_ENV"] = ""
			}
			let manifestName = getManifestNamePerPm(packageManager)
			let pomPath = `test/it/test_manifests/${packageManager}/${manifestName}`
			let providedDataForStack = await index.stackAnalysis(pomPath)
			console.log(JSON.stringify(providedDataForStack.summary,null , 4))
			expect(providedDataForStack.summary.dependencies.scanned).greaterThan(0)
			// python transitive count for stack analysis is awaiting fix in exhort backend
			if(packageManager !== "pip")
			{
				expect(providedDataForStack.summary.dependencies.transitive).greaterThan(0)
			}
			expect(providedDataForStack.summary.vulnerabilities.total).greaterThanOrEqual(0)
			providedDataForStack.summary.providerStatuses.forEach(provider => expect(provider.status).equals(200))
		}).timeout(15000);

		test(`Stack Analysis html for ${packageManager}`, async () => {
			let manifestName = getManifestNamePerPm(packageManager)
			let pomPath = `test/it/test_manifests/${packageManager}/${manifestName}`
			let html = await index.stackAnalysis(pomPath,true)
			if(packageManager === "pip")
			{
				process.env["EXHORT_PYTHON_VIRTUAL_ENV"] = "true"
			}
			else
			{
				process.env["EXHORT_PYTHON_VIRTUAL_ENV"] = ""
			}
			let parsedSummaryFromHtml = getParsedSummaryFromHtml(html);
			expect( typeof html).equals("string")
			expect(html).include("html").include("svg")
			expect(parsedSummaryFromHtml.dependencies.scanned).greaterThan(0)
			// python transitive count for stack analysis is awaiting fix in exhort backend
			if(packageManager !== "pip")
			{
				expect(parsedSummaryFromHtml.dependencies.transitive).greaterThan(0)
			}
			expect(parsedSummaryFromHtml.vulnerabilities.total).greaterThanOrEqual(0)
			parsedSummaryFromHtml.providerStatuses.forEach(provider => expect(provider.status).equals(200))
		}).timeout(15000);

		test(`Component Analysis for ${packageManager}`, async () => {
			let manifestName = getManifestNamePerPm(packageManager)
			let pomPath = `test/it/test_manifests/${packageManager}/${manifestName}`
			let analysisReport = await index.componentAnalysis(manifestName,fs.readFileSync(pomPath).toString())

			expect(analysisReport.summary.dependencies.scanned).greaterThan(0)
			expect(analysisReport.summary.dependencies.transitive).equal(0)
			expect(analysisReport.summary.vulnerabilities.total).greaterThanOrEqual(0)
			analysisReport.summary.providerStatuses.forEach(provider => expect(provider.status).equals(200))
		}).timeout(10000);


	});
});

// suite('Developer Test End to End', () => {
// 	// let opts = {
// 	// 	EXHORT_DEV_MODE: "true",
// 	// 	EXHORT_SNYK_TOKEN: "ee64316c-a4ba-4ca0-a785-18cb05ed3f25"
// 	//
// 	// }
//
// 	test(`Stack Analysis json`, async () => {
// 		// process.env["EXHORT_DEBUG"]= "true"
// 		// process.env["EXHORT_DEV_MODE"]= "false"
// 		// process.env["EXHORT_GO_PATH"]= "/home/zgrinber/test-go/go/bin/go"
// 		// process.env["RHDA_TOKEN"] = "34JKLDS-4234809-66666666666"
// 		// process.env["RHDA_SOURCE"] = "Zvika Client"
// 		// let result = await index.stackAnalysis("/tmp/rajan-0410/go.mod", false, opts);
// 		let opts = {
// 			MATCH_MANIFEST_VERSIONS: 'false'
// 		}
//
// 		let pomPath = `/tmp/231023/requirements.txt`
// 		let providedDataForStack = await index.stackAnalysis(pomPath,opts)
// 		console.log(JSON.stringify(providedDataForStack.summary,null , 4))
// 		expect(providedDataForStack.summary.dependencies.scanned).greaterThan(0)
// 	}).timeout(15000);
//
//
//
//
// });
