import { expect } from 'chai'
import fs from 'fs'
import sinon from "sinon";
import golangGoModules from "../../src/providers/golang_gomodules.js"



let clock
suite('testing the golang-go-modules data provider', () => {
	[
		{name: 'go.mod', expected: true},
		{name: 'some_other.file', expected: false}
	].forEach(testCase => {
		test(`verify isSupported returns ${testCase.expected} for ${testCase.name}`, () =>
			expect(golangGoModules.isSupported(testCase.name)).to.equal(testCase.expected)
		)
	});

	[
		"go_mod_light_no_ignore",
		"go_mod_no_ignore",
		"go_mod_with_ignore"
	].forEach(testCase => {
		let scenario = testCase.replace('go_mod_', '').replaceAll('_', ' ')
		test(`verify go.mod sbom provided for stack analysis with scenario ${scenario}`, async () => {
			// load the expected graph for the scenario
			let expectedSbom = fs.readFileSync(`test/providers/tst_manifests/golang/${testCase}/expected_sbom_stack_analysis.json`,).toString()
			expectedSbom = JSON.stringify(JSON.parse(expectedSbom))
			// invoke sut stack analysis for scenario manifest

			let providedDataForStack = await golangGoModules.provideStack(`test/providers/tst_manifests/golang/${testCase}/go.mod`)
			// new(year: number, month: number, date?: number, hours?: number, minutes?: number, seconds?: number, ms?: number): Date

			// providedDataForStack.content = providedDataForStack.content.replaceAll("\"timestamp\":\"[a-zA-Z0-9\\-\\:]+\"","")
			// verify returned data matches expectation
			expect(providedDataForStack).to.deep.equal({
				ecosystem: 'golang',
				contentType: 'application/vnd.cyclonedx+json',
				content: expectedSbom
			})
		// these test cases takes ~2500-2700 ms each pr >10000 in CI (for the first test-case)
		}).timeout(process.env.GITHUB_ACTIONS ? 30000 : 10000)

		test(`verify go.mod sbom provided for component analysis with scenario ${scenario}`, async () => {
			// load the expected list for the scenario
			let expectedSbom = fs.readFileSync(`test/providers/tst_manifests/golang/${testCase}/expected_sbom_component_analysis.json`,).toString().trim()
			expectedSbom = JSON.stringify(JSON.parse(expectedSbom))
			// read target manifest file
			let manifestContent = fs.readFileSync(`test/providers/tst_manifests/golang/${testCase}/go.mod`).toString()
			// invoke sut stack analysis for scenario manifest
			let providedDataForStack = await golangGoModules.provideComponent(manifestContent)
			// verify returned data matches expectation
			expect(providedDataForStack).to.deep.equal({
				ecosystem: 'golang',
				contentType: 'application/vnd.cyclonedx+json',
				content: expectedSbom
			})
			// these test cases takes ~1400-2000 ms each pr >10000 in CI (for the first test-case)
		}).timeout(process.env.GITHUB_ACTIONS ? 15000 : 10000)
	})


}).beforeAll(() => clock = sinon.useFakeTimers(new Date(2023,7,7))).afterAll(()=> clock.restore());
