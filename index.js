import TicoTokenizer from "./src/language/ticoTokenizer.js";
import TicoParser from "./src/language/ticoParser.js";
import TicoProgram from "./src/runtime/tico.js";

function createWorker() {
	return new Worker('./src/webWorker.js', { type: 'module' });
}

export {
	TicoTokenizer,
	TicoParser,
	TicoProgram,
	createWorker
}