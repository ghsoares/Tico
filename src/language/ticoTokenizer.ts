import Tokenizer from "./tokenizer";

export enum TokenEnum {
	// Ignored tokens
	IgnoreMin,

	IgnoreMultilineComment,
	IgnoreComment,
	IgnoreWhitespace,
	IgnoreSemicolon,

	IgnoreMax,

	// Keywords
	KeywordMin,

	KeywordFunction,
	KeywordReturn,

	KeywordMax,

	// Literals
	LiteralMin,

	LiteralNumber,
	LiteralString,
	LiteralBoolean,

	LiteralMax,

	// Binary operators
	BinaryOpMin,

	BinaryOpPlus,
	BinaryOpMinus,
	BinaryOpStar,
	BinaryOpStarStar,
	BinaryOpSlash,
	BinaryOpSlashSlash,
	BinaryOpModulus,
	BinaryOpModulusModulus,
	
	BinaryOpMax,

	// Conditional Operators
	ConditionalOpMin,

	ConditionalOpGreater,
	ConditionalOpLess,
	ConditionalOpGreaterEqual,
	ConditionalOpLessEqual,
	ConditionalOpEqual,
	ConditionalOpNotEqual,

	ConditionalOpMax,

	// Symbols
	SymbolMin,
	
	SymbolEquals,
	SymbolParOpen,
	SymbolParClose,
	SymbolCurlyBracketOpen,
	SymbolCurlyBracketClose,
	SymbolBracketOpen,
	SymbolBracketClose,
	SymbolComma,
	SymbolExclamationMark,
	
	SymbolMax,

	// Extra
	ExtraMin,

	ExtraIdentifier,

	ExtraMax,
}

export default class TicoTokenizer extends Tokenizer {
	public constructor() {
		super();

		this.addTokenDefinition(
			TokenEnum.IgnoreMultilineComment,
			/#\*(\s|\S)*?\*#/,
			true
		);
		this.addTokenDefinition(
			TokenEnum.IgnoreComment,
			/#.*/,
			true
		);
		this.addTokenDefinition(
			TokenEnum.IgnoreWhitespace,
			/[\s\n\r]+/,
			true
		);
		this.addTokenDefinition(
			TokenEnum.IgnoreSemicolon,
			/;/,
			true
		);

		this.addKeywords();
		this.addLiterals();
		this.addBinaryOps();
		this.addConditionalOps();
		this.addSymbols();
		this.addExtra();
	}

	private addKeywords(): void {
		const expectedNumTokens = 2;
		if (TokenEnum.KeywordMax - TokenEnum.KeywordMin - 1 !== expectedNumTokens) {
			throw new Error(`New keywords added, update this function`);
		}
		for (let i = TokenEnum.KeywordMin + 1; i < TokenEnum.KeywordMax; i++) {
			let expressions = [];

			switch (i) {
				case TokenEnum.KeywordFunction: {
					expressions = [/function/];
				} break;
				case TokenEnum.KeywordReturn: {
					expressions = [/return/];
				} break;
				default: throw new Error(`Not implemented`);
			}

			for (const exp of expressions) {
				this.addTokenDefinition(i, exp);
			}
		}
	}

	private addLiterals(): void {
		const expectedNumTokens = 3;
		if (TokenEnum.LiteralMax - TokenEnum.LiteralMin - 1 !== expectedNumTokens) {
			throw new Error(`New literals added, update this function`);
		}
		for (let i = TokenEnum.LiteralMin + 1; i < TokenEnum.LiteralMax; i++) {
			let expressions = [];

			switch (i) {
				case TokenEnum.LiteralNumber: {
					expressions = [/[-+]?\d+/];
				} break;
				case TokenEnum.LiteralString: {
					expressions = [/"(.*?)"/, /'(.*?)'/];
				} break;
				case TokenEnum.LiteralBoolean: {
					expressions = [/true|false/];
				} break;
				default: throw new Error(`Not implemented`);
			}

			for (const exp of expressions) {
				this.addTokenDefinition(i, exp);
			}
		}
	}

