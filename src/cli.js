#!/usr/bin/env node

import exhort from './index.js'
import { hideBin } from 'yargs/helpers'
import yargs from 'yargs'

// command for component analysis take manifest type and content
const component = {
	command: 'component <manifest-name> <manifest-content>',
	desc: 'produce component report for a manifest type and content',
	builder: yargs => yargs.positional(
		'manifest-name',
		{
			desc: 'manifest name and type',
			type: 'string',
			choices: ['pom.xml']
		}
	).positional(
		'manifest-content',
		{
			desc: 'content of the manifest',
			type: 'string',
		}
	),
	handler: async args => {
		let manifestName = args['manifest-name']
		let manifestContent = args['manifest-content']
		let res = await exhort.componentAnalysis(manifestName, manifestContent)
		console.log(JSON.stringify(res, null, 2))
	}
}

// command for stack analysis takes a manifest path
const stack = {
	command: 'stack </path/to/manifest> [--html|--summary]',
	desc: 'produce stack report for manifest path',
	builder: yargs => yargs.positional(
		'/path/to/manifest',
		{
			desc: 'manifest path for analysing',
			type: 'string',
			normalize: true,
		}
	).options({
		html: {
			alias: 'r',
			desc: 'Get the report as HTML instead of JSON',
			type: 'boolean',
			conflicts: 'summary'
		},
		summary: {
			alias: 's',
			desc: 'For JSON report, get only the \'summary\'',
			type: 'boolean',
			conflicts: 'html'
		}
	}),
	handler: async args => {
		let manifest = args['/path/to/manifest']
		let html = args['html']
		let summary = args['summary']
		let res = await exhort.stackAnalysis(manifest, html)
		console.log(html ? res : JSON.stringify(
			!html && summary ? res['summary'] : res,
			null,
			2
		))
	}
}

// parse and invoke the command
yargs(hideBin(process.argv))
	.usage('Usage: $0 {component|stack}')
	.command(stack)
	.command(component)
	.version(false)
	.demandCommand(1)
	.parse()
