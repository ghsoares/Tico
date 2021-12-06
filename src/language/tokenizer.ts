import { throwErrorAtPos } from "../utils";

type TokenType = number;
type TokenDefinition = { type: TokenType, regex: string, ignore: boolean };
export type Token = { type: TokenType, match: string[], start: number, end: number };

/**
 * Main tokenizer class, takes multiple token definitions with it's type and regex and tokenizes
 * a source string into tokens.
 */
export default class Tokenizer {
	/**
	 * EOF type token
	 */
	public static EOF: number = -1;
	/**
	 * Invalid type token
	 */
	public static INVALID: number = -2;
	/**
	 * Skips the ignore tokens? Turn off if want to parse those tokens
	 */
	public skipIgnore: boolean;
	/**
	 * Object containing all token definitions
	 */
	private tokenDefs: { [key: TokenType]: TokenDefinition };
	/**
	 * Compiled global regex expression
	 */
	private compiledRegex: RegExp;
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
	 * Array containing all the tokens tokenized
	 */
	private tokens: Token[];
	/**
	 * Number of tokens tokenized
	 */
	private numTokens: number;
	/**
	 * Token cursor
	 */
	private tkCursor: number;

	public constructor() {
		this.tokenDefs = {};
		this.source = "";
		this.sourceLength = 0;
		this.cursor = 0;
		this.skipIgnore = true;
	}

	/**
	 * Adds a token definition
	 * @param {TokenType} type The type of the token, can be any type of value
	 * @param {string} regexes A array of expressions to be used
	 * @param {boolean} [ignore=false] Should this token be ignored? Use this for whitespaces or comments
	 */
	public addTokenDefinition(type: TokenType, regexes: RegExp[], ignore: boolean = false): void {
		let regStr = "";

		const numExpressions = regexes.length;
		if (numExpressions === 0) throw new Error(`Can't provide 0 expressions for a token definition`);
		if (numExpressions === 1) {
			regStr += regexes[0].source;
		} else {
			for (let i = 0; i < numExpressions; i++) {
				regStr += "(?:";
				regStr += regexes[i].source;
				regStr += ")";
				if (i < numExpressions - 1) regStr += "|";
			}
		}

		this.tokenDefs[type] = { type, regex: regStr, ignore };
	}

	/**
	 * Returns if the tokenizer is at end of file
	 * @returns {boolean}
	 */
	private eof(): boolean { return this.cursor >= this.sourceLength; }

	/**
	 * Compiles the regex combining all the token definitions, for a better performance
	 */
	private compileRegex() {
		let regStr = "^(?:";
		const definitions = Object.values(this.tokenDefs);
		const numDefinitions = definitions.length;

		for (let i = 0; i < numDefinitions; i++) {
			const def = definitions[i];
			regStr += `(?<tk${def.type}>`;

			regStr += def.regex;

			regStr += ")";

			if (i < numDefinitions - 1) {
				regStr += "|";
			}
		}

		regStr += ")";

		this.compiledRegex = new RegExp(regStr);
	}

	/**
	 * Initializes the tokenizer
	 * @param {string} source The actual source code to be tokenized
	 */
	private init(source: string): void {
		this.source = source;
		this.sourceLength = source.length;
		this.cursor = 0;
		this.tokens = [];
		this.numTokens = 0;
		this.tkCursor = 0;
		this.compileRegex();
	}

	/**
	 * Get more info about a match
	 * @param {RegExpExecArray} match The expression match to grab infp
	 * @returns {[TokenDefinition, string[]]} The token type, groups and token definition
	 */
	private getMatchInfo(match: RegExpExecArray): [TokenDefinition, string[]] {
		let groups = Object.keys(match.groups);
		let numGroups = groups.length;
		let type: TokenType = null;

		for (let i = 0; i < numGroups; i++) {
			if (match.groups[groups[i]] !== undefined) {
				if (type === null) {
					type = Number(groups[i].slice(2));
				}
			}
		}

		if (type === null)
			throw new Error(`Couldn't find type`);

		const matchGroups = match.slice(1).filter(value => value !== undefined);

		return [this.tokenDefs[type], matchGroups];
	}

