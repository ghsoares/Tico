import Tokenizer from "./tokenizer";

let iotaState = 0;
function iota(reset = false) {
	if (reset) {
		let prev = iotaState;
		iotaState = 0;
		return prev;
	}
	return iotaState++;
}

export const TokenEnum = {
	// Literals
	LT_MIN: iota(),

	LT_BIGINT: iota(),
	LT_NUMBER: iota(),
	LT_STRING: iota(),

	LT_MAX: iota(),

	// Stack operations
	STK_MIN: iota(),

	STK_GOTO: iota(),
	STK_MOVL: iota(),
	STK_MOVR: iota(),
	STK_DUP: iota(),
	STK_DUPA: iota(),
	STK_DUPL: iota(),
	STK_DUPR: iota(),
	STK_DUMP: iota(),
	STK_DROP: iota(),
	STK_GET: iota(),
	STK_SET: iota(),
	STK_TOP: iota(),
	STK_STCK: iota(),

	STK_MAX: iota(),

	// Arithmetic operations
	ART_MIN: iota(),

	ART_ADD: iota(),
	ART_SUB: iota(),
	ART_MLT: iota(),
	ART_DIV: iota(),
	ART_MOD: iota(),

	ART_MAX: iota(),

	// Mathematical operations
	MTH_MIN: iota(),

	MTH_MOD: iota(),

	MTH_MAX: iota(),

	// Bitwise operations
	BTW_MIN: iota(),

	BTW_AND: iota(),
	BTW_OR: iota(),
	BTW_XOR: iota(),
	BTW_NOT: iota(),
	BTW_SHL: iota(),
	BTW_SHR: iota(),

	BTW_MAX: iota(),

	// Comparison operations
	CMP_MIN: iota(),

	CMP_EQ: iota(),
	CMP_NEQ: iota(),
	CMP_GT: iota(),
	CMP_LT: iota(),
	CMP_GTE: iota(),
	CMP_LTE: iota(),
	CMP_NOT: iota(),

	CMP_MAX: iota(),

	// Scope operations
	SCP_MIN: iota(),

	SCP_IF: iota(),
	SCP_LOOP: iota(),
	SCP_FUNC: iota(),
	SCP_STRT: iota(),
	SCP_END: iota(),

	SCP_MAX: iota(),

	// Keywords
	KEY_MIN: iota(),

	KEY_BREK: iota(),
	KEY_CALL: iota(),

	KEY_MAX: iota(),

	// Extra
	EXT_MIN: iota(),

	EXT_IDFR: iota(),

	EXT_MAX: iota(),

	MAX: iota(true)
}

