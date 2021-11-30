
export type TokenDefinition = { type: any, regex: RegExp, ignore: boolean };
export type Token = { type: any, match: RegExpMatchArray, start: number, end: number, line: number, column: number };

export function throwAtPos(line: number, column: number, msg: string) {
	const e = new SyntaxError(`At line ${line + 1} column ${column + 1}: ${msg}`);
	return e;
}

/**
 * Main tokenizer class, takes multiple token definitions with it's type and regex and tokenizes
 * a source string into tokens.
 */
export default class Tokenizer {
	/**
	 * Skips tokens to be ignored, turn this off if want to use these ignored tokens for
	 * syntax highlighting, for example
	 */
	public skipIgnore: boolean;
	/**
	 * Array containing all token definitions, identified by it's type and contains regex expression and
	 * ignore flag.
	 */
	private tokenDefs: TokenDefinition[];
	/**
	 * The current source being tokenized
	 */
	private source: string;
	/**
	 * The length of the current source being tokenized
	 */
	private sourceLength: number;
	/**
	 * The source string cursor, points at a character on the position of this cursor
	 */
	private cursor: number;
	/**
	 * All the tokens from the tokenization step
	 */
	private tokens: Token[];
	/**
	 * Total number of tokens from the tokenization step
	 */
	private numTokens: number;
	/**
	 * Cursor that points at a token
	 */
	private tokenCursor: number;

	public constructor() {
		this.skipIgnore = true;
		this.tokenDefs = [];
		this.source = "";
		this.sourceLength = 0;
		this.cursor = 0;
	}

	/**
	 * Adds a token definition
	 * @param {any} type - The type of the token, can be any type of value
	 * @param {RegExp} regex - The regex expression used to tokenize this token
	 * @param {boolean} [ignore=false] - Should this token be ignored? Use this for whitespaces or comments
	 */
	public addTokenDefinition(type: any, regex: RegExp, ignore: boolean = false): void {
		regex = new RegExp(`^${regex.source}`);
		this.tokenDefs.push({ type, regex, ignore });
	}

	/**
	 * Initializes the tokenization step
	 * @param {string} source - The actual source code used to tokenize
	 */
	private init(source: string): void {
		this.source = source;
		this.sourceLength = source.length;
		this.cursor = 0;
		this.tokens = [];
		this.numTokens = 0;
		this.tokenCursor = 0;
	}

	/**
	 * Is the tokenization step reached EOF?
	 * @returns {boolean} Reached EOF?
	 */
	private EOF(): boolean {
		return this.cursor >= this.sourceLength;
	}

	/**
	 * Gets the next token from the source string cursor
	 * @returns {Token} The next token
	 */
	private getNextToken(): Token {
		const str = this.source.slice(this.cursor);
		let tk: Token = null;
		let tkIgnore: boolean = false;

		for (const { type, regex, ignore } of this.tokenDefs) {
			const matched = regex.exec(str);
			if (matched) {
				matched.index = this.cursor;
				const newToken: Token = {
					type,
					match: matched,
					start: this.cursor,
					end: this.cursor + matched[0].length,
					line: -1,
					column: -1,
				};
				if (tk === null || newToken.match[0].length > tk.match[0].length) {
					tk = newToken;
					tkIgnore = ignore;
				}
			}
		}

		if (tk !== null) {
			this.cursor += tk.match[0].length;
			if (tkIgnore && this.skipIgnore) {
				tk = this.getNextToken();
			}
		}
		if (tk === null) {
			if (!this.EOF()) {
				let tkGet = (/^\w+/).exec(str);
				if (tkGet === null) {
					tkGet = (/^[-!$%^&*()_+|~=`{}[\]:";'<>?,./]/).exec(str);
				}
				if (tkGet === null) {
					tkGet = (/^./).exec(str);
				}
				const [line, column] = this.getCursorInfo(this.cursor);
				tk = {
					type: "INVALID",
					match: tkGet,
					start: this.cursor,
					end: this.cursor + tkGet[0].length,
					line,
					column
				};
				this.cursor += tkGet[0].length;
			} else {
				tk = {
					type: "EOF",
					match: null,
					start: this.cursor,
					end: this.cursor,
					line: -1,
					column: -1
				};
			}
		}

		const [line, column] = this.getCursorInfo(tk.start);
		tk.line = line;
		tk.column = column;

		return tk;
	}

	/**
	 * Gets additional cursor information at position
	 * @param {number} pos - The cursor position
	 * @returns {[number, number]} Line and column of the cursor
	 */
	public getCursorInfo(pos: number): [number, number] {
		let [cursorLine, cursorColumn] = [0, -1];
		for (let i = 0; i <= pos; i++) {
			const c = this.source[i];
			if (c !== "\r") cursorColumn += 1;
			if (c === "\t") cursorColumn += 3;
			if (c === "\n") {
				cursorLine += 1;
				cursorColumn = -1;
			}
		}
		return [cursorLine, cursorColumn];
	}

	/**
	 * Main tokenization function, tokenizes the entire source string
	 * @param {string} str - The source string
	 */
	public tokenize(str: string): void {
		this.init(str);
		while (true) {
			const tk = this.getNextToken();
			this.tokens.push(tk);
			this.numTokens++;
			if (tk.type === "EOF") break;
		}
	}

	/**
	 * Returns the current token cursor position
	 * @returns {number} position
	 */
	public tkCursor(): number { return this.tokenCursor; }

	/**
	 * Returns the current token that matches the type or null if it don't match.
	 * If it matches, it advances to the next token
	 * @param {any} type - The token type to match 
	 * @returns {Token} The current token or null
	 */
	public tk(type: any): Token {
		if (this.tokenCursor >= this.numTokens) return null;

		if (this.tokens[this.tokenCursor].type === type) {
			const tk = this.tokens[this.tokenCursor];
			this.tokenCursor += 1;
			return tk;
		}

		return null;
	}

	/**
	 * Returns the current token
	 * @returns {Token} The current token
	 */
	public currTk(): Token {
		return this.tokens[this.tokenCursor];
	}

	/**
	 * Go back one pos of the token cursor
	 */
	public tkBack() { this.tokenCursor -= 1; }

	/**
	 * Returns the token position to the position provided
	 * @param {number} pos - The position to return 
	 * @returns {null}
	 */
	public tkRet(pos: number): null { this.tokenCursor = pos; return null; }

	/**
	 * Throws the error message at the current token position
	 * @param {string} msg - The error message
	 */
	public tkThrowErr(msg: string) {
		const currTk = this.currTk();
		throw new SyntaxError(`At line ${currTk.line + 1} column ${currTk.column + 1}: ${msg}`);
	}

	/**
	 * Gets the number of tokens left to use
	 * @returns {number} The number of left tokens
	 */
	public tokensLeft(): number { return this.numTokens - this.tokenCursor; }

	/**
	 * Returns a copy of the tokenized tokens
	 * @returns {Token[]} The array of tokens copy
	 */
	public getTokens(): Token[] { return [...this.tokens]; }

	public sourceSubstr(start: number, end: number): string { return this.source.slice(start, end); }
}