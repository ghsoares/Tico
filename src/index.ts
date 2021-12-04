import TicoParser from "./language/ticoParser";
import fs from "fs";

const replicate = `while (true) {
	for (i = 0; i < 1024; i = i + 1) {
		32 + 16;
		function ref(a, b) {
			if (a > 16) {
				return a + b;
			}
			return a + b + 16;
		}

		while (true) {
			ref(2048 + 4096, 128 * 256);
			ref(128 + 256, 2048 * 4096);
		}
	}
}`;
const numChars = replicate.length;
const numLines = replicate.split("\n").length;

const max = 200;
const plotedData: [number, number][] = [];

for (let i = 1; i <= max; i++) {
	const source = replicate.repeat(i);

	const start = Date.now();

	for (let j = 0; j < 10; j++) {
		const parser = new TicoParser();
		parser.parse(source);
	}

	const elapsed = (Date.now() - start) / 10;

	const testNumChars = i * numChars;
	const testNumLines = i * numLines;

	console.log(`test ${i}/${max}: ${testNumChars} chars (${testNumLines} lines): ${elapsed} mean ms`);

	plotedData.push([testNumLines, elapsed]);
}

console.log(JSON.stringify(plotedData));




