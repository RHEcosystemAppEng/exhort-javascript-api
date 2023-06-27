import fs from 'fs'
import http from 'http'
import path from 'path'

let args = process.argv.slice(1)

let scenarios = path.resolve(args[0], '..', '..', 'scenarios')
let config = JSON.parse(fs.readFileSync(args[1]).toString())

function listener (req, res) {
	// reject non-POST requests
	if ('POST' !== req.method) {
		res.writeHead(405)
		res.end(`${req.method} not allowed`)
		return
	}
	// reject requests without a body
	if (!req.headers['content-length']) {
		res.writeHead(411)
		res.end('payload required')
		return
	}
	// reject if unknown endpoint
	let stripEcosystem = req.url.slice(0, req.url.lastIndexOf('/'))
	if (!Object.values(config['endpoints']).includes(stripEcosystem)) {
		res.writeHead(404)
		res.end(`unknown endpoint ${req.url}`)
		return
	}
	// iterate over all supported ecosystems
	let accept = req.headers['accept']
	for (let ecosystem in config['ecosystems']) {
		// handle component analysis for current ecosystem
		if (`${config['endpoints']['component']}/${ecosystem}` === req.url) {
			// reject unsupported media types requests
			if (!'application/json' === accept) {
				res.writeHead(415)
				res.end(`${accept} is not supported`)
				return
			}
			// load expected request from file
			let requestBodyFile = config['ecosystems'][ecosystem]['component']['request']['body']
			let expectedRequestBody = fs.readFileSync(
				path.resolve(scenarios, ecosystem, requestBodyFile)
			)
			// load return response from file
			let responseFile = config['ecosystems'][ecosystem]['component']['response']['json']
			let componentResponse = fs.readFileSync(
				path.resolve(scenarios, ecosystem, responseFile)
			)
			// operate on body
			req.on('data', data => {
				if (expectedRequestBody.toString().replace(/\s+/g, '')
					=== data.toString().replace(/\s+/g, '')) {
					// if body as expected
					res.setHeader('ContentType', 'application/json')
					res.end(componentResponse.toString())
					return
				}
				res.writeHead(400)
				res.end('payload not as expected')
			})
		}
		// handle stack analysis for current ecosystem
		if (`${config['endpoints']['stack']}/${ecosystem}` === req.url) {
			// reject unsupported media types requests
			if (!['application/json', 'text/html'].includes(accept)) {
				res.writeHead(415)
				res.end(`${accept} is not supported`)
				return
			}
			// if requested stack json report
			if ('application/json' === accept) {
				// load expected request from file
				let requestBodyFile = config['ecosystems'][ecosystem]['stack']['request']['body']
				let expectedRequestBody = fs.readFileSync(
					path.resolve(scenarios, ecosystem, requestBodyFile)
				)
				// load return response from file
				let responseFile = config['ecosystems'][ecosystem]['stack']['response']['json']
				let stackResponse = fs.readFileSync(
					path.resolve(scenarios, ecosystem, responseFile)
				)
				// operate on body
				req.on('data', data => {
					if (expectedRequestBody.toString().replace(/\s+/g, '')
						=== data.toString().replace(/\s+/g, '')) {
						// if body as expected
						res.setHeader('ContentType', 'application/json')
						res.end(stackResponse.toString())
						return
					}
					res.writeHead(400)
					res.end('payload not as expected')
				})
			}
			// if requested stack html report
			if ('text/html' === accept) {
				// load expected request from file
				let requestBodyFile = config['ecosystems'][ecosystem]['stack']['request']['body']
				let expectedRequestBody = fs.readFileSync(
					path.resolve(scenarios, ecosystem, requestBodyFile)
				)
				// load return response from file
				let responseFile = config['ecosystems'][ecosystem]['stack']['response']['html']
				let stackResponse = fs.readFileSync(
					path.resolve(scenarios, ecosystem, responseFile)
				)
				// operate on body
				req.on('data', data => {
					if (expectedRequestBody.toString().replace(/\s+/g, '')
						=== data.toString().replace(/\s+/g, '')) {
						// if body as expected
						res.setHeader('ContentType', 'text/html')
						res.end(stackResponse.toString())
						return
					}
					res.writeHead(400)
					res.end('payload not as expected')
				})
			}
		}
	}
}

// create and start the server
let server = http.createServer(listener)
server.listen(config['port'], config['host'])
// close server after configured seconds
server.close(async () => {
	await new Promise(resolve => setTimeout(resolve, config['up_for'] * 1000))
	process.exit(0)
})
