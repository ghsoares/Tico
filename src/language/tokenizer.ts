
export type TokenDefinition = [number, RegExp];
export type Token = [number, RegExpExecArray, number, number];

export default class Tokenizer {
	private tokenDefs: TokenDefinition[];
	private source: string;
	private sourceLength: number;
	private cursor: number;

	public constructor() {
		this.tokenDefs = [];
		this.source = "";
		this.sourceLength = 0;
		this.cursor = 0;
	}

	public addTokenDefinition(def: TokenDefinition): void {
		this.tokenDefs.push(def);
	}

	public init(source: string): void {
		this.source = source;
		this.sourceLength = source.length;
		this.cursor = 0;
	}

	public EOF(): boolean {
		return this.cursor >= this.sourceLength;
	}

	public getCursorPos(): number {
		return this.cursor;
	}

	public getCursorInfo(): [number, number] {
		let [cursorLine, cursorColumn] = [0, 0];
		for (let i = 0; i <= this.cursor; i++) {
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

	public throwError(msg: string): void {
		let [cursorLine, cursorColumn] = this.getCursorInfo();
		throw new Error(`Error at line ${cursorLine + 1} column ${cursorColumn + 1}: ${msg}`);
	}

	public getNextToken(): Token {
		const str = this.source.slice(this.cursor);
		let tk: Token = null;
		let tkName: any = null;

		for (const [tokenName, tokenRegex] of this.tokenDefs) {
			const matched = tokenRegex.exec(str);
			if (matched) {
				if (matched.index === 0) {
					const newToken: Token = [tokenName, matched, this.cursor, this.cursor + matched[0].length];
					if (tk === null || newToken[1][0].length > tk[1][0].length) {
						tk = newToken;
						tkName = tokenName;
					}
				}
			}
		}

		if (tk !== null) {
			this.cursor += tk[1][0].length;
			if (tkName === null) {
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
				tk = [
					-1,
					tkGet,
					this.cursor,
					this.cursor + tkGet[0].length
				];
				this.cursor += tkGet[0].length;
			} else {
				tk = [-2, null, this.cursor, this.cursor];
			}
		}
		

		return tk;
	}

	public goBack(steps: number): void {
		this.cursor -= steps;
	}

	public goTo(pos: number): void {
		this.cursor = pos;
	}
}