import { beforeEach } from 'mocha'
import chai from 'chai'
import sinon from 'sinon'
import sinonChai from "sinon-chai";

const expect = chai.expect

chai.use(sinonChai)

suite.skip('testing the application starting point', () => {
	let requestComponentFake // fake requestComponent function - will be used for sending request
	let requestStackFake // fake stackAnalysis function - will be used for sending request
	let analysisModuleDummy // fake analysis module - will include the above functions and rewired to the sut

	let fakeProvidedData // fake provided data that will be returned by both provideStack and provideComponent funcs
	let provideComponentDataStub // stub provideComponent function - will provide fake component content for analysis
	let provideStackDataStub // stub provideComponent function - will provide fake stack content for analysis
	let providerDummy // dummy provider - will be rewired by the getProvider utility function
	let providerModuleDummy // dummy provider module - will return the fake provider

	let sut // index module subject under test

	beforeEach(async () => {
		// create fake functions used for sending analysis request
		requestComponentFake = sinon.fake()
		requestStackFake = sinon.fake()
		// create a dummy analysis module using the above function fakes
		analysisModuleDummy = {
			requestComponent: requestComponentFake,
			requestStack: requestStackFake
		}
		// create fake data that will be returned by both provideComponent and provideStack
		fakeProvidedData = {
			ecosystem: 'fake-ecosystem-for-manifest-type',
			content: 'fake-content-for-send-to-backend',
			contentType: 'type-of-fake-content'
		}
		// stub the provideComponent function to return the fake provided data
		provideComponentDataStub = sinon.stub()
		provideComponentDataStub.returns(fakeProvidedData)
		// stub the provideStack function to return the fake provided data
		provideStackDataStub = sinon.stub()
		provideStackDataStub.returns(fakeProvidedData)
		// create a dummy provider module using the above function fakes
		providerDummy = {
			provideComponent: provideComponentDataStub,
			provideStack: provideStackDataStub
		}
		// stub the provider module dummy to return thr dummy provider
		providerModuleDummy = sinon.stub()
		providerModuleDummy.returns(providerDummy)

		// short circuit the fs module used for verifying manifests are accessible
		let feModuleDummy = {
			accessSync: sinon.fake(),
			constants: {
				R_OK: 999
			}
		}
		// short circuit verifying manifests are accessible
		// mockImport('node:fs', {...feModuleDummy})
		// // rewire the analysis and provider modules with the dummy modules
		// mockImport('#root/src/provider', providerModuleDummy)
		// mockImport('#root/src/analysis', analysisModuleDummy)
		// // instantiate the subject under test
		// sut = reImport('#root/src/index.js')
	})

	test('invoking componentAnalysis should get a provider, provide data, and request analysis', async () => {
		await sut.componentAnalysis('dummy.manifest', 'dummy-manifest-data')

		expect(providerModuleDummy).to.be.calledOnceWith('dummy.manifest')
		expect(provideComponentDataStub).to.be.calledOnceWith('dummy-manifest-data')
		expect(requestComponentFake).to.be.calledOnceWith(fakeProvidedData, sinon.match.string)
	})

	test('invoking stackAnalysis defaults to JSON should get a provider, provide data, and request analysis', async () => {
		await sut.stackAnalysis('/path/to/dummy.manifest')

		expect(providerModuleDummy).to.be.calledOnceWith('/path/to/dummy.manifest')
		expect(provideStackDataStub).to.be.calledOnceWith()
		expect(requestStackFake).to.be.calledOnceWith(fakeProvidedData, sinon.match.string, false)
	})

	test('invoking stackAnalysis for HTML should get a provider, provide data, and request analysis', async () => {
		await sut.stackAnalysis('/path/to/dummy.manifest', true)

		expect(providerModuleDummy).to.be.calledOnceWith('/path/to/dummy.manifest')
		expect(provideStackDataStub).to.be.calledOnceWith()
		expect(requestStackFake).to.be.calledOnceWith(fakeProvidedData, sinon.match.string, true)
	})
})
