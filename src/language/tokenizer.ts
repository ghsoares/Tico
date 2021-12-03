import { lineColumnFromString } from "../utils";

type TokenType = string | number;
export type TokenDefinition = { type: TokenType, regex: RegExp, ignore: boolean };
export type Token = { type: TokenType, match: RegExpMatchArray, start: number, end: number, line: number, column: number };

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
	 * Object containing all token definitions
	 */
	private tokenDefs: { [key: TokenType]: TokenDefinition };
	/**
	 * Object containing all token definitions to be ignored
	 */
	private ignoreDefs: { [key: TokenType]: TokenDefinition };
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

	public constructor() {
		this.tokenDefs = {};
		this.ignoreDefs = {};
		this.source = "";
		this.sourceLength = 0;
		this.cursor = 0;
	}

	/**
	 * Adds a token definition
	 * @param {TokenType} type The type of the token, can be any type of value
	 * @param {string} regexes A array of expressions to be used
	 * @param {boolean} [ignore=false] Should this token be ignored? Use this for whitespaces or comments
	 */
	public addTokenDefinition(type: TokenType, regexes: RegExp[], ignore: boolean = false): void {
		let regStr = "^(?:";

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

		regStr += ")";

		const regex = new RegExp(regStr);

		this.tokenDefs[type] = { type, regex, ignore };
		if (ignore) {
			this.ignoreDefs[type] = { type, regex, ignore };
		}
	}

	/**
	 * Returns if the tokenizer is at end of file
	 * @returns {boolean}
	 */
	public eof(): boolean { return this.cursor >= this.sourceLength; }

	/**
	 * Initializes the tokenizer
	 * @param {string} source - The actual source code used to tokenize
	 */
	public init(source: string): void {
		this.source = source;
		this.sourceLength = source.length;
		this.cursor = 0;
	}

	/**
	 * Skips all the tokens that are marked as ignore
	 */
	private skipIgnoredTokens(excludeType: TokenType): void {
		while (true) {
			let skipped = false;
			const str = this.source.slice(this.cursor);
			for (const def of Object.values(this.ignoreDefs)) {
				if (def.type === excludeType) continue;
				const m = def.regex.exec(str);
				if (m) {
					skipped = true;
					this.cursor += m[0].length;
					break;
				}
			}
			if (!skipped) break;
		}
	}

	/**
	 * Returns the cursor position
	 * @returns {number} The cursor position
	 */
	public csr(): number { return this.cursor; }

	/**
	 * Returns the current token that matches the type or null if it don't match.
	 * If it matches, it advances to the next token
	 * @param {any} type The token type to match 
	 * @returns {Token} The current token or null
	 */
	public tk(type: TokenType, goForward: boolean = true): Token {
		// Grab the definition info
		const def = this.tokenDefs[type];

		// Throw error if the definition doesn't exist
		if (!def)
			throw new Error(`Token definition of type "${type}" doesn't exist`);

		// Firstly, let's skip the ignored tokens unless
		// a token to be ignored is the same as the provided type
		this.skipIgnoredTokens(type);

		// Let's tokenize from the cursor position
		const str = this.source.slice(this.cursor);
		let tk: Token = null;

		// Match the compiled regex
		const match = def.regex.exec(str);

		// Found token of this type
		if (match) {
			match.index = this.cursor;
			const [l, c] = lineColumnFromString(this.source, this.cursor);
			tk = {
				type,
				match,
				start: this.cursor,
				end: this.cursor + match[0].length,
				line: l,
				column: c
			};
			if (goForward) this.cursor += match[0].length;
		}

		return tk;
	}

	/**
	 * Returns the token position to the position provided
	 * @param {number} pos - The position to return 
	 * @returns {null}
	 */
	public tkRet(pos: number): null { this.cursor = pos; return null; }

	/**
	 * Throws the error message at the current token position
	 * @param {string} msg - The error message
	 */
	public throwErr(msg: string) {
		const [l, c] = lineColumnFromString(this.source, this.cursor);
		throw new SyntaxError(`At line ${l + 1} column ${c + 1}: ${msg}`);
	}

	public unexpectedTokenErr(msg: string) {
		const str = this.source.slice(this.cursor);

		// Try to get a somewhat relevant token, by matching word
		let tkGet = (/^\w+/).exec(str);
		// Else return a character
		if (tkGet === null) {
			tkGet = (/^./).exec(str);
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