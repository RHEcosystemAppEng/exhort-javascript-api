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

function getParsedKeyFromHtml(html, key,keyLength) {
	let beginSummary = html.substring(html.indexOf(key))
	let summary = beginSummary.substring(keyLength , beginSummary.indexOf("}") + 1);
	return JSON.parse(summary);
}

suite('Integration Tests', () => {
	// let opts = {
	// 	EXHORT_DEV_MODE: "true",
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
			process.env["EXHORT_DEV_MODE"] = "true"
			let manifestName = getManifestNamePerPm(packageManager)
			let pomPath = `test/it/test_manifests/${packageManager}/${manifestName}`
			let providedDataForStack = await index.stackAnalysis(pomPath)
			console.log(JSON.stringify(providedDataForStack,null , 4))
			let providers = ["osv-nvd"]
			providers.forEach(provider => expect(providedDataForStack.providers[provider].sources[provider].summary.total).greaterThan(0))
			// python transitive count for stack analysis is awaiting fix in exhort backend
			if(packageManager !== "pip")
			{
				expect(providedDataForStack.scanned.transitive).greaterThan(0)
			}
			providers.forEach(provider => expect(providedDataForStack.providers[provider].status.code).equals(200))
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
			let reportParsedFromHtml = JSON.parse(html.substring(html.indexOf("\"report\":") +9,html.indexOf("}}}}}") + 5))

			let parsedSummaryFromHtml = getParsedKeyFromHtml(html,"\"summary\"",10)
			let parsedScannedFromHtml = reportParsedFromHtml.scanned
			let parsedStatusFromHtmlOsvNvd = reportParsedFromHtml.providers["osv-nvd"].status
			expect( typeof html).equals("string")
			expect(html).include("html").include("svg")
			expect(parsedScannedFromHtml.total).greaterThan(0)
			// python transitive count for stack analysis is awaiting fix in exhort backend
			if(packageManager !== "pip")
			{
				expect(parsedScannedFromHtml.transitive).greaterThan(0)
			}
			expect(parsedSummaryFromHtml.total).greaterThanOrEqual(0)
			expect(parsedStatusFromHtmlOsvNvd.code).equals(200)
			// parsedSummaryFromHtml.providerStatuses.forEach(provider => expect(provider.status).equals(200))
		}).timeout(15000);

		test(`Component Analysis for ${packageManager}`, async () => {
			let manifestName = getManifestNamePerPm(packageManager)
			let pomPath = `test/it/test_manifests/${packageManager}/${manifestName}`
			let analysisReport = await index.componentAnalysis(manifestName,fs.readFileSync(pomPath).toString())

			expect(analysisReport.scanned.total).greaterThan(0)
			expect(analysisReport.scanned.transitive).equal(0)
			let providers = ["osv-nvd"]
			providers.forEach(provider => expect(analysisReport.providers[provider].sources[provider].summary.total).greaterThan(0))
			providers.forEach(provider => expect(analysisReport.providers[provider].status.code).equals(200))
		}).timeout(10000);


	});
}).beforeAll(() => process.env["EXHORT_DEV_MODE"] = "true");

// suite('Integration Tests - Developer Test End to End', () => {
// let opts = {
// 	EXHORT_DEV_MODE: "true",
//
// }
//
// 	test(`Stack Analysis json`, async () => {
// 		process.env["EXHORT_DEBUG"]= "true"
// 		process.env["EXHORT_DEV_MODE"]= "false"
// 		process.env["MATCH_MANIFEST_VERSIONS"]= "false"
// 		// process.env["EXHORT_GO_PATH"]= "/home/zgrinber/test-go/go/bin/go"
// 		// process.env["RHDA_TOKEN"] = "34JKLDS-4234809-66666666666"
// 		// process.env["RHDA_SOURCE"] = "Zvika Client"
// 		// let result = await index.stackAnalysis("/tmp/rajan-0410/go.mod", false, opts);
// 		let opts = {
// 			MATCH_MANIFEST_VERSIONS: 'false',
// 			EXHORT_DEV_MODE: 'true',
// 			// EXHORT_OSS_INDEX_TOKEN: '2bb579b7894f13f180f0ebb591be7c8febbcf699',
// 			EXHORT_OSS_INDEX_USER: 'zgrinber@redhat.com',
// 			EXHORT_GO_MVS_LOGIC_ENABLED: 'true'
// 		}
// 		process.env["EXHORT_PYTHON_VIRTUAL_ENV"] = "fasle"
// 		process.env["EXHORT_PYTHON_INSTALL_BEST_EFFORTS"] = "false"
// 		process.env["MATCH_MANIFEST_VERSIONS"] = "false"
// 		// let pomPath = `/tmp/070324/package.json`
// 		let pomPath = `/tmp/requirements.txt`
// 		// let pomPath = `/home/zgrinber/git/tracing-demos-and-examples/tracing-parent/pom.xml`
// 		let providedDataForStack;
// 		// providedDataForStack = await index.componentAnalysis("requirements.txt", fs.readFileSync(pomPath).toString(),{},pomPath);
// 		providedDataForStack = await index.stackAnalysis(pomPath,true);
// 		// console.log(JSON.stringify(providedDataForStack,null , 4))
// 		fs.writeFileSync(`/tmp/report.html`,providedDataForStack)
//
// 		// expect(providedDataForStack.summary.dependencies.scanned).greaterThan(0)
// 	}).timeout(30000);
//
//
//
//
// });
