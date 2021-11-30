import TicoParser from "./language/ticoParser";
import TicoProgram from "./runtime/tico";
import fs from "fs";

const source = fs.readFileSync('src/test.tico', 'utf-8');

const start = Date.now();

const parser = new TicoParser();
const main = parser.parse(source);
const program = new TicoProgram(main);
const str = TicoParser.stringify(
	main,
	{ showPosition: false }
);
const astLines = str.split("\n").length - 1;

process.stdout.write(str + "\n");
process.stdout.write(`AST has ${astLines} lines\n`);

class Foo {
	public value: number;

	constructor(value: number) {
		this.value = value;
	}

	static add(a: any, b: any): Foo {
		if (a instanceof Foo && b instanceof Foo) {
			return new Foo(a.value + b.value);
		}
		if (a instanceof Foo && typeof b === 'number') {
			return new Foo(a.value + b);
		}

		return null;
	}
};

console.log(program.run({}, {
	Foo: (value: number) => new Foo(value)
}));

const elapsed = Date.now() - start;

console.log(`Elapsed: ${elapsed} ms`);