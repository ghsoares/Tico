import TicoParser from "./language/ticoParser";
import TicoProgram from "./runtime/tico";

import fs from "fs";
import { treefy } from "./utils";

const source = fs.readFileSync("src/test.tico", 'utf-8');
const program = TicoProgram.fromSourceCode(source);

program.setStdout(what => {
	return process.stdout.write("" + what + "\n");
});

program.setStderr(what => {
	return process.stderr.write("" + what + "\n");
});

const run = async() => {
	process.stdout.write(await program.run() + "\n");
}

//run();

const str = treefy({
	title: "A object",
	propA: 10,
	probB: [ "apple", "grape"],
	probC: null,
	probD: undefined
});
console.log(str);