import TicoProgram from "./language/tico";
import fs from "fs";

const runProgram = (path: string, variables: { [key: string]: any } = {}) => {
	console.log(`Running program at path "${path}"...`);

	const sourceCode = fs.readFileSync(path, "utf-8");

	const program = TicoProgram.fromSourceCode(sourceCode, (s: any) => {
		process.stdout.write(String(s));
	}, (e) => {
		console.error(e);
	});

	const start = Date.now();
	program.run(variables);
	const elapsed = Date.now() - start;

	console.log(`Elapsed: ${elapsed} ms`);
}

runProgram('examples/pi.tico', { digits: 1000 });
runProgram('examples/fizzbuzz.tico', { count: 1000 });

