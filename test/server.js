import { createServer } from 'node:http'
import { env } from 'node:process'


/**
 * Start a server that listens on port 3000 and streams JSON data indefinitely.
 * This server will return JSON excruciatingly slowly, simulating a long-running process.
 * @param {number} stopAfter - The number of data chunks to send before stopping (default is 100).
 */
export function slowServer(stopAfter = 100) {
	const server = createServer((req, res) => {
		if (req.url === '/error') {
			// Simulate an HTTP error
			res.writeHead(404, { 'Content-Type': 'application/json' })
			res.end(JSON.stringify({ error: 'Not Found' }))
			return
		}

		res.writeHead(200, {
			'Content-Type': 'application/json', // Set Content-Type to application/json
			'Transfer-Encoding': 'chunked' // Use chunked encoding for streaming
		})

		res.write('{"start":"here",') // Start with an opening brace for a JSON object

		let counter = 0
		const intervalId = setInterval(() => {
			const data = {
				message: `Data chunk ${counter}`,
				timestamp: new Date().toISOString()
			}
			res.write(`"data${counter}": ${JSON.stringify(data)},`) // Send JSON object
			counter++

			// Stop streaming after a certain duration (optional)
			if (counter >= stopAfter) {
				clearInterval(intervalId)
				res.end('"end":"here"}') // End the response after streaming stops
			}
		}, 200) // Send a new JSON object every 200 milliseconds

		// Handle client disconnect to stop streaming
		req.on('close', () => {
			clearInterval(intervalId)
			debug('Client disconnected. Streaming stopped.')
		})
	})

	server.listen(() => {
		debug(`Server listening on ${server.address()}`)
	})

	return server
}


/**
 * @param {any[]} args
 */
function debug(...args) {
	if (env.DEBUG?.includes('slow-server')) {
		console.debug(...args)
	}
}
