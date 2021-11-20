
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
			const [line, column] = this.getCursorInfo();
			if (matched) {
				if (matched.index === 0) {
					const newToken: Token = [tokenName, matched, line, column];
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

		return tk;
	}

	public goBack(steps: number): void {
		this.cursor -= steps;
	}
}