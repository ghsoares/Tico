import TicoParser from "../language/ticoParser";
import TicoProgram, { BranchNode } from "../runtime/tico";

let currentRunningProgram: TicoProgram = null;

function compileSource(source: string) {
	const parser = new TicoParser();
	const main = parser.parse(source);

	self.postMessage({
		type: 'SOURCE_COMPILED',
		main
	});
}

function runProgram(
	main: BranchNode,
	ctxVariables: { [key: string]: any },
	ctxFunctions: { [key: string]: (...args: any[]) => any },
) {
	if (currentRunningProgram !== null) {
		throw new Error(`A program is already running on this thread`);
	}

	const program: TicoProgram = new TicoProgram(main);

	const variables = {

		...ctxVariables
	};

	const functions = {
		'write': (what: any) => {
			self.postMessage({
				type: 'STDOUT',
				msg: what
			});

			return true;
		},
		'writeLine': (what: any) => {
			self.postMessage({
				type: 'STDOUT',
				msg: what + "\n"
			});

			return true;
		},

		...ctxFunctions
	};

	currentRunningProgram = program;

	try {
		const retVal = program.run(variables, functions);

		currentRunningProgram = null;

		self.postMessage({
			type: 'PROGRAM_FINISHED',
			retVal
		});
	} catch (e) {
		currentRunningProgram = null;

		self.postMessage({
			type: 'PROGRAM_CRASHED',
			error: e
		});
	}
}

function compileAndRun(
	source: string,
	ctxVariables: { [key: string]: any },
	ctxFunctions: { [key: string]: (...args: any[]) => any },
) {
	const parser = new TicoParser();
	const main = parser.parse(source);

	self.postMessage({
		type: 'SOURCE_COMPILED',
		main
	});

	runProgram(main, ctxVariables, ctxFunctions);
}

self.onmessage = (e: any) => {
	const { type } = e;

	switch (type) {
		case 'COMPILE_SOURCE': {
			compileSource(e.source);
		} break;
		case 'RUN_PROGRAM': {
			runProgram(e.main, e.ctxVariables, e.ctxFunctions);
		} break;
		case 'COMPILE_AND_RUN': {
			compileAndRun(e.source, e.ctxVariables, e.ctxFunctions);
		} break;
	}
}