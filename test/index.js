import { ok, strictEqual } from 'node:assert'
import { it } from 'node:test'
import { fetchAndFindPath } from '../index.js'
import { slowServer } from './server.js'


it('should find the desired field in the JSON stream and stop as soon as it is found', async () => {
	const server = slowServer(100) // Start the server that streams JSON data for up to 100 chunks, or 10 seconds
	const { port } = /** @type {{ port: number }} */(server.address())
	const handle = setTimeout(() => {
		console.error('Test timed out, closing server')
		server.close(() => {
			// If we reach here, the `fetchAndFindPath` function never resolved, which is a failure
			ok(false, 'Server needed to be closed after the test')
		})
	}, 5000) // Close the server after 5 seconds

	const url = `http://localhost:${port}/` // URL of the infinite server
	const targetField = 'data3' // Field to look for in the JSON object
	const result = /** @type {{ message: string } | undefined} */(await fetchAndFindPath(url, targetField))

	strictEqual(result?.message, 'Data chunk 3', 'The result should match the expected data for data3')
	server.close()
	clearTimeout(handle)
})

it('should be faster than a traditional request that consumes the entire response and parses all of it', async () => {
	const server = slowServer(10) // Start the server that streams JSON data for up to 10 chunks, or 2 seconds
	const { port } = /** @type {{ port: number }} */(server.address())
	const url = `http://localhost:${port}/` // URL of the infinite server
	const targetField = 'data3' // Field to look for in the JSON object

	// Traditional approach: fetch the entire response and parse it
	const { request } = await import('undici')
	const startTimeTraditional = performance.now()
	const response = await request(url)
	const body = /** @type {{ [key: string]: { message: string } }} */(await response.body.json())
	const result1 = body[targetField]
	strictEqual(result1?.message, 'Data chunk 3', 'The result should match the expected data for data3')
	const elapsedTimeTraditional = performance.now() - startTimeTraditional

	const startTimeNew = Date.now()
	const result2 = /** @type {{ message: string } | undefined} */(await fetchAndFindPath(url, targetField))
	strictEqual(result2?.message, 'Data chunk 3', 'The result should match the expected data for data3')
	const elapsedTimeNew = Date.now() - startTimeNew

	strictEqual(elapsedTimeNew < elapsedTimeTraditional, true, 'The fetchAndFindPath function should be faster than the traditional request')
	server.close()
})

it('should return undefined when the requested JSON path is not found', async () => {
	const server = slowServer(10) // Start the server that streams JSON data for up to 10 chunks, or 1 second
	const { port } = /** @type {{ port: number }} */(server.address())

	const url = `http://localhost:${port}/` // URL of the infinite server
	const targetField = 'nonexistent' // Field to look for in the JSON object
	const result = await fetchAndFindPath(url, targetField)

	strictEqual(result, undefined, 'The result should be undefined for nonexistent paths')
	server.close()
})

it('throws on HTTP errors', async () => {
	const server = slowServer(10) // Start the server that streams JSON data for up to 10 chunks, or 1 second
	const { port } = /** @type {{ port: number }} */(server.address())

	const url = `http://localhost:${port}/error` // URL of the infinite server
	const targetField = 'nonexistent' // Field to look for in the JSON object
	try {
		const result = await fetchAndFindPath(url, targetField)
		ok(false, 'Expected an error to be thrown for HTTP errors')
	} catch (error) {
		strictEqual(error instanceof Error && error.message, 'HTTP error: 404 {"error":"Not Found"}', 'Should throw an error for HTTP errors')
	} finally {
		server.close()
	}
})
