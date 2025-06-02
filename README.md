# Fetch and Find Path

A function that starts downloading JSON from a URL, looking for a specified object path, and returns that object as soon as it is found.

## Installation

```shell
npm install https://github.com/GeoffreyBooth/fetch-and-find-path
```

## Usage

```js
import { fetchAndFindPath } from 'fetch-and-find-path'

const url = 'https://nodejs.org/dist/index.json' // A 294 KB JSON file with data about Node.js releases
const path = '0.version' // But we only want the first object in the array (the latest Node.js version)

try {
	const latestNodeVersion = await fetchAndFindPath(url, path) // Get just that first object and stop
	console.log('The latest Node.js version is %s', latestNodeVersion)
} catch (error) {
	console.error(error)
}
```