export default class TicoTokenizer extends Tokenizer {
	public constructor() {
		super();

		this.addTokenDefinition([null, /#\*(\s|\S)*?\*#/]);	// Multiline comment
		this.addTokenDefinition([null, /#.*/]);				// Comment
		this.addTokenDefinition([null, /\s+|\n+|\r+/]);		// Whitespace

		for (let i = TokenEnum.LT_MIN + 1; i < TokenEnum.LT_MAX; i++) {
			this.getLiteralTokenRegex(i).forEach(reg => this.addTokenDefinition([i, reg]));
		}
		for (let i = TokenEnum.STK_MIN + 1; i < TokenEnum.STK_MAX; i++) {
			this.getStackTokenRegex(i).forEach(reg => this.addTokenDefinition([i, reg]));
		}
		for (let i = TokenEnum.ART_MIN + 1; i < TokenEnum.ART_MAX; i++) {
			this.getArithmeticTokenRegex(i).forEach(reg => this.addTokenDefinition([i, reg]));
		}
		for (let i = TokenEnum.MTH_MIN + 1; i < TokenEnum.MTH_MAX; i++) {
			this.getMathematicalTokenRegex(i).forEach(reg => this.addTokenDefinition([i, reg]));
		}
		for (let i = TokenEnum.BTW_MIN + 1; i < TokenEnum.BTW_MAX; i++) {
			this.getBitwiseTokenRegex(i).forEach(reg => this.addTokenDefinition([i, reg]));
		}
		for (let i = TokenEnum.CMP_MIN + 1; i < TokenEnum.CMP_MAX; i++) {
			this.getComparisonTokenRegex(i).forEach(reg => this.addTokenDefinition([i, reg]));
		}
		for (let i = TokenEnum.SCP_MIN + 1; i < TokenEnum.SCP_MAX; i++) {
			this.getScopeTokenRegex(i).forEach(reg => this.addTokenDefinition([i, reg]));
		}
		for (let i = TokenEnum.KEY_MIN + 1; i < TokenEnum.KEY_MAX; i++) {
			this.getKeywordTokenRegex(i).forEach(reg => this.addTokenDefinition([i, reg]));
		}
		for (let i = TokenEnum.EXT_MIN + 1; i < TokenEnum.EXT_MAX; i++) {
			this.getExtraTokenRegex(i).forEach(reg => this.addTokenDefinition([i, reg]));
		}
	}

	private getLiteralTokenRegex(tk: number): RegExp[] {
		switch (tk) {
			case TokenEnum.LT_BIGINT: return [/[-+]?\d+n/, /[-+]?\d*\.\d+n/];
			case TokenEnum.LT_NUMBER: return [/[-+]?\d+/, /[-+]?\d*\.\d+/];
			case TokenEnum.LT_STRING: return [/".*?"/, /'.*?'/];

			default: throw new Error(`Not implemented`);
		}
	}

	private getStackTokenRegex(tk: number): RegExp[] {
		switch (tk) {
			case TokenEnum.STK_GOTO: return [/goto/i];
			case TokenEnum.STK_MOVL: return [/movl/i];
			case TokenEnum.STK_MOVR: return [/movr/i];
			case TokenEnum.STK_DUP: return [/dup/i];
			case TokenEnum.STK_DUPA: return [/dupat/i];
			case TokenEnum.STK_DUPL: return [/dupl/i];
			case TokenEnum.STK_DUPR: return [/dupr/i];
			case TokenEnum.STK_DUMP: return [/dump/i];
			case TokenEnum.STK_DROP: return [/drop/i];
			case TokenEnum.STK_GET: return [/get/i];
			case TokenEnum.STK_SET: return [/set/i];
			case TokenEnum.STK_TOP: return [/top/i];
			case TokenEnum.STK_STCK: return [/stack/i];

			default: throw new Error(`Not implemented`);
		}
	}

	private getArithmeticTokenRegex(tk: number): RegExp[] {
		switch (tk) {
			case TokenEnum.ART_ADD: return [/\+/];
			case TokenEnum.ART_SUB: return [/-/];
			case TokenEnum.ART_MLT: return [/\*/];
			case TokenEnum.ART_DIV: return [/\//];
			case TokenEnum.ART_MOD: return [/%/];

			default: throw new Error(`Not implemented`);
		}
	}

	private getMathematicalTokenRegex(tk: number): RegExp[] {
		switch (tk) {
			case TokenEnum.MTH_MOD: return [/mod/i];

			default: throw new Error(`Not implemented`);
		}
	}

	private getBitwiseTokenRegex(tk: number): RegExp[] {
		switch (tk) {
			case TokenEnum.BTW_AND: return [/&/];
			case TokenEnum.BTW_OR: return [/\|/];
			case TokenEnum.BTW_XOR: return [/\^/];
			case TokenEnum.BTW_NOT: return [/~/];
			case TokenEnum.BTW_SHL: return [/<</];
			case TokenEnum.BTW_SHR: return [/>>/];

			default: throw new Error(`Not implemented`);
		}
	}

	private getComparisonTokenRegex(tk: number): RegExp[] {
		switch (tk) {
			case TokenEnum.CMP_EQ: return [/==/];
			case TokenEnum.CMP_NEQ: return [/!=/];
			case TokenEnum.CMP_GT: return [/>/];
			case TokenEnum.CMP_LT: return [/</];
			case TokenEnum.CMP_GTE: return [/>=/];
			case TokenEnum.CMP_LTE: return [/<=/];
			case TokenEnum.CMP_NOT: return [/!/];

			default: throw new Error(`Not implemented`);
		}
	}

	private getScopeTokenRegex(tk: number): RegExp[] {
		switch (tk) {
			case TokenEnum.SCP_IF: return [/if/i];
			case TokenEnum.SCP_LOOP: return [/loop/i];
			case TokenEnum.SCP_FUNC: return [/func/i];
			case TokenEnum.SCP_STRT: return [/start/i];
			case TokenEnum.SCP_END: return [/end/i];

			default: throw new Error(`Not implemented`);
		}
	}
	
	private getKeywordTokenRegex(tk: number): RegExp[] {
		switch (tk) {
			case TokenEnum.KEY_BREK: return [/break/i];
			case TokenEnum.KEY_CALL: return [/call/i];

			default: throw new Error(`Not implemented`);
		}
	}

	private getExtraTokenRegex(tk: number): RegExp[] {
		switch (tk) {
		case TokenEnum.EXT_IDFR: return [/[a-zA-Z_$][\w]*/];

			default: throw new Error(`Not implemented`);
		}
	}
}