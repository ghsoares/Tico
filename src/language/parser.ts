/* eslint-disable no-lone-blocks */
import { Command, CommandEnum } from "./tico";
import TicoTokenizer, { TokenEnum } from "./ticoTokenizer";

export default class Parser {
	private tokenizer: TicoTokenizer;

	public constructor() {
		this.tokenizer = new TicoTokenizer();
	}

	private _parse(insideScope: boolean = false, parseOnce: boolean = false): Command[] {
		const commands: Command[] = [];
		let ended = false;

		const cursorStart = this.tokenizer.getCursorPos();

		while (!this.tokenizer.EOF()) {
			const [tkType, tkValue, tkStart, tkEnd] = this.tokenizer.getNextToken();
			if (tkType === -2) break;
			if (tkType === -1) this.tokenizer.throwError(`Unexpected token ${tkValue[0]}`);

			switch (tkType) {
				// Literals
				case TokenEnum.LT_NUMBER: {
					commands.push([
						CommandEnum.STK_PUSH,
						['number', Number(tkValue)],
						tkStart, tkEnd
					]);
				} break;
				case TokenEnum.LT_BIGINT: {
					commands.push([
						CommandEnum.STK_PUSH,
						['bigint', BigInt(tkValue[0].slice(0, tkValue[0].length - 1))],
						tkStart, tkEnd
					]);
				} break;
				case TokenEnum.LT_STRING: {
					let str = tkValue[0].slice(1, tkValue[0].length - 1);
					str = str
							.replace(/\\n/g, "\n")
							.replace(/\\r/g, "\r")
							.replace(/\\t/g, "\t")
							.replace(/\\x1B/g, "\x1B");
					commands.push([
						CommandEnum.STK_PUSH,
						['string', str], tkStart, tkEnd
					]);
				} break;
				
				// Stack operations
				case TokenEnum.STK_GOTO: {
					commands.push([
						CommandEnum.STK_GOTO,
						null,
						tkStart, tkEnd
					]);
				} break;
				case TokenEnum.STK_MOVL: {
					commands.push([
						CommandEnum.STK_MOVL,
						null,
						tkStart, tkEnd
					]);
				} break;
				case TokenEnum.STK_MOVR: {
					commands.push([
						CommandEnum.STK_MOVR,
						null,
						tkStart, tkEnd
					]);
				} break;
				case TokenEnum.STK_DUP: {
					commands.push([
						CommandEnum.STK_DUP,
						null,
						tkStart, tkEnd
					]);
				} break;
				case TokenEnum.STK_DUPA: {
					commands.push([
						CommandEnum.STK_DUPA,
						null,
						tkStart, tkEnd
					]);
				} break;
				case TokenEnum.STK_DUPL: {
					commands.push([
						CommandEnum.STK_DUPL,
						null,
						tkStart, tkEnd
					]);
				} break;
				case TokenEnum.STK_DUPR: {
					commands.push([
						CommandEnum.STK_DUPR,
						null,
						tkStart, tkEnd
					]);
				} break;
				case TokenEnum.STK_DUMP: {
					commands.push([
						CommandEnum.STK_DUMP,
						null,
						tkStart, tkEnd
					]);
				} break;
				case TokenEnum.STK_DROP: {
					commands.push([
						CommandEnum.STK_DROP,
						null,
						tkStart, tkEnd
					]);
				} break;
				case TokenEnum.STK_GET: {
					commands.push([
						CommandEnum.STK_GET,
						null,
						tkStart, tkEnd
					]);
				} break;
				case TokenEnum.STK_SET: {
					commands.push([
						CommandEnum.STK_SET,
						null,
						tkStart, tkEnd
					]);
				} break;
				case TokenEnum.STK_TOP : {
					commands.push([
						CommandEnum.STK_TOP ,
						null,
						tkStart, tkEnd
					]);
				} break;
				case TokenEnum.STK_STCK: {
					commands.push([
						CommandEnum.STK_STCK,
						null,
						tkStart, tkEnd
					]);
				} break;
				
				// Arithmetic operations
				case TokenEnum.ART_ADD: {
					commands.push([
						CommandEnum.ART_ADD,
						null,
						tkStart, tkEnd
					]);
				} break;
				case TokenEnum.ART_SUB: {
					commands.push([
						CommandEnum.ART_SUB,
						null,
						tkStart, tkEnd
					]);
				} break;
				case TokenEnum.ART_MLT: {
					commands.push([
						CommandEnum.ART_MLT,
						null,
						tkStart, tkEnd
					]);
				} break;
				case TokenEnum.ART_DIV: {
					commands.push([
						CommandEnum.ART_DIV,
						null,
						tkStart, tkEnd
					]);
				} break;
				case TokenEnum.ART_MOD: {
					commands.push([
						CommandEnum.ART_MOD,
						null,
						tkStart, tkEnd
					]);
				} break;

				// Mathematical operations
				case TokenEnum.MTH_MOD: {
					commands.push([
						CommandEnum.MTH_MOD,
						null,
						tkStart, tkEnd
					]);
				} break;

				// Bitwise operations
				case TokenEnum.BTW_AND: {
					commands.push([
						CommandEnum.BTW_AND,
						null,
						tkStart, tkEnd
					]);
				} break;
				case TokenEnum.BTW_OR: {
					commands.push([
						CommandEnum.BTW_OR,
						null,
						tkStart, tkEnd
					]);
				} break;
				case TokenEnum.BTW_XOR: {
					commands.push([
						CommandEnum.BTW_XOR,
						null,
						tkStart, tkEnd
					]);
				} break;
				case TokenEnum.BTW_NOT: {
					commands.push([
						CommandEnum.BTW_NOT,
						null,
						tkStart, tkEnd
					]);
				} break;
				case TokenEnum.BTW_SHL: {
					commands.push([
						CommandEnum.BTW_SHL,
						null,
						tkStart, tkEnd
					]);
				} break;
				case TokenEnum.BTW_SHR: {
					commands.push([
						CommandEnum.BTW_SHR,
						null,
						tkStart, tkEnd
					]);
				} break;

				// Comparison operations
				case TokenEnum.CMP_EQ: {
					commands.push([
						CommandEnum.CMP_EQ,
						null,
						tkStart, tkEnd
					]);
				} break;
				case TokenEnum.CMP_NEQ: {
					commands.push([
						CommandEnum.CMP_NEQ,
						null,
						tkStart, tkEnd
					]);
				} break;
				case TokenEnum.CMP_GT: {
					commands.push([
						CommandEnum.CMP_GT,
						null,
						tkStart, tkEnd
					]);
				} break;
				case TokenEnum.CMP_LT: {
					commands.push([
						CommandEnum.CMP_LT,
						null,
						tkStart, tkEnd
					]);
				} break;
				case TokenEnum.CMP_GTE: {
					commands.push([
						CommandEnum.CMP_GTE,
						null,
						tkStart, tkEnd
					]);
				} break;
				case TokenEnum.CMP_LTE: {
					commands.push([
						CommandEnum.CMP_LTE,
						null,
						tkStart, tkEnd
					]);
				} break;
				case TokenEnum.CMP_NOT: {
					commands.push([
						CommandEnum.CMP_NOT,
						null,
						tkStart, tkEnd
					]);
				} break;

				// Scope operations
				case TokenEnum.SCP_IF: {
					let [tkType1, tkValue1] = this.tokenizer.getNextToken();
					if (tkType1 === TokenEnum.SCP_STRT) {
						const ifCommands = this._parse(true);
						commands.push([
							CommandEnum.SCP_IF,
							ifCommands,
							tkStart, tkEnd
						]);
					} else {
						this.tokenizer.goBack(tkValue1[0].length);
						const ifCommands = this._parse(false, true);
						commands.push([
							CommandEnum.SCP_IF,
							ifCommands,
							tkStart, tkEnd
						]);
					}
				} break;
				case TokenEnum.SCP_LOOP: {
					let [tkType1] = this.tokenizer.getNextToken();
					if (tkType1 !== TokenEnum.SCP_STRT) throw new Error(`Expected "start" keyword`);

					const loopCommands = this._parse(true);
					commands.push([
						CommandEnum.SCP_LOOP,
						loopCommands,
						tkStart, tkEnd
					]);
				} break;
				case TokenEnum.SCP_FUNC: {
					let [tkType1, tkValue1] = this.tokenizer.getNextToken();
					if (tkType1 !== TokenEnum.EXT_IDFR) throw new Error(`Expected function identifier`);
					const identifier = tkValue1;

					[tkType1, tkValue1] = this.tokenizer.getNextToken();
					if (tkType1 !== TokenEnum.SCP_STRT) throw new Error(`Expected "start" keyword`);

					const funcCommands = this._parse(true);
					commands.push([
						CommandEnum.SCP_FUNC,
						[identifier, funcCommands],
						tkStart, tkEnd
					]);
				} break;
				case TokenEnum.SCP_STRT: {
					throw new Error(`"start" keyword must be used to start scopes`);
				};
				case TokenEnum.SCP_END: {
					if (insideScope) {
						ended = true;
					} else {
						throw new Error(`"start" keyword must be used to end scopes`);
					}
				} break;

				// Keywords
				case TokenEnum.KEY_BREK: {
					commands.push([
						CommandEnum.KEY_BREK,
						null,
						tkStart, tkEnd
					]);
				} break;
				case TokenEnum.KEY_CALL: {
					commands.push([
						CommandEnum.KEY_CALL,
						null,
						tkStart, tkEnd
					]);
				} break;

				// Extra
				case TokenEnum.EXT_IDFR: {
					commands.push([
						CommandEnum.STK_PUSH,
						['identifier', tkValue],
						tkStart, tkEnd
					]);
				} break;

				default: throw new Error(`Not implemented`);
			}

			if ((insideScope && ended) || parseOnce) break;
		}

		if (insideScope && !ended) {
			this.tokenizer.goTo(cursorStart);
			this.tokenizer.throwError(`Couldn't find end of scope`);
		}

		return commands;
	}

	public parse(str: string): Command[] {
		this.tokenizer.init(str);

		return this._parse();
	}
}