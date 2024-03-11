#!/usr/bin/env node

import exhort from './index.js'
import { hideBin } from 'yargs/helpers'
import yargs from 'yargs'
import * as path from "path";

// command for component analysis take manifest type and content
const component = {
	command: 'component <manifest-name> <manifest-content>',
	desc: 'produce component report for a manifest type and content',
	builder: yargs => yargs.positional(
		'manifest-name',
		{
			desc: 'manifest name and type',
			type: 'string',
			choices: ['pom.xml','package.json', 'go.mod', 'requirements.txt']

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
const validateToken = {
	command: 'validate-token <token-provider> [--token-value thevalue]',
	desc: 'Validates input token if authentic and authorized',
	builder: yargs => yargs.positional(
		'token-provider',
		{
			desc: 'the token provider',
			type: 'string',
			choices: ['snyk','oss-index'],
		}
	).options({
		tokenValue: {
			alias: 'value',
			desc: 'the actual token value to be checked',
			type: 'string',
		}
	}),
	handler: async args => {
		let tokenProvider = args['token-provider'].toUpperCase()
		let opts={}
		if(args['tokenValue'] !== undefined && args['tokenValue'].trim() !=="" ) {
			let tokenValue = args['tokenValue'].trim()
			opts[`EXHORT_${tokenProvider}_TOKEN`] = tokenValue
		}
		let res = await exhort.validateToken(opts)
		console.log(res)
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
		let theProvidersSummary = new Map();
		let theProvidersObject ={}
		let res = await exhort.stackAnalysis(manifest, html)
		if(summary)
		{
			for (let provider in res.providers ) {
				if (res.providers[provider].sources !== undefined) {
					for(let source in res.providers[provider].sources ) {
						if(res.providers[provider].sources[source].summary) {
							theProvidersSummary.set(source,res.providers[provider].sources[source].summary)
						}
					}
				}
			}
			for (let [provider, providerSummary] of theProvidersSummary) {
				theProvidersObject[provider]=providerSummary
			}
		}
		console.log(html ? res : JSON.stringify(
			!html && summary ? theProvidersObject : res,
			null,
			2
		))
	}
}

// parse and invoke the command
yargs(hideBin(process.argv))
	.usage(`Usage: ${process.argv[0].includes("node") ?  path.parse(process.argv[1]).base : path.parse(process.argv[0]).base} {component|stack|validate-token}`)
	.command(stack)
	.command(component)
	.command(validateToken)
	.scriptName('')
	.version(false)
	.demandCommand(1)
	.wrap(null)
	.parse()
