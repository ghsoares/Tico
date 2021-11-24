import TicoProgram from "./language/tico";
import fs from "fs";

const runProgram = (path: string) => {
	console.log(`Running program at path "${path}"...`);
	const start = Date.now();

	const sourceCode = fs.readFileSync(path, "utf-8");

	const program = TicoProgram.fromSourceCode(sourceCode);
	program.onStdOut = (...args: any[]) => {
		process.stdout.write(args.join(""));
	}
	program.onStdErr = (...args: any[]) => {
		process.stderr.write(args.join(""));
	}

	const parseElapsed = Date.now() - start;

	program.run();

	const elapsed = Date.now() - start;
	console.log(`Total elapsed: ${elapsed} ms Parsing: ${parseElapsed} ms Run: ${elapsed - parseElapsed} ms`);
}

//runProgram('examples/gameOfLife.tico');

runProgram('src/test.tico');