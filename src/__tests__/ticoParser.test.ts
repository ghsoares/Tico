import TicoParser, { StringifyOptions } from "../language/ticoParser";
import TicoProgram, { } from "../runtime/tico";
import { TreefyOptions } from "../utils";

describe('testing tico parser', () => {
	const parser = new TicoParser();
	const indent = "  ";
	const strigifyOptions: StringifyOptions = { showPosition: false };
	const treefyOptions: TreefyOptions = { colors: false };

	test('Parses empty string', () => {
		const node = parser.parse("");
		expect(TicoParser.stringify(node, strigifyOptions, treefyOptions)).toMatchSnapshot();
	});

	describe('Parses binary operators', () => {
		test('Addition', () => {
			const node = parser.parse("3 + 4");
			expect(TicoParser.stringify(node, strigifyOptions, treefyOptions)).toMatchSnapshot();
		});

		test('Subtraction', () => {
			const node = parser.parse("3 - 4");
			expect(TicoParser.stringify(node, strigifyOptions, treefyOptions)).toMatchSnapshot();
		});

		test('Multiplication', () => {
			const node = parser.parse("3 * 4");
			expect(TicoParser.stringify(node, strigifyOptions, treefyOptions)).toMatchSnapshot();
		});

		test('Power', () => {
			const node = parser.parse("3 ** 4");
			expect(TicoParser.stringify(node, strigifyOptions, treefyOptions)).toMatchSnapshot();
		});

		test('Division', () => {
			const node = parser.parse("3 / 4");
			expect(TicoParser.stringify(node, strigifyOptions, treefyOptions)).toMatchSnapshot();
		});

		test('Floor division', () => {
			const node = parser.parse("3 // 4");
			expect(TicoParser.stringify(node, strigifyOptions, treefyOptions)).toMatchSnapshot();
		});

		test('Modulus', () => {
			const node = parser.parse("3 % 4");
			expect(TicoParser.stringify(node, strigifyOptions, treefyOptions)).toMatchSnapshot();
		});

		test('Unsigned modulus', () => {
			const node = parser.parse("3 %% 4");
			expect(TicoParser.stringify(node, strigifyOptions, treefyOptions)).toMatchSnapshot();
		});
	});

	describe('Throws errors', () => {
		test('Unexpected token', () => {
			expect(() => parser.parse("$")).toThrowError(`Unexpected token [$]`);
		});

		test('Expected expression member', () => {
			expect(() => parser.parse("10 + ")).toThrowError(`Expected expression member`);
		});

		test('Unexpected token', () => {
			expect(() => parser.parse("+ 10")).toThrowError(`Unexpected token [+]`);
		});
	});

	describe('Test scripts', () => {
		describe('Mathematical operations', () => {
			test('3 + 5', () => {
				const program = TicoProgram.fromSourceCode("3 + 5");
				expect(program.run()).toBe(8);
			});

			test('3 - 5', () => {
				const program = TicoProgram.fromSourceCode("3 - 5");
				expect(program.run()).toBe(-2);
			});

			test('45 * 3', () => {
				const program = TicoProgram.fromSourceCode("45 * 3");
				expect(program.run()).toBe(135);
			});

			test('32 ** 2', () => {
				const program = TicoProgram.fromSourceCode("32 ** 2");
				expect(program.run()).toBe(1024);
			});

			test('45 / 5', () => {
				const program = TicoProgram.fromSourceCode("45 / 5");
				expect(program.run()).toBe(9);
			});

			test('46 % 5', () => {
				const program = TicoProgram.fromSourceCode("46 % 5");
				expect(program.run()).toBe(1);
			});

			test('-35 %% 3', () => {
				const program = TicoProgram.fromSourceCode("-35 %% 3");
				expect(program.run()).toBe(1);
			});

			test('35 * 10 + 75 * 20', () => {
				const program = TicoProgram.fromSourceCode("35 * 10 + 75 * 20");
				expect(program.run()).toBe(1850);
			});
		});

		describe('Function expressions', () => {
			test('Simple sum function', () => {
				const program = TicoProgram.fromSourceCode(
					`function sum(a, b) {a + b}
					sum(10, 20)`
				);
				expect(program.run()).toBe(30);
			});

			test('Default value', () => {
				const program = TicoProgram.fromSourceCode(
					`function greeting(name, preffix = "Hello ") {preffix + name}
					greeting("Gabriel")`
				);
				expect(program.run()).toBe("Hello Gabriel");
			});

			test('Default value expression', () => {
				const program = TicoProgram.fromSourceCode(
					`a = 10; b = 20;
					function multiply(c, d = a + b) {return c * d}
					multiply(30)`
				);
				expect(program.run()).toBe(900);
			});

			test('Default value expression order of execution', () => {
				const program = TicoProgram.fromSourceCode(
					`a = 10; b = 20;
					function multiply(c, d = a + b) {return c * d}
					a = 30; b = 500;
					multiply(30)`
				);
				expect(program.run()).toBe(15900);
			});
		});
	});
});




