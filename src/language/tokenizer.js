export function throwAtPos(line, column, msg) {
	const e = new SyntaxError(`At line ${line + 1} column ${column + 1}: ${msg}`);
	return e;
}

export default class Tokenizer {
	constructor() {
		this.skipIgnore = true;
		this.tokenDefs = [];
		this.source = "";
		this.sourceLength = 0;
		this.cursor = 0;
	}

	addTokenDefinition(type, regex, ignore = false) {
		regex = new RegExp(`^${regex.source}`);
		this.tokenDefs.push({ type, regex, ignore });
	}

	init(source) {
		this.source = source;
		this.sourceLength = source.length;
		this.cursor = 0;
		this.tokens = [];
		this.numTokens = 0;
		this.tokenCursor = 0;
	}

	EOF() {
		return this.cursor >= this.sourceLength;
	}

	getNextToken() {
		const str = this.source.slice(this.cursor);
		let tk = null;
		let tkIgnore = false;

		for (const { type, regex, ignore } of this.tokenDefs) {
			const matched = regex.exec(str);
			if (matched) {
				matched.index = this.cursor;
				const newToken = {
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

	getCursorInfo(pos) {
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

	tokenize(str) {
		this.init(str);
		while (true) {
			const tk = this.getNextToken();
			this.tokens.push(tk);
			this.numTokens++;
			if (tk.type === "EOF") break;
		}
	}

	
	tkCursor() { return this.tokenCursor; }

	tk(type) {
		if (this.tokenCursor >= this.numTokens) return null;

		if (this.tokens[this.tokenCursor].type === type) {
			const tk = this.tokens[this.tokenCursor];
			this.tokenCursor += 1;
			return tk;
		}

		return null;
	}

	currTk() {
		return this.tokens[this.tokenCursor];
	}

	tkBack() { this.tokenCursor -= 1; }

	tkRet(pos) { this.tokenCursor = pos; return null; }

	tkThrowErr(msg) {
		const currTk = this.currTk();
		throw new SyntaxError(`At line ${currTk.line + 1} column ${currTk.column + 1}: ${msg}`);
	}

	tokensLeft() { return this.numTokens - this.tokenCursor; }

	getTokens() { return [...this.tokens]; }

	sourceSubstr(start, end) { return this.source.slice(start, end); }
}