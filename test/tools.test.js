import { getCustom, getCustomPath } from "../src/tools.js"
import { afterEach } from 'mocha'
import { expect } from 'chai'

suite('testing the various tools and utility functions', () => {
	suite('test the getCustom utility function', () => {
		afterEach(() => delete process.env['DUMMY_KEY'])

		test('when exists as environment variable and opts, return environment variables value', () => {
			process.env['DUMMY_KEY'] = 'dummy-env-value'
			let opts = { 'DUMMY_KEY': 'dummy-opts-value' }
			let fetchedValue = getCustom('DUMMY_KEY', 'dummy-default-value', opts)
			expect(fetchedValue).to.equal('dummy-env-value')
		})

		test('when no environment variable but exists as opts, return opts value', () => {
			let opts = { 'DUMMY_KEY': 'dummy-opts-value' }
			let fetchedValue = getCustom('DUMMY_KEY', 'dummy-default-value', opts)
			expect(fetchedValue).to.equal('dummy-opts-value')
		})

		test('when no environment variable and no opts, return default value', () => {
			let fetchedValue = getCustom('DUMMY_KEY', 'dummy-default-value')
			expect(fetchedValue).to.equal('dummy-default-value')
		})
	})

	suite('test the getCustomPath utility function', () => {
		afterEach(() => delete process.env['EXHORT_DUMMY_PATH'])

		test('when exists as environment variable and opts, return environment variables value', () => {
			process.env['EXHORT_DUMMY_PATH'] = 'dummy-env-value'
			let opts = { 'EXHORT_DUMMY_PATH': 'dummy-opts-value' }
			let fetchedValue = getCustomPath('dummy', opts)
			expect(fetchedValue).to.equal('dummy-env-value')
		})

		test('when no environment variable but exists as opts, return opts value', () => {
			let opts = { 'EXHORT_DUMMY_PATH': 'dummy-opts-value' }
			let fetchedValue = getCustomPath('dummy', opts)
			expect(fetchedValue).to.equal('dummy-opts-value')
		})

		test('when no environment variable and no opts, return default value', () => {
			let fetchedValue = getCustomPath('dummy')
			expect(fetchedValue).to.equal('dummy')
		})

	})
})
