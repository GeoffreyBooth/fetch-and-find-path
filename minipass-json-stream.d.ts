declare module 'minipass-json-stream' {
	import type * as JSONStream from 'JSONStream'

	const minipassJsonStream: {
		parse: typeof JSONStream.parse
		stringify: typeof JSONStream.stringify
		stringifyObject: typeof JSONStream.stringifyObject
	}

	export default minipassJsonStream
}
