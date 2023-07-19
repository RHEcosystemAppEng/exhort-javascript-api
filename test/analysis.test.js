import { afterEach } from 'mocha'
import analysis from '../src/analysis.js'
import { expect } from 'chai'
import { rest } from 'msw'
import { setupServer } from 'msw/node'
import sinon from 'sinon'

// utility function creating a dummy server, intercepting a handler,
// running a test, and shutting the server down
function interceptAndRun(handler, test) {
	return async () => {
		let server = setupServer(handler)
		server.listen()

		return Promise.resolve(test(server))
			.finally(() => {
				server.resetHandlers()
				server.close()
			});
	};
}

suite('testing the analysis module for sending api requests', () => {
	let backendUrl = 'http://url.lru' // dummy backend url will be used for fake server
	// fake provided data, in prod will be provided by the provider and used for creating requests
	let fakeProvided = {
		ecosystem: 'dummy-ecosystem',
		content: 'dummy-content',
		contentType: 'dummy-content-type'
	};

	test('invoking the requestComponent should return a json report', interceptAndRun(
		rest.post(`${backendUrl}/api/v3/component-analysis/${fakeProvided.ecosystem}`, (req, res, ctx) => {
			// interception route, will return ok response for our fake content type
			if (fakeProvided.contentType === req.headers.get('content-type')) {
				return res(ctx.json({dummy: 'response'}))
			}
			return res(ctx.status(400))
		}),
		async () => {
			let fakeContent = 'i-am-manifest-content'
			// stub the provideComponent function to return the fake provided data for our fake manifest
			let componentProvideStub = sinon.stub()
			componentProvideStub.withArgs(fakeContent).returns(fakeProvided)
			// fake providers hosts our stubbed provideStack function
			let fakeProvider = {
				provideComponent: componentProvideStub,
				provideStack: () => {}, // not required for this test
				isSupported: () => {} // not required for this test
			}

			// verify response as expected
			let res = await analysis.requestComponent(fakeProvider, fakeContent, backendUrl)
			expect(res).to.deep.equal({dummy: 'response'})
		}
	))

	suite('testing the requestStack function', () => {
		let fakeManifest = 'fake-file.typ'
		// stub the provideStack function to return the fake provided data for our fake manifest
		let stackProviderStub = sinon.stub()
		stackProviderStub.withArgs(fakeManifest).returns(fakeProvided)
		// fake providers hosts our stubbed provideStack function
		let fakeProvider = {
			provideComponent: () => {}, // not required for this test
			provideStack: stackProviderStub,
			isSupported: () => {} // not required for this test
		}

		test('invoking the requestStack for html should return a string report', interceptAndRun(
			// interception route, will return ok response for our fake content type
			rest.post(`${backendUrl}/api/v3/dependency-analysis/${fakeProvided.ecosystem}`, (req, res, ctx) => {
				if (fakeProvided.contentType === req.headers.get('content-type')) {
					return res(ctx.text('<html lang="en">html-content</html>'))
				}
				return res(ctx.status(400))
			}),
			async () => {
				// verify response as expected
				let res = await analysis.requestStack(fakeProvider, fakeManifest, backendUrl, true)
				expect(res).to.equal('<html lang="en">html-content</html>')
			}
		))

		test('invoking the requestStack for non-html should return a json report', interceptAndRun(
			// interception route, will return ok response for our fake content type
			rest.post(`${backendUrl}/api/v3/dependency-analysis/${fakeProvided.ecosystem}`, (req, res, ctx) => {
				if (fakeProvided.contentType === req.headers.get('content-type')) {
					return res(ctx.json({dummy: 'response'}))
				}
				return res(ctx.status(400))
			}),
			async () => {
				// verify response as expected
				let res = await analysis.requestStack(fakeProvider, fakeManifest, backendUrl)
				expect(res).to.deep.equal({dummy: 'response'})
			}
		))
	})

	suite('verify environment variables to token headers mechanism', () => {
		let fakeManifest = 'fake-file.typ'
		// stub the provideStack function to return the fake provided data for our fake manifest
		let stackProviderStub = sinon.stub()
		stackProviderStub.withArgs(fakeManifest).returns(fakeProvided)
		// fake providers hosts our stubbed provideStack function
		let fakeProvider = {
			provideComponent: () => {}, // not required for this test
			provideStack: stackProviderStub,
			isSupported: () => {} // not required for this test
		};

		afterEach(() => delete process.env['EXHORT_SNYK_TOKEN'])

		test('when the relevant token environment variables are set, verify corresponding headers are included', interceptAndRun(
			// interception route, will return ok response if found the expected token
			rest.post(`${backendUrl}/api/v3/dependency-analysis/${fakeProvided.ecosystem}`, (req, res, ctx) => {
				if ('dummy-snyk-token' === req.headers.get('ex-snyk-token')) {
					return res(ctx.json({ok: 'ok'}))
				}
				return res(ctx.status(400))
			}),
			async () => {
				process.env['EXHORT_SNYK_TOKEN'] = 'dummy-snyk-token'
				let res = await analysis.requestStack(fakeProvider, fakeManifest, backendUrl)
				expect(res).to.deep.equal({ok: 'ok'})
			}
		))

		test('when the relevant token environment variables are not set, verify no corresponding headers are included', interceptAndRun(
			// interception route, will return ok response if found the expected token
			rest.post(`${backendUrl}/api/v3/dependency-analysis/${fakeProvided.ecosystem}`, (req, res, ctx) => {
				if (!req.headers.get('ex-snyk-token')) {
					return res(ctx.json({ok: 'ok'}))
				}
				return res(ctx.status(400))
			}),
			async () => {
				let res = await analysis.requestStack(fakeProvider, fakeManifest, backendUrl)
				expect(res).to.deep.equal({ok: 'ok'})
			}
		))
	})
})
