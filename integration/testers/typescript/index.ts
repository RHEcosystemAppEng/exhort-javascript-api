#!/usr/bin/env node

import exhort from '@RHEcosystemAppEng/exhort-javascript-api'
import process from 'node:process'

const [,, ...args] = process.argv

if ('stack' === args[0]) {
	// arg[1] = manifest path; arg[2] = is html boolean
	let html = args[2] === 'true'
	let res = await exhort.stackAnalysis(args[1], html)
	console.log(html ? res as string : JSON.stringify(res as exhort.AnalysisReport, null, 2))
	process.exit(0)
}
if ('component' === args[0]) {
	// arg[1] = manifest type; arg[2] = manifest content
	let res = await exhort.componentAnalysis(args[1], args[2])
	console.log(JSON.stringify(res as exhort.AnalysisReport, null, 2))
	process.exit(0)
}

console.log(`unknown action ${args}`)
process.exit(1)
