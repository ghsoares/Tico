import TicoTokenizer from "./src/language/ticoTokenizer";
import TicoParser from "./src/language/ticoParser";
import TicoProgram from "./src/runtime/tico";

declare function createWorker(): Worker;

export {
	TicoTokenizer,
	TicoParser,
	TicoProgram
};