import { expect } from 'chai'
import fs from 'fs'
import sinon from "sinon";
import { before } from 'mocha'
import javascriptNpmProvider from "../../src/providers/javascript_npm.js"
import exhort from  "../../src/index.js"



before(async function () { sinon.useFakeTimers(new Date(2023,7,7))})
suite('testing the javascript-npm data provider', () => {
	[
		{name: 'package.json', expected: true},
		{name: 'some_other.file', expected: false}
	].forEach(testCase => {
		test(`verify isSupported returns ${testCase.expected} for ${testCase.name}`, () =>
			expect(javascriptNpmProvider.isSupported(testCase.name)).to.equal(testCase.expected)
		)
	});

	[
		"package_json_deps_without_exhortignore_object",
		"package_json_deps_with_exhortignore_object"
	].forEach(testCase => {
		let scenario = testCase.replace('package_json_deps_', '').replaceAll('_', ' ')
		test(`verify package.json data provided for stack analysis with scenario ${scenario}`, async () => {
			// load the expected graph for the scenario
			let expectedSbom = fs.readFileSync(`test/providers/tst_manifests/npm/${testCase}/stack_expected_sbom.json`,).toString()
			expectedSbom = JSON.stringify(JSON.parse(expectedSbom))
			// invoke sut stack analysis for scenario manifest

			let providedDataForStack = await javascriptNpmProvider.provideStack(`test/providers/tst_manifests/npm/${testCase}/package.json`)
			// new(year: number, month: number, date?: number, hours?: number, minutes?: number, seconds?: number, ms?: number): Date

			// providedDataForStack.content = providedDataForStack.content.replaceAll("\"timestamp\":\"[a-zA-Z0-9\\-\\:]+\"","")
			// verify returned data matches expectation
			expect(providedDataForStack).to.deep.equal({
				ecosystem: 'npm',
				contentType: 'application/vnd.cyclonedx+json',
				content: expectedSbom
			})
		// these test cases takes ~2500-2700 ms each pr >10000 in CI (for the first test-case)
		}).timeout(process.env.GITHUB_ACTIONS ? 30000 : 5000)

		test(`verify package.json data provided for component analysis with scenario ${scenario}`, async () => {
			// load the expected list for the scenario
			let expectedSbom = fs.readFileSync(`test/providers/tst_manifests/npm/${testCase}/component_expected_sbom.json`,).toString().trim()
			expectedSbom = JSON.stringify(JSON.parse(expectedSbom))
			// read target manifest file
			let manifestContent = fs.readFileSync(`test/providers/tst_manifests/npm/${testCase}/package.json`).toString()
			// invoke sut stack analysis for scenario manifest
			let providedDataForStack = await javascriptNpmProvider.provideComponent(manifestContent)
			// verify returned data matches expectation
			expect(providedDataForStack).to.deep.equal({
				ecosystem: 'npm',
				contentType: 'application/vnd.cyclonedx+json',
				content: expectedSbom
			})
			// these test cases takes ~1400-2000 ms each pr >10000 in CI (for the first test-case)
		}).timeout(process.env.GITHUB_ACTIONS ? 15000 : 5000)

		test(`check quick integration component analysis  ${scenario}`, async () =>{
			let expectedSbom = fs.readFileSync(`test/providers/tst_manifests/npm/${testCase}/package.json`,).toString().trim()
			let analysisReport = await exhort.componentAnalysis("package.json", expectedSbom);
			console.log(analysisReport)

		}).timeout(process.env.GITHUB_ACTIONS ? 15000 : 5000)
		test(`check quick integration stack analysis with ${scenario}`, async () =>{

			let analysisReportJson = await exhort.stackAnalysis(`test/providers/tst_manifests/npm/${testCase}/package.json`,false)
			console.log(analysisReportJson)

		}).timeout(process.env.GITHUB_ACTIONS ? 15000 : 5000)

	})


});
