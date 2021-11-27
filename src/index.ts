import TicoParser from "./language/ticoParser";
import TicoProgram from "./runtime/tico";
import { unescapeString } from "./utils";
import fs from "fs";

const source = fs.readFileSync('src/test.tico', 'utf-8');

const parser = new TicoParser();

const main = parser.parse(source);
const str = TicoParser.stringify(
	main,
	{ showPosition: false }
);
const program = new TicoProgram(main);
const astLines = str.split("\n").length - 1;

process.stdout.write(str + "\n");
process.stdout.write(`AST has ${astLines} lines\n`);

program.run({}, {
	'write': (...args: any[]) => {
		process.stdout.write(unescapeString(args.join("")));
	},
	'writeLine': (...args: any[]) => {
		process.stdout.write(unescapeString(args.join("")) + "\n");
	},

});
