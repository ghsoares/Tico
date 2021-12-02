import TicoParser from "./language/ticoParser";
import TicoProgram from "./runtime/tico";

import fs from "fs";

const source = fs.readFileSync("src/test.tico", 'utf-8');
const program = TicoProgram.fromSourceCode(source);

const run = async() => {
	process.stdout.write(await program.run() + "\n");
}

run();
