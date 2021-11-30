import TicoParser from "./language/ticoParser";
import TicoTokenizer from "./language/ticoTokenizer";
import TicoProgram from "./runtime/tico";

export function createWorker() {
	return new Worker('./src/webWorker/index.ts');
}

export {
	TicoParser,
	TicoTokenizer,
	TicoProgram
};
