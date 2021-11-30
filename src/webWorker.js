import TicoProgram from "./runtime/tico";
import TicoParser from "./language/ticoParser";

let currentRunningProgram = null;

function compileSource(source) {
	const parser = new TicoParser();
	const main = parser.parse(source);

	self.postMessage({
		type: 'SOURCE_COMPILED',
		main
	});

	return main;
}

function runProgram(main, ctxVariables, ctxFunctions) {
	if (currentRunningProgram !== null) {
		throw new Error(`A program is already running on this thread`);
	}

	const program = new TicoProgram(main);

	const variables = {

		...ctxVariables
	};

	const functions = {
		'write': (what) => {
			self.postMessage({
				type: 'STDOUT',
				msg: what
			});

			return true;
		},
		'writeLine': (what) => {
			self.postMessage({
				type: 'STDOUT',
				msg: what + "\n"
			});

			return true;
		},

		...ctxFunctions
	};

	currentRunningProgram = program;

	const retVal = program.run(variables, functions);

	currentRunningProgram = null;

	self.postMessage({
		type: 'PROGRAM_FINISHED',
		retVal
	});
}

function compileAndRun(source, ctxVariables,ctxFunctions) {
	runProgram(compileSource(source), ctxVariables, ctxFunctions);
}

self.onmessage = (e) => {
	switch (e.type) {
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
/*

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
*/