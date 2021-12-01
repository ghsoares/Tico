declare type Token = {
	type: any;
	match: RegExpExecArray;
	start: number;
	end: number;
	line: number;
	column: number;
};
declare type TokenDefinition = {
	type: any;
	regex: RegExp;
	ignore: boolean;
};

/**
 * Main tokenizer class, takes multiple token definitions with it's type and regex and tokenizes
 * a source string into tokens.
 */
declare class Tokenizer {
	public skipIgnore: boolean;
	private tokenDefs: TokenDefinition[];
	private source: string;
	private sourceLength: number;
	private cursor: number;

	/**
	 * Adds a token definition
	 * @param {any} type - The type of the token, can be any type of value
	 * @param {RegExp} regex - The regex expression used to tokenize this token
	 * @param {boolean} [ignore=false] - Should this token be ignored? Use this for whitespaces or comments
	 */
	public addTokenDefinition(type: any, regex: RegExp, ignore: boolean): void;

	/**
	 * Initializes the tokenization step
	 * @param {string} source - The actual source code used to tokenize
	 */
	public init(source: string): void;

	/**
	 * Is the tokenization step reached EOF?
	 * @returns {boolean} Reached EOF?
	 */
	private EOF(): boolean;

	/**
	 * Gets the next token from the source string cursor
	 * @returns {Token} The next token
	 */
	private getNextToken(): Token;

	/**
	 * Gets additional cursor information at position
	 * @param {number} pos - The cursor position
	 * @returns {[number, number]} Line and column of the cursor
	 */
	public getCursorInfo(pos: number): [number, number];

	/**
	 * Main tokenization function, tokenizes the entire source string
	 * @param {string} str - The source string
	 */
	public tokenize(str: string): void;

	/**
	 * Returns the current token cursor position
	 * @returns {number} position
	 */
	public tkCursor(): number;

	/**
	 * Returns the current token that matches the type or null if it don't match.
	 * If it matches, it advances to the next token
	 * @param {any} type - The token type to match 
	 * @returns {Token} The current token or null
	 */
	public tk(type: any): Token;

	/**
	 * Returns the current token
	 * @returns {Token} The current token
	 */
	public currTk(): Token;

	/**
	 * Go back one pos of the token cursor
	 */
	public tkBack(): void;

	/**
	 * Returns the token position to the position provided
	 * @param {number} pos - The position to return 
	 * @returns {null}
	 */
	public tkRet(): null;

	/**
	 * Throws the error message at the current token position
	 * @param {string} msg - The error message
	 */
	public tkThrowErr(msg: string): void;

	/**
	 * Gets the number of tokens left to use
	 * @returns {number} The number of left tokens
	 */
	public tokensLeft(): number;

	/**
	 * Returns a copy of the tokenized tokens
	 * @returns {Token[]} The array of tokens copy
	 */
	public getTokens(): Token[];

	/**
	 * Returns a substring from start to end
	 * @param {number} start - Substring start
	 * @param {number} end - Substring end
	 */
	public sourceSubstr(start: number, end: number): string;
}

export default Tokenizer;