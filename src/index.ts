import TicoParser from "./language/ticoParser";
import TicoProgram from "./runtime/tico";
import { fromHex, unescapeString } from "./utils";
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

class Foo {
	private value: number;

	constructor(value: number) {
		this.value = value;
	}

	add(a: any, b: any) {
		if (a instanceof Foo && b instanceof Foo) {
			return new Foo(a.value + b.value);
		}
		return null;
	}

	mod(a: any, b: any) {
		if (a instanceof Foo && b instanceof Foo) {
			return new Foo(a.value % b.value);
		}
		return null;
	}

	equals(a: any, b: any) {
		if (a instanceof Foo && b instanceof Foo) {
			return a.value === b.value;
		}
		return false;
	}
}

const a = new Foo(9);
const b = new Foo(9);

process.stdout.write(str + "\n");
process.stdout.write(`AST has ${astLines} lines\n`);

console.log(program.run({a, b}));