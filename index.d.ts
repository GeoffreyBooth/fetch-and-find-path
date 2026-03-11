import type { request } from 'undici'

export type JsonStreamPath = string | unknown[]

export declare function fetchAndFindPath(
	url: string,
	path: JsonStreamPath,
	requestOptions?: Parameters<typeof request>[1]
): Promise<unknown | undefined>
