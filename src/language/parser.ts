import TicoTokenizer from "./ticoTokenizer";

export default class Parser {
	private tokenizer: TicoTokenizer;

	public constructor() {
		this.tokenizer = new TicoTokenizer();
	}

	public parse(str: string) {
		this.tokenizer.init(str);
	}
}