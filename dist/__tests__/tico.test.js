"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ticoParser_1 = __importDefault(require("../language/ticoParser"));
const tico_1 = __importDefault(require("../runtime/tico"));
describe('testing tico parser', () => {
    const parser = new ticoParser_1.default();
    const indent = "  ";
    const strigifyOptions = { showPosition: false };
    const treefyOptions = { colors: false };
    test('Parses empty string', () => {
        const node = parser.parse("");
        expect(ticoParser_1.default.stringify(node, strigifyOptions, treefyOptions)).toMatchSnapshot();
    });
    describe('Parses binary operators', () => {
        test('Addition', () => {
            const node = parser.parse("3 + 4");
            expect(ticoParser_1.default.stringify(node, strigifyOptions, treefyOptions)).toMatchSnapshot();
        });
        test('Subtraction', () => {
            const node = parser.parse("3 - 4");
            expect(ticoParser_1.default.stringify(node, strigifyOptions, treefyOptions)).toMatchSnapshot();
        });
        test('Multiplication', () => {
            const node = parser.parse("3 * 4");
            expect(ticoParser_1.default.stringify(node, strigifyOptions, treefyOptions)).toMatchSnapshot();
        });
        test('Power', () => {
            const node = parser.parse("3 ** 4");
            expect(ticoParser_1.default.stringify(node, strigifyOptions, treefyOptions)).toMatchSnapshot();
        });
        test('Division', () => {
            const node = parser.parse("3 / 4");
            expect(ticoParser_1.default.stringify(node, strigifyOptions, treefyOptions)).toMatchSnapshot();
        });
        test('Floor division', () => {
            const node = parser.parse("3 // 4");
            expect(ticoParser_1.default.stringify(node, strigifyOptions, treefyOptions)).toMatchSnapshot();
        });
        test('Modulus', () => {
            const node = parser.parse("3 % 4");
            expect(ticoParser_1.default.stringify(node, strigifyOptions, treefyOptions)).toMatchSnapshot();
        });
        test('Unsigned modulus', () => {
            const node = parser.parse("3 %% 4");
            expect(ticoParser_1.default.stringify(node, strigifyOptions, treefyOptions)).toMatchSnapshot();
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
                const program = tico_1.default.fromSourceCode("3 + 5");
                expect(program.run()).toBe(8);
            });
            test('3 - 5', () => {
                const program = tico_1.default.fromSourceCode("3 - 5");
                expect(program.run()).toBe(-2);
            });
            test('45 * 3', () => {
                const program = tico_1.default.fromSourceCode("45 * 3");
                expect(program.run()).toBe(135);
            });
            test('32 ** 2', () => {
                const program = tico_1.default.fromSourceCode("32 ** 2");
                expect(program.run()).toBe(1024);
            });
            test('45 / 5', () => {
                const program = tico_1.default.fromSourceCode("45 / 5");
                expect(program.run()).toBe(9);
            });
            test('46 % 5', () => {
                const program = tico_1.default.fromSourceCode("46 % 5");
                expect(program.run()).toBe(1);
            });
            test('-35 %% 3', () => {
                const program = tico_1.default.fromSourceCode("-35 %% 3");
                expect(program.run()).toBe(1);
            });
            test('35 * 10 + 75 * 20', () => {
                const program = tico_1.default.fromSourceCode("35 * 10 + 75 * 20");
                expect(program.run()).toBe(1850);
            });
            test('3 * 3 + 3 - 3 * 3 + 3', () => {
                const program = tico_1.default.fromSourceCode("3 * 3 + 3 - 3 * 3 + 3");
                expect(program.run()).toBe(6);
            });
        });
        describe('Function expressions', () => {
            test('Simple sum function', () => {
                const program = tico_1.default.fromSourceCode(`function sum(a, b) {a + b}
					sum(10, 20)`);
                expect(program.run()).toBe(30);
            });
            test('Default value', () => {
                const program = tico_1.default.fromSourceCode(`function greeting(name, preffix = "Hello ") {preffix + name}
					greeting("Gabriel")`);
                expect(program.run()).toBe("Hello Gabriel");
            });
            test('Default value expression', () => {
                const program = tico_1.default.fromSourceCode(`a = 10; b = 20;
					function multiply(c, d = a + b) {return c * d}
					multiply(30)`);
                expect(program.run()).toBe(900);
            });
            test('Default value', () => {
                const program = tico_1.default.fromSourceCode(`a = 10; b = 20;
					function multiply(c, d = a + b) {return c * d}
					a = 30; b = 500;
					multiply(30)`);
                expect(program.run()).toBe(15900);
            });
            test('Static default value', () => {
                const program = tico_1.default.fromSourceCode(`a = 10; b = 20;
					function multiply(c, !d = a + b) {return c * d}
					a = 30; b = 500;
					multiply(30)`);
                expect(program.run()).toBe(900);
            });
        });
    });
});
