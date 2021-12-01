import TicoTokenizer from "./src/language/ticoTokenizer.js";
import TicoParser from "./src/language/ticoParser.js";
import TicoProgram from "./src/runtime/tico.js";

function createWorker() {
	return new Worker(new URL('./src/webWorker.js', import.meta.url));
}

export {
	TicoTokenizer,
	TicoParser,
	TicoProgram,
	createWorker
}