import { Transform } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { request } from 'undici'
// @ts-ignore We can’t lowercase `jsonstream` because that fails in case-sensitive environments like Linux.
import { parse } from 'JSONStream' // https://github.com/dominictarr/JSONStream


/**
 * Fetches a JSON object from a URL and processes it as a stream.
 * It looks for a specific field in the JSON object and returns its value as soon as it is found.
 * @param {string} url - The URL to fetch the JSON object from.
 * @param {string | Parameters<parse>[0]} path - The field to look for in the JSON object.
 * @param {Parameters<request>[1]} [requestOptions] - Options for the Undici request.
 */
export async function fetchAndFindPath(url, path, requestOptions = {}) {
	/** @type {undefined | unknown} */
	let output
	/** @type {undefined | Error} */
	let error
	/** Whether the stream has finished successfully. */
	let finished = false

	const abortController = new AbortController()
	const { signal } = abortController

	try {
		const { statusCode, body } = await request(url, { signal, ...requestOptions })
		if (statusCode >= 400) {
			throw new Error(`HTTP error: ${statusCode} ${await body.text()}`)
		}

		// Convert the Undici response body (web stream) to a Node.js readable stream
		const readableNodeStream = Transform.from(body)

		const jsonStream = parse(path)
			.on('error', jsonStreamError => {
				error = jsonStreamError
			})

		const dataHandler = new Transform({
			objectMode: true, // JSONStream outputs objects
			transform(chunk, _encoding, callback) {
				output = chunk // Capture the found value
				finished = true
				abortController.abort() // Abort the request
				callback() // Continue the stream to allow it to close gracefully
			}
		})

		await pipeline(readableNodeStream, jsonStream, dataHandler)

		if (error) {
			throw error // If there was an error parsing the JSON, throw it
		}

		// If the pipeline completes successfully (without an unhandled error) and we haven’t found the value (finished is false), then the path wasn’t found.
		if (!finished) {
			return undefined
		}

		return output
	} catch (error) {
		if (error instanceof Error && error.name === 'AbortError') {
			// AbortError is expected when we find what we are looking for and abort the request
			if (finished) {
				return output
			} else {
				throw new Error(`Request aborted before finding JSON path "${path}".`)
			}
		} else {
			throw error
		}
	}
}
