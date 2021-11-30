import TicoParser from "../language/ticoParser";
import TicoProgram from "../runtime/tico";

let currentRunningProgram: TicoProgram = null;

self.onmessage = (e: any) => {
	const { type } = e;

	switch (type) {
		case 'COMPILE_SOURCE': {
			const { source }: { source: string } = e;

			const parser = new TicoParser();
			const main = parser.parse(source);
			const program = new TicoProgram(main);

			self.postMessage({
				type: 'SOURCE_COMPILED',
				program
			});
		} break;
		case 'RUN_PROGRAM': {
			if (currentRunningProgram !== null) {
				throw new Error(`A program is already running on this thread`);
			}

			const { 
				program,
				ctxVariables = {},
				ctxFunctions = {} 
			}: { 
				program: TicoProgram,
				ctxVariables: {[key: string]: any},
				ctxFunctions: {[key: string]: (...args: any[]) => any},
			} = e;

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
		} break;
	}
}