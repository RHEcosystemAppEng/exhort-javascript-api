import { expect } from 'chai'
import fs from 'fs'
import javascriptNpmProvider from "../../src/providers/javascript_npm.js"

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
		// "package_json_deps_with_exhortignore_object"
	].forEach(testCase => {
		let scenario = testCase.replace('pom_deps_', '').replaceAll('_', ' ')

		test(`verify package.json data provided for stack analysis with scenario ${scenario}`, async () => {
			// load the expected graph for the scenario
			let expectedSbom = fs.readFileSync(`test/providers/tst_manifests/npm/${testCase}/stack_expected_sbom.json`,).toString()
			// invoke sut stack analysis for scenario manifest
			let providedDataForStack = await javascriptNpmProvider.provideStack(`test/providers/tst_manifests/npm/${testCase}/package.json`)
			// verify returned data matches expectation
			expect(providedDataForStack).to.deep.equal({
				ecosystem: 'npm',
				contentType: 'application/vnd.cyclonedx+json',
				content: expectedSbom
			})
		// these test cases takes ~2500-2700 ms each pr >10000 in CI (for the first test-case)
		}).timeout(process.env.GITHUB_ACTIONS ? 30000 : 5000)

		test(`verify maven data provided for component analysis with scenario ${scenario}`, async () => {
			// load the expected list for the scenario
			let expectedSbom = fs.readFileSync(`test/providers/tst_manifests/${testCase}/component_expected_sbom.json`,).toString().trim()
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
		}).timeout(process.env.GITHUB_ACTIONS ? 15000 : 2500)
	})
});
