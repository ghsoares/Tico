import { Command, CommandEnum } from "./tico";
import Tokenizer from "./tokenizer";

let iotaState = 0;
function IOTA(reset = false) {
	if (reset) {
		let prev = iotaState;
		iotaState = 0;
		return prev;
	}
	return iotaState++;
}

const TokenEnum = {
	// Literals
	LT_BIGINT: IOTA(),
	LT_NUMBER: IOTA(),
	LT_STRING: IOTA(),
	// Operations
	OP_DUMP: IOTA(),
	OP_DROP: IOTA(),
	OP_STCK: IOTA(),
	OP_DUPL: IOTA(),
	OP_REV: IOTA(),
	OP_FUNC: IOTA(),
	OP_CALL: IOTA(),
	OP_LOOP: IOTA(),
	OP_BREK: IOTA(),
	OP_STRT: IOTA(),
	OP_END: IOTA(),
	OP_SET: IOTA(),
	OP_GET: IOTA(),
	OP_IF: IOTA(),
	OP_STR: IOTA(),
	OP_LEN: IOTA(),
	// Binary operations
	OP_ADD: IOTA(),
	OP_SUB: IOTA(),
	OP_MLT: IOTA(),
	OP_DIV: IOTA(),
	OP_MOD: IOTA(),
	// Binary comparison operations
	BOP_GT: IOTA(),
	BOP_LT: IOTA(),
	BOP_GTE: IOTA(),
	BOP_LTE: IOTA(),
	BOP_EQ: IOTA(),
	BOP_NEQ: IOTA(),
	BOP_NOT: IOTA(),
	BOP_AND: IOTA(),
	BOP_OR: IOTA(),

	IDFR: IOTA(),

	MAX: IOTA(true)
}

export default class Parser {
	private tokenizer: Tokenizer;

	public constructor() {
		this.tokenizer = new Tokenizer();

		this.tokenizer.addTokenDefinition([null, /(\/\*)(.|\n|\r)*?(\*\/)/]);
		this.tokenizer.addTokenDefinition([null, /\/\/.*/]);
		this.tokenizer.addTokenDefinition([null, /\s+|\n+|\r+/]);

		for (let i = 0; i < TokenEnum.MAX; i++) {
			this.getTokenRegex(i).forEach(reg => this.tokenizer.addTokenDefinition([i, reg]));
		}
	}

