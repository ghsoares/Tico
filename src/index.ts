import TicoParser from "./language/ticoParser";
import TicoProgram from "./runtime/tico";

function randomMath() {
	const operators = ["+", "-", "*", "/", "%", "**"];
	const numOperators = operators.length;
	const numOperations = 3;
	const numMin = -100;
	const numMax = 100;

	const randomNumber = () => numMin + Math.random() * (numMax - numMin);
	const randomOperator = () => operators[Math.floor(Math.random() * numOperators)];

	let s = "";

	for (let i = 0; i < numOperations; i++) {
		if (i === 0) s += `(${randomNumber().toFixed(1)})`;
		s += " " + randomOperator() + " ";
		s += `(${randomNumber().toFixed(1)})`;
	}

	return s;
}

//(90.4) + (91.2) ** (-71.7) * (5.8)
//(95.1) ** (-79.2) ** (7.2) * (92.0)

const expression = `(90.4) + (91.2) ** (-71.7) * (5.8)`;
console.log(`Expression:    ${expression}`);


const result = eval(expression);
console.log(`Expected:      ${result}`);


const ticoMain = new TicoParser().parse(expression);
const ticoResult = new TicoProgram(ticoMain).run();
//console.log(TicoParser.stringify(ticoMain));
console.log(`Tico:          ${ticoResult}`);

/*let correct = 0;
let tests = 50;

for (let i = 0; i < tests; i++) {
	const expression = randomMath();
	console.log(`Expression:    ${expression}`);


	const result = eval(expression);
	console.log(`Expected:      ${result}`);


	const ticoResult = TicoProgram.fromSourceCode(expression).run();
	console.log(`Tico:          ${ticoResult}`);

	correct += (ticoResult.toString() === result.toString()) ? 1 : 0;

	console.log("\n");
}

console.log(`Correct: ${correct} out of ${tests}`);*/

/*const prog = TicoProgram.fromSourceCode("3 * 3 + 3 - 3 * 3 + 3");

console.log(prog.run());*/