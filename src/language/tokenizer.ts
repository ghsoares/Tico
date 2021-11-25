
export type TokenDefinition = { type: any, regex: RegExp, ignore: boolean };
export type Token = { type: any, match: RegExpMatchArray, start: number, end: number };

export default class Tokenizer {
	public skipIgnore: boolean;
	private tokenDefs: TokenDefinition[];
	private source: string;
	private sourceLength: number;
	private cursor: number;
	private tokens: Token[];
	private numTokens: number;
	private tokenCursor: number;

	public constructor() {
		this.skipIgnore = true;
		this.tokenDefs = [];
		this.source = "";
		this.sourceLength = 0;
		this.cursor = 0;
	}

	public addTokenDefinition(type: any, regex: RegExp, ignore: boolean = false): void {
		regex = new RegExp(`^${regex.source}`);
		this.tokenDefs.push({ type, regex, ignore });
	}

	private init(source: string): void {
		this.source = source;
		this.sourceLength = source.length;
		this.cursor = 0;
		this.tokens = [];
		this.numTokens = 0;
		this.tokenCursor = 0;
	}

	private EOF(): boolean {
		return this.cursor >= this.sourceLength;
	}

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
					end: this.cursor + matched[0].length
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
				tk = {
					type: "INVALID",
					match: tkGet,
					start: this.cursor,
					end: this.cursor + tkGet[0].length
				};
				this.cursor += tkGet[0].length;
			} else {
				tk = {
					type: "EOF",
					match: null,
					start: this.cursor,
					end: this.cursor
				};
			}
		}

		return tk;
	}

	public getCursorInfo(pos: number): [number, number] {
		let [cursorLine, cursorColumn] = [0, 0];
		for (let i = 0; i <= pos; i++) {
			const c = this.source[i];
			if (c !== "\r") cursorColumn += 1;
			if (c === "\t") cursorColumn += 3;
			if (c === "\n") {
				cursorLine += 1;
				cursorColumn = 0;
			}
		}
		return [cursorLine, cursorColumn];
	}

	public tokenize(str: string): void {
		this.init(str);
		while (true) {
			const tk = this.getNextToken();
			if (tk.type === "EOF") break;
			this.tokens.push(tk);
			this.numTokens++;
		}
	}

	public tkCursor(): number { return this.tokenCursor; }

	public tk(type: any): Token {
		if (this.tokenCursor >= this.numTokens) return null;

		if (this.tokens[this.tokenCursor].type === type) {
			const tk = this.tokens[this.tokenCursor];
			this.tokenCursor += 1;
			return tk;
		}

		return null;
	}

	public currTk(): Token {
		if (this.tokenCursor >= this.numTokens) return {
			type: "EOF",
			match: null,
			start: this.cursor - 1,
			end: this.cursor - 1
		};
		return this.tokens[this.tokenCursor];
	}

	public tkRet(pos: number): null { this.tokenCursor = pos; return null; }

	public tokensLeft(): number { return this.numTokens - this.tokenCursor;}
}