	/**
	 * Gets the next token at cursor pos
	 * @returns {Token} The next token
	 */
	private next(): Token {
		// Match string after the cursor pos
		const str = this.source.slice(this.cursor);

		// Get a match from the compiled regex
		const match = this.compiledRegex.exec(str);

		// Matched token
		let tk: Token = null;

		// Found something
		if (match) {
			// Grab info about matched string
			const [def, groups] = this.getMatchInfo(match);

			// This token should be ignored
			if (def.ignore && this.skipIgnore) {
				// Walk forward the cursor
				this.cursor += match[0].length;

				// Get the next token instead
				tk = this.next();
			// Build the token
			} else {
				tk = {
					type: def.type,
					match: groups,
					start: this.cursor,
					end: this.cursor + match[0].length
				};
				// Walk forward the cursor
				this.cursor += match[0].length;
			}
		// Didn't found something
		} else {
			// Found a invalid cahracter, return a invalid token
			if (!this.eof()) {
				// Try to get a somewhat relevant token, by matching word
				let tkGet = (/^\w+/).exec(str);
				// Else return the character
				if (tkGet === null) {
					tkGet = (/^[\s\S]/).exec(str);
				}
				tk = {
					type: Tokenizer.INVALID,
					match: tkGet,
					start: this.cursor,
					end: this.cursor + tkGet[0].length
				};

				// Walk forward the cursor
				this.cursor += tkGet[0].length;
				// Reached EOF of the string
			} else {
				// Return a EOF token
				tk = {
					type: Tokenizer.EOF,
					match: null,
					start: this.cursor,
					end: this.cursor,
				};
			}
		}

		return tk;
	}

	/**
	 * Tokenizes a source string
	 * @param {string} source The actual source code to be tokenized
	 */
	public tokenize(source: string): void {
		this.init(source);

		while (true) {
			const tk = this.next();
			this.tokens.push(tk);
			this.numTokens++;

			if (tk.type === Tokenizer.EOF) break;
		}
	}

	/**
	 * Returns the current token position
	 * @returns {number} The token position
	 */
	public csr(): number { return this.tkCursor; }

	/**
	 * Returns the current token that matches the type or null if it don't match.
	 * If it matches, it advances to the next token
	 * @param {any} type The token type to match 
	 * @returns {Token} The current token or null
	 */
	public tk(type: TokenType, goForward: boolean = true): Token {
		const currTk = this.tokens[this.tkCursor];

		if (currTk.type === type) {
			if (goForward) this.tkCursor += 1;
			return currTk;
		}

		return null;
	}

	/**
	 * Just returns the current token and advances to the next token
	 * @returns {Token} The current token
	 */
	public tkNext(): Token {
		return this.tokens[this.tkCursor++];
	}

	/**
	 * Returns if the current token is eof
	 * @returns {boolean} Is eof?
	 */
	public tkEof(): boolean { return this.tokens[this.tkCursor].type === Tokenizer.EOF; }

	/**
	 * Returns the token position to the position provided
	 * @param {number} pos The position to return to
	 * @returns {null}
	 */
	public tkRet(pos: number): null { this.tkCursor = pos; return null; }

	/**
	 * Throws the error message at the current token position
	 * @param {string} msg The error message
	 */
	public throwErr(msg: string) {
		throwErrorAtPos(this.source, this.tokens[this.tkCursor].start, `At ($line:$column) : ${msg}`);
	}

	/**
	 * Throws a unexpected token error
	 * @param {string} msg The error message
	 */
	public unexpectedTokenErr(msg: string) {
		const str = this.source.slice(this.tokens[this.tkCursor].start);

		// Try to get a somewhat relevant token, by matching word
		let tkGet = (/^\w+/).exec(str);
		// Else return the character
		if (tkGet === null) {
			tkGet = (/^[\s\S]/).exec(str);
		}

		msg = msg.replace(/\$tk/g, tkGet[0]);

		this.throwErr(msg);
	}

	/**
	 * Returns a substring of the source string providing the start and end positions
	 * @param {number} start Substring start
	 * @param {number} end Substring end
	 * @returns {string} The source substring
	 */
	public sourceSubstr(start: number, end: number): string { return this.source.slice(start, end); }
}