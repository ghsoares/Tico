import TicoParser from "./src/language/ticoParser";
import TicoTokenizer from "./src/language/ticoTokenizer";
import TicoProgram from "./src/runtime/tico";

export function createWorker() {
	return new Worker('./src/webWorker/index.ts');
}

export {
	TicoParser,
	TicoTokenizer,
	TicoProgram
};
