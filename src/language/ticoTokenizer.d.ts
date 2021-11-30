import Tokenizer from "./tokenizer";

declare class TicoTokenizer extends Tokenizer {
	private addKeywords(): void;
	private addLiterals(): void;
	private addBinaryOps(): void;
	private addConditionalOps(): void;
	private addSymbols(): void;
	private addExtra(): void;
}