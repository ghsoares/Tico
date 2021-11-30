import TicoParser from "./language/ticoParser";
import TicoTokenizer from "./language/ticoTokenizer";
import TicoProgram from "./runtime/tico";

export function createWorker() {
	return new Worker('./webWorker/index.ts');
}

export {
	TicoParser,
	TicoTokenizer,
	TicoProgram
};
