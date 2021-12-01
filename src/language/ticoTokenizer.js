import Tokenizer from "./tokenizer.js";
import {iota} from "../utils/index.js";

export const TokenEnum = {
	// Ignored tokens
	IgnoreMin: iota(),

	IgnoreMultilineComment: iota(),
	IgnoreComment: iota(),
	IgnoreWhitespace: iota(),

	IgnoreMax: iota(),

	// Keywords
	KeywordMin: iota(),

	KeywordFunction: iota(),
	KeywordReturn: iota(),
	KeywordIf: iota(),
	KeywordElse: iota(),
	KeywordElif: iota(),
	KeywordWhile: iota(),
	KeywordFor: iota(),
	KeywordBreak: iota(),

	KeywordMax: iota(),

	// Literals
	LiteralMin: iota(),

	LiteralNumber: iota(),
	LiteralBigInt: iota(),
	LiteralString: iota(),
	LiteralBoolean: iota(),
	LiteralNull: iota(),
	LiteralUndefined: iota(),

	LiteralMax: iota(),

	// Binary operators
	BinaryOpMin: iota(),

	BinaryOpPlus: iota(),
	BinaryOpMinus: iota(),
	BinaryOpStar: iota(),
	BinaryOpStarStar: iota(),
	BinaryOpSlash: iota(),
	BinaryOpSlashSlash: iota(),
	BinaryOpModulus: iota(),
	BinaryOpModulusModulus: iota(),
	
	BinaryOpMax: iota(),

	// Conditional Operators
	ConditionalOpMin: iota(),

	ConditionalOpGreater: iota(),
	ConditionalOpLess: iota(),
	ConditionalOpGreaterEqual: iota(),
	ConditionalOpLessEqual: iota(),
	ConditionalOpEqual: iota(),
	ConditionalOpNotEqual: iota(),
	ConditionalAnd: iota(),
	ConditionalOr: iota(),

	ConditionalOpMax: iota(),

	// Symbols
	SymbolMin: iota(),
	
	SymbolEquals: iota(),
	SymbolParOpen: iota(),
	SymbolParClose: iota(),
	SymbolCurlyBracketOpen: iota(),
	SymbolCurlyBracketClose: iota(),
	SymbolBracketOpen: iota(),
	SymbolBracketClose: iota(),
	SymbolComma: iota(),
	SymbolExclamationMark: iota(),
	SymbolSemicolon: iota(),
	
	SymbolMax: iota(),

	// Extra
	ExtraMin: iota(),

	ExtraIdentifier: iota(),

	ExtraMax: iota(true),
}

export default class TicoTokenizer extends Tokenizer {
	constructor() {
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

		this.addKeywords();
		this.addLiterals();
		this.addBinaryOps();
		this.addConditionalOps();
		this.addSymbols();
		this.addExtra();
	}

	addKeywords() {
		const expectedNumTokens = 8;
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
				case TokenEnum.KeywordIf: {
					expressions = [/if/];
				} break;
				case TokenEnum.KeywordElse: {
					expressions = [/else/];
				} break;
				case TokenEnum.KeywordElif: {
					expressions = [/elif/];
				} break;
				case TokenEnum.KeywordWhile: {
					expressions = [/while/];
				} break;
				case TokenEnum.KeywordFor: {
					expressions = [/for/];
				} break;
				case TokenEnum.KeywordBreak: {
					expressions = [/break/];
				} break;
				default: throw new Error(`Not implemented`);
			}

			for (const exp of expressions) {
				this.addTokenDefinition(i, exp);
			}
		}
	}

	addLiterals() {
		const expectedNumTokens = 6;
		if (TokenEnum.LiteralMax - TokenEnum.LiteralMin - 1 !== expectedNumTokens) {
			throw new Error(`New literals added, update this function`);
		}
		for (let i = TokenEnum.LiteralMin + 1; i < TokenEnum.LiteralMax; i++) {
			let expressions = [];

			switch (i) {
				case TokenEnum.LiteralNumber: {
					expressions = [
						/[+-]?\d+/,
						/[+-]?\d+\.\d*/
					];
				} break;
				case TokenEnum.LiteralBigInt: {
					expressions = [
						/([+-]?\d+)n/,
						/BigInt\((.+)\)/,
					];
				} break;
				case TokenEnum.LiteralString: {
					expressions = [
						/"(.*?)"/,
						/'(.*?)'/,
						/`(.*?)`/
					];
				} break;
				case TokenEnum.LiteralBoolean: {
					expressions = [/true|false/];
				} break;
				case TokenEnum.LiteralNull: {
					expressions = [/null/];
				} break;
				case TokenEnum.LiteralUndefined: {
					expressions = [/undefined/];
				} break;
				default: throw new Error(`Not implemented`);
			}

			for (const exp of expressions) {
				this.addTokenDefinition(i, exp);
			}
		}
	}

	addBinaryOps() {
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

	addConditionalOps() {
		const expectedNumTokens = 8;
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
				case TokenEnum.ConditionalAnd: {
					expressions = [/&&/];
				} break;
				case TokenEnum.ConditionalOr: {
					expressions = [/\|\|/];
				} break;
				
				default: throw new Error(`Not implemented`);
			}

			for (const exp of expressions) {
				this.addTokenDefinition(i, exp);
			}
		}
	}

	addSymbols() {
		const expectedNumTokens = 10;
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
				case TokenEnum.SymbolSemicolon: {
					expressions = [/;/];
				} break;
				default: throw new Error(`Not implemented`);
			}

			for (const exp of expressions) {
				this.addTokenDefinition(i, exp);
			}
		}
	}

	addExtra() {
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