	private addBinaryOps(): void {
		const expectedNumTokens = 8;
		if (TokenEnum.BinaryOpMax - TokenEnum.BinaryOpMin - 1 !== expectedNumTokens) {
			throw new Error(`New binary operators added, update this function`);
		}
		for (let i = TokenEnum.BinaryOpMin + 1; i < TokenEnum.BinaryOpMax; i++) {
			let expressions = [];

			switch (i) {
				case TokenEnum.BinaryOpPlus: {
					expressions = [/\+/];
				} break;
				case TokenEnum.BinaryOpMinus: {
					expressions = [/-/];
				} break;
				case TokenEnum.BinaryOpStar: {
					expressions = [/\*/];
				} break;
				case TokenEnum.BinaryOpStarStar: {
					expressions = [/\*\*/];
				} break;
				case TokenEnum.BinaryOpSlash: {
					expressions = [/\//];
				} break;
				case TokenEnum.BinaryOpSlashSlash: {
					expressions = [/\/\//];
				} break;
				case TokenEnum.BinaryOpModulus: {
					expressions = [/%/];
				} break;
				case TokenEnum.BinaryOpModulusModulus: {
					expressions = [/%%/];
				} break;
				default: throw new Error(`Not implemented`);
			}

			for (const exp of expressions) {
				this.addTokenDefinition(i, exp);
			}
		}
	}

	private addConditionalOps(): void {
		const expectedNumTokens = 6;
		if (TokenEnum.ConditionalOpMax - TokenEnum.ConditionalOpMin - 1 !== expectedNumTokens) {
			throw new Error(`New binary operators added, update this function`);
		}
		for (let i = TokenEnum.ConditionalOpMin + 1; i < TokenEnum.ConditionalOpMax; i++) {
			let expressions = [];

			switch (i) {
				case TokenEnum.ConditionalOpGreater: {
					expressions = [/>/];
				} break;
				case TokenEnum.ConditionalOpLess: {
					expressions = [/</];
				} break;
				case TokenEnum.ConditionalOpGreaterEqual: {
					expressions = [/>=/];
				} break;
				case TokenEnum.ConditionalOpLessEqual: {
					expressions = [/<=/];
				} break;
				case TokenEnum.ConditionalOpEqual: {
					expressions = [/==/];
				} break;
				case TokenEnum.ConditionalOpNotEqual: {
					expressions = [/!=/];
				} break;
				
				default: throw new Error(`Not implemented`);
			}

			for (const exp of expressions) {
				this.addTokenDefinition(i, exp);
			}
		}
	}

	private addSymbols(): void {
		const expectedNumTokens = 9;
		if (TokenEnum.SymbolMax - TokenEnum.SymbolMin - 1 !== expectedNumTokens) {
			throw new Error(`New symbols added, update this function`);
		}
		for (let i = TokenEnum.SymbolMin + 1; i < TokenEnum.SymbolMax; i++) {
			let expressions = [];

			switch (i) {
				case TokenEnum.SymbolEquals: {
					expressions = [/=/];
				} break;
				case TokenEnum.SymbolParOpen: {
					expressions = [/\(/];
				} break;
				case TokenEnum.SymbolParClose: {
					expressions = [/\)/];
				} break;
				case TokenEnum.SymbolCurlyBracketOpen: {
					expressions = [/\{/];
				} break;
				case TokenEnum.SymbolCurlyBracketClose: {
					expressions = [/\}/];
				} break;
				case TokenEnum.SymbolBracketOpen: {
					expressions = [/\[/];
				} break;
				case TokenEnum.SymbolBracketClose: {
					expressions = [/\]/];
				} break;
				case TokenEnum.SymbolComma: {
					expressions = [/,/];
				} break;
				case TokenEnum.SymbolExclamationMark: {
					expressions = [/!/];
				} break;
				default: throw new Error(`Not implemented`);
			}

			for (const exp of expressions) {
				this.addTokenDefinition(i, exp);
			}
		}
	}

	private addExtra(): void {
		const expectedNumTokens = 1;
		if (TokenEnum.ExtraMax - TokenEnum.ExtraMin - 1 !== expectedNumTokens) {
			throw new Error(`New extra tokens added, update this function`);
		}
		for (let i = TokenEnum.ExtraMin + 1; i < TokenEnum.ExtraMax; i++) {
			let expressions = [];

			switch (i) {
				case TokenEnum.ExtraIdentifier: {
					expressions = [/[_a-zA-Z]\w*/];
				} break;
				default: throw new Error(`Not implemented`);
			}

			for (const exp of expressions) {
				this.addTokenDefinition(i, exp);
			}
		}
	}
}