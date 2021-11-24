import Tokenizer from "./tokenizer";

export enum TokenEnum  {
	MAX
}

export default class TicoTokenizer extends Tokenizer {
	public constructor() {
		super();

		this.addTokenDefinition([null, /#\*(\s|\S)*?\*#/]);	// Multiline comment
		this.addTokenDefinition([null, /#.*/]);				// Comment
		this.addTokenDefinition([null, /\s+|\n+|\r+/]);		// Whitespace

		
	}
}