	private getTokenRegex(tk: number): RegExp[] {
		switch (tk) {
			// Literals
			case TokenEnum.LT_BIGINT: return [/\d+n/];
			case TokenEnum.LT_NUMBER: return [/\d+/];
			case TokenEnum.LT_STRING: return [/".*?"/, /'.*?'/];
			// Operations
			case TokenEnum.OP_DUMP: return [/dump/i];
			case TokenEnum.OP_DROP: return [/drop/i];
			case TokenEnum.OP_STCK: return [/stack/i];
			case TokenEnum.OP_DUPL: return [/dup/i];
			case TokenEnum.OP_REV: return [/rev/i];
			case TokenEnum.OP_FUNC: return [/func/i];
			case TokenEnum.OP_CALL: return [/call/i];
			case TokenEnum.OP_LOOP: return [/loop/i];
			case TokenEnum.OP_BREK: return [/break/i];
			case TokenEnum.OP_STRT: return [/start/i];
			case TokenEnum.OP_END: return [/end/i];
			case TokenEnum.OP_SET: return [/set/i];
			case TokenEnum.OP_GET: return [/get/i];
			case TokenEnum.OP_IF: return [/if/i];
			case TokenEnum.OP_STR: return [/str/i];
			case TokenEnum.OP_LEN: return [/len/i];
			// Binary operations
			case TokenEnum.OP_ADD: return [/\+/];
			case TokenEnum.OP_SUB: return [/\-/];
			case TokenEnum.OP_MLT: return [/\*/];
			case TokenEnum.OP_DIV: return [/\//];
			case TokenEnum.OP_MOD: return [/%/];
			// Binary comparison operations
			case TokenEnum.BOP_GT: return [/\>/];
			case TokenEnum.BOP_LT: return [/\</];
			case TokenEnum.BOP_GTE: return [/\>=/];
			case TokenEnum.BOP_LTE: return [/\<=/];
			case TokenEnum.BOP_EQ: return [/==/];
			case TokenEnum.BOP_NEQ: return [/!=/];
			case TokenEnum.BOP_NOT: return [/not/i];
			case TokenEnum.BOP_AND: return [/and/i];
			case TokenEnum.BOP_OR: return [/or/i];

			case TokenEnum.IDFR: return [/[a-zA-Z_$][\w]*/];

			default: throw new Error(`Not implemented`);
		}
	}

	private _parse(insideScope: boolean = false, parseOnce: boolean = false): Command[] {
		const commands: Command[] = [];
		let ended = false;

		while (!this.tokenizer.EOF()) {
			const tk = this.tokenizer.getNextToken();
			if (tk === null) {
				if (this.tokenizer.EOF()) break;
				this.tokenizer.throwError(`Unexpected token`);
			}
			let [tkType, tkValue, tkLine, tkColumn] = tk;

			switch (tkType) {
				// Literals
				case TokenEnum.LT_NUMBER: commands.push([CommandEnum.OP_PUSH, Number(tkValue), tkLine, tkColumn]); break;
				case TokenEnum.LT_BIGINT: commands.push([CommandEnum.OP_PUSH, BigInt(tkValue[0].slice(0, tkValue[0].length - 1)), tkLine, tkColumn]); break;
				case TokenEnum.LT_STRING: {
					let str = tkValue[0].slice(1, tkValue[0].length - 1);
					str = str
							.replace(/\\n/g, "\n")
							.replace(/\\r/g, "\r")
							.replace(/\\t/g, "\t");
					commands.push([CommandEnum.OP_PUSH, str, tkLine, tkColumn]);
				} break;
				// Operations
				case TokenEnum.OP_DUMP: commands.push([CommandEnum.OP_DUMP, null, tkLine, tkColumn]); break;
				case TokenEnum.OP_DROP: commands.push([CommandEnum.OP_DROP, null, tkLine, tkColumn]); break;
				case TokenEnum.OP_STCK: commands.push([CommandEnum.OP_STCK, null, tkLine, tkColumn]); break;
				case TokenEnum.OP_DUPL: commands.push([CommandEnum.OP_DUPL, null, tkLine, tkColumn]); break;
				case TokenEnum.OP_REV: commands.push([CommandEnum.OP_REV, null, tkLine, tkColumn]); break;
				case TokenEnum.OP_FUNC: {
					[tkType, tkValue] = this.tokenizer.getNextToken();
					if (tkType !== TokenEnum.IDFR) this.tokenizer.throwError(`Expected function identifier`);
					const funcName = tkValue[0].toLowerCase();

					[tkType, tkValue] = this.tokenizer.getNextToken();
					if (tkType !== TokenEnum.OP_STRT) this.tokenizer.throwError(`Expected "start" keyword`);
					const funcCommands = this._parse(true);

					commands.push([CommandEnum.OP_FUNC, [funcName, funcCommands], tkLine, tkColumn]);
				} break;
				case TokenEnum.OP_LOOP: {
					[tkType, tkValue] = this.tokenizer.getNextToken();
					if (tkType !== TokenEnum.OP_STRT) this.tokenizer.throwError(`Expected "start" keyword`);
					const funcCommands = this._parse(true);


					commands.push([CommandEnum.OP_LOOP, funcCommands, tkLine, tkColumn]);
				} break;
				case TokenEnum.OP_BREK: commands.push([CommandEnum.OP_BREK, null, tkLine, tkColumn]); break;
				case TokenEnum.OP_CALL: commands.push([CommandEnum.OP_CALL, null, tkLine, tkColumn]); break;
				case TokenEnum.OP_STRT: this.tokenizer.throwError(`"start" keyword must be used to start a scope`);
				case TokenEnum.OP_END: {
					if (insideScope) ended = true;
					else this.tokenizer.throwError(`"end" keyword must be used to end a scope`)
				}; break;
				case TokenEnum.OP_SET: commands.push([CommandEnum.OP_SET, null, tkLine, tkColumn]); break;
				case TokenEnum.OP_GET: commands.push([CommandEnum.OP_GET, null, tkLine, tkColumn]); break;
				case TokenEnum.OP_IF: {
					[tkType, tkValue] = this.tokenizer.getNextToken();
					if (tkType === TokenEnum.OP_STRT) {
						const ifCommands = this._parse(true);
						commands.push([CommandEnum.OP_IF, ifCommands, tkLine, tkColumn]);
					} else {
						this.tokenizer.goBack(tkValue[0].length)
						const ifCommands = this._parse(false, true);
						commands.push([CommandEnum.OP_IF, ifCommands, tkLine, tkColumn]);
					}
				} break;
				case TokenEnum.OP_LEN: commands.push([CommandEnum.OP_LEN, null, tkLine, tkColumn]); break;
				case TokenEnum.OP_STR: commands.push([CommandEnum.OP_STR, null, tkLine, tkColumn]); break;
				// Binary operations
				case TokenEnum.OP_ADD: commands.push([CommandEnum.OP_ADD, null, tkLine, tkColumn]); break;
				case TokenEnum.OP_SUB: commands.push([CommandEnum.OP_SUB, null, tkLine, tkColumn]); break;
				case TokenEnum.OP_MLT: commands.push([CommandEnum.OP_MLT, null, tkLine, tkColumn]); break;
				case TokenEnum.OP_DIV: commands.push([CommandEnum.OP_DIV, null, tkLine, tkColumn]); break;
				case TokenEnum.OP_MOD: commands.push([CommandEnum.OP_MOD, null, tkLine, tkColumn]); break;
				// Binary comparison operations
				case TokenEnum.BOP_GT: commands.push([CommandEnum.BOP_GT, null, tkLine, tkColumn]); break;
				case TokenEnum.BOP_LT: commands.push([CommandEnum.BOP_LT, null, tkLine, tkColumn]); break;
				case TokenEnum.BOP_GTE: commands.push([CommandEnum.BOP_GTE, null, tkLine, tkColumn]); break;
				case TokenEnum.BOP_LTE: commands.push([CommandEnum.BOP_LTE, null, tkLine, tkColumn]); break;
				case TokenEnum.BOP_EQ: commands.push([CommandEnum.BOP_EQ, null, tkLine, tkColumn]); break;
				case TokenEnum.BOP_NEQ: commands.push([CommandEnum.BOP_NEQ, null, tkLine, tkColumn]); break;
				case TokenEnum.BOP_NOT: commands.push([CommandEnum.BOP_NOT, null, tkLine, tkColumn]); break;
				case TokenEnum.BOP_AND: commands.push([CommandEnum.BOP_AND, null, tkLine, tkColumn]); break;
				case TokenEnum.BOP_OR: commands.push([CommandEnum.BOP_OR, null, tkLine, tkColumn]); break;

				case TokenEnum.IDFR: commands.push([CommandEnum.IDFR, tkValue[0].toLowerCase(), tkLine, tkColumn]); break;

				default: throw new Error(`Not implemented`);
			}

			if (insideScope && ended || parseOnce) break;
		}

		if (insideScope && !ended) {
			this.tokenizer.throwError(`Couldn't find end of scope`);
		}

		return commands;
	}

	public parse(str: string): Command[] {
		this.tokenizer.init(str);

		return this._parse();
	}
}