import { expect } from 'chai'
import fs from 'fs'
import sinon from "sinon";
// import exhort from "../../dist/src/index.js"
import javaMvnProvider from '../../src/providers/java_maven.js'
import {rewireProvider} from "./test-utils.js";
let clock

let javaMvnProviderRewire = await rewireProvider("src/providers/java_maven")

/** this function is parsing the outputfile path from the given command, and write that file the providerContent supplied.
 *
 * @param {string}command - the command string to be executed
 * @param {string}providerContent - the content of the mocked data to replace original content in intercepted temp file
 * @param {string} outputFileParameter - name of the parameter indicating the output file of the command invocation, including '='.
 * @private
 */
function interceptAndOverwriteDataWithMock(command, providerContent, outputFileParameter) {
	let length = outputFileParameter.length;
	let indexOf = command.indexOf(outputFileParameter);
	let outputFileTokenPlusRest = command.substring(indexOf + length);
	let endOfOutputFile = outputFileTokenPlusRest.indexOf("-f");
	let interceptedFilePath = outputFileTokenPlusRest.substring(0, endOfOutputFile).trim()
	fs.writeFileSync(interceptedFilePath, providerContent)
}

suite('testing the java-maven data provider', () => {

	[
		{name: 'pom.xml', expected: true},
		{name: 'some_other.file', expected: false}
	].forEach(testCase => {
		test(`verify isSupported returns ${testCase.expected} for ${testCase.name}`, () =>
			expect(javaMvnProvider.isSupported(testCase.name)).to.equal(testCase.expected)
		)
	});

	[
		"poms_deps_with_2_ignore_long",
		"pom_deps_with_ignore_on_artifact",
		"pom_deps_with_ignore_on_dependency",
		"pom_deps_with_ignore_on_group",
		"pom_deps_with_ignore_on_version",
		"pom_deps_with_ignore_on_wrong",
		"pom_deps_with_no_ignore",
		"poms_deps_with_ignore_long",
		"poms_deps_with_no_ignore_long",
		"pom_deps_with_no_ignore_common_paths"
	].forEach(testCase => {
		let scenario = testCase.replace('pom_deps_', '').replaceAll('_', ' ')
		// test(`custom adhoc test`, async () => {
		//
		// 	// let options = {
		// 	// 	'EXHORT_SNYK_TOKEN': 'insert-token'
		// 	// }
		// 	// let httpStatus = await exhort.validateToken(options);
		// 	analysisReport = await exhort.stackAnalysis(`/tmp/pom-xml/pom.xml`,false);
		// 	console.log(analysisReport)
		// 	let pom = fs.readFileSync(`/tmp/pom-xml/pom.xml`,).toString().trim()
		// 	let analysisReport = await exhort.componentAnalysis("pom.xml", pom);
		// 	console.log(analysisReport)
		// 	analysisReport = await exhort.stackAnalysis(`/tmp/pom-xml/pom.xml`,true);
		// 	console.log(analysisReport)
		//
		// }).timeout(process.env.GITHUB_ACTIONS ? 30000 : 5000)

		test(`verify maven data provided for stack analysis with scenario ${scenario}`, async () => {
			// load the expected graph for the scenario
			let expectedSbom = fs.readFileSync(`test/providers/tst_manifests/maven/${testCase}/stack_analysis_expected_sbom.json`,).toString()
			let dependencyTreeTextContent = fs.readFileSync(`test/providers/tst_manifests/maven/${testCase}/dep-tree.txt`,).toString()
			expectedSbom = JSON.stringify(JSON.parse(expectedSbom))
			let mockedExecFunction = function(command){
				if(command.includes(":tree")){
					interceptAndOverwriteDataWithMock(command,dependencyTreeTextContent,"DoutputFile=")
				}
			}
			javaMvnProviderRewire.__set__('execSync',mockedExecFunction)
			// invoke sut stack analysis for scenario manifest
			let providedDataForStack = await javaMvnProviderRewire.__get__("provideStack")(`test/providers/tst_manifests/maven/${testCase}/pom.xml`)
			javaMvnProviderRewire.__ResetDependency__()
			// verify returned data matches expectation
			expect(providedDataForStack).to.deep.equal({
				ecosystem: 'maven',
				contentType: 'application/vnd.cyclonedx+json',
				content: expectedSbom
			})

		// these test cases takes ~2500-2700 ms each pr >10000 in CI (for the first test-case)
		}).timeout(process.env.GITHUB_ACTIONS ? 40000 : 10000)

		test(`verify maven data provided for component analysis with scenario ${scenario}`, async () => {
			// load the expected list for the scenario
			let expectedSbom = fs.readFileSync(`test/providers/tst_manifests/maven/${testCase}/component_analysis_expected_sbom.json`,).toString().trim()
			// read target manifest file
			expectedSbom = JSON.stringify(JSON.parse(expectedSbom))
			let effectivePomContent = fs.readFileSync(`test/providers/tst_manifests/maven/${testCase}/effective-pom.xml`,).toString()
			let manifestContent = fs.readFileSync(`test/providers/tst_manifests/maven/${testCase}/pom.xml`).toString()
			let mockedExecFunction = function(command){
				if(command.includes(":effective-pom")){
					interceptAndOverwriteDataWithMock(command, effectivePomContent,"Doutput=");
				}
			}
			javaMvnProviderRewire.__set__('execSync',mockedExecFunction)
			// invoke sut component analysis for scenario manifest
			let providedDataForStack = await javaMvnProviderRewire.__get__("provideComponent")(manifestContent)
			// verify returned data matches expectation
			expect(providedDataForStack).to.deep.equal({
				ecosystem: 'maven',
				contentType: 'application/vnd.cyclonedx+json',
				content: expectedSbom
			})
			javaMvnProviderRewire.__ResetDependency__()
			// these test cases takes ~1400-2000 ms each pr >10000 in CI (for the first test-case)
		}).timeout(process.env.GITHUB_ACTIONS ? 15000 : 5000)
		// these test cases takes ~1400-2000 ms each pr >10000 in CI (for the first test-case)

	})
}).beforeAll(() => clock = sinon.useFakeTimers(new Date('2023-08-07T00:00:00.000Z'))).afterAll(()=> {clock.restore()});
