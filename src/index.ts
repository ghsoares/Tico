import { stdout } from "process";
import TicoParser from "./language/ticoParser";
import TicoProgram from "./runtime/tico";


const source = `
(5 + 2) * (5 + 1);
`;

const parser = new TicoParser();

const main = parser.parse(source);
const str = TicoParser.stringify(main, { indent: "  ", showPosition: true });
const program = new TicoProgram(main);
const astLines = str.split("\n").length - 1;
process.stdout.write(str);
process.stdout.write(`AST has ${astLines} lines\n`);

class Test {
	private val: number;

	public constructor(val: number) {
		this.val = val;
	}

	public add(other: any): any {
		if (other instanceof Test) {
			return new Test(this.val + other.val);
		}
		return new Test(this.val + other);
	}

	public sub(other: any): any {
		if (other instanceof Test) {
			return new Test(this.val - other.val);
		}
		return new Test(this.val - other);
	}

	public mlt(other: any): any {
		if (other instanceof Test) {
			return new Test(this.val * other.val);
		}
		return new Test(this.val * other);
	}

	public pow(other: any): any {
		if (other instanceof Test) {
			return new Test(Math.pow(this.val, other.val));
		}
		return new Test(Math.pow(this.val, other));
	}

	public div(other: any): any {
		if (other instanceof Test) {
			return new Test(this.val / other.val);
		}
		return new Test(this.val / other);
	}

	public mod(other: any): any {
		if (other instanceof Test) {
			return new Test(this.val % other.val);
		}
		return new Test(this.val % other);
	}
}

const objA = new Test(10);
const objB = new Test(10);

console.log(program.run(
	{'a': objA, 'b': objB}
));




