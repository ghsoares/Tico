import fs from "fs";
import TicoProgram from "./runtime/tico";

const source = fs.readFileSync("src/test.tico", "utf-8");

const run = async() => {
	const start = Date.now();
	
	const program = new TicoProgram(source);
	console.log(await program.run());
	
	const elapsed = Date.now() - start;
	
	console.log(`Elapsed: ${elapsed} ms`);
}

run();