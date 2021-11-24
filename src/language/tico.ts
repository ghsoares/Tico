/* eslint-disable no-lone-blocks */
import Parser from "./parser";

let iotaState = 0;
function iota(reset = false) {
	if (reset) {
		let prev = iotaState;
		iotaState = 0;
		return prev;
	}
	return iotaState++;
}

export type Command = [number, any, number, number];

export const CommandEnum = {
	// Stack operations
	STK_PUSH: iota(),
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

	// Arithmetic operations
	ART_ADD: iota(),
	ART_SUB: iota(),
	ART_MLT: iota(),
	ART_DIV: iota(),
	ART_MOD: iota(),

	// Mathematical operations
	MTH_MOD: iota(),

	// Bitwise operations
	BTW_AND: iota(),
	BTW_OR: iota(),
	BTW_XOR: iota(),
	BTW_NOT: iota(),
	BTW_SHL: iota(),
	BTW_SHR: iota(),

	// Comparison operations
	CMP_EQ: iota(),
	CMP_NEQ: iota(),
	CMP_GT: iota(),
	CMP_LT: iota(),
	CMP_GTE: iota(),
	CMP_LTE: iota(),
	CMP_NOT: iota(),

	// Scope operations
	SCP_IF: iota(),
	SCP_ELSE: iota(),
	SCP_ELIF: iota(),
	SCP_LOOP: iota(),
	SCP_FUNC: iota(),

	// Keywords
	KEY_BREK: iota(),
	KEY_CALL: iota(),

	MAX: iota(true)
}

//type Performance = { peakMem: number };

function waitFrame() {
	return new Promise<void>((resolve) => {
		setTimeout(resolve, 0);
	})
}

class ProgramScope {
	public isLoop: boolean;
	public isStopped: boolean;
	private functions: { [key: string]: ProgramScope };
	private variables: { [key: string]: any };
	private program: TicoProgram;
	private parent: ProgramScope;
	private commands: Command[];

	constructor(
		program: TicoProgram,
		parent: ProgramScope,
		commands: Command[]
	) {
		this.program = program;
		this.parent = parent;
		this.commands = commands;
		this.isLoop = false;
		this.isStopped = false;
	}

	public hasIdentifier(id: string): boolean {
		if (this.functions[id]) return true;
		if (this.variables[id]) return true;
		if (this.parent) return this.parent.hasIdentifier(id);
		return false;
	}

	public getFunction(id: string): ProgramScope {
		let func = this.functions[id];
		if (func === undefined && this.parent)
			func = this.parent.getFunction(id);
		return func;
	}

	public run(): void {
		this.functions = {};
		this.variables = {};
		this.isStopped = false;

		this.program.pushRunningScope(this);

		for (const command of this.commands) {
			if (this.isStopped) break;

			this.program.currentCommand = command;

			if (this.isStopped) break;

			const [commandType, commandArg] = command;

			switch (commandType) {
				// Stack operations
				case CommandEnum.STK_PUSH: {
					this.program.push(commandArg[1], commandArg[0]);
				} break;
				case CommandEnum.STK_GOTO: {
					this.program.expectCount(1);
					this.program.goto(this.program.pop('number')[1]);
				} break;
				case CommandEnum.STK_MOVL: {
					this.program.expectCount(1);
					this.program.move(-this.program.pop('number')[1]);
				} break;
				case CommandEnum.STK_MOVR: {
					this.program.expectCount(1);
					this.program.move(this.program.pop('number')[1]);
				} break;
				case CommandEnum.STK_DUP: {
					const v = this.program.pop();
					this.program.push(v[1], v[0]);
					this.program.push(v[1], v[0]);
				} break;
				case CommandEnum.STK_DUPA: {
					this.program.expectCount(1);
					const pos = this.program.pop('number')[1];
					const v = this.program.getAt(pos);
					this.program.push(v[1], v[0]);
				} break;
				case CommandEnum.STK_DUPL: {
					this.program.expectCount(1);
					const ofs = this.program.pop('number')[1];
					const v = this.program.getAt(this.program.getStackCursor() - ofs);
					this.program.push(v[1], v[0]);
				} break;
				case CommandEnum.STK_DUPR: {
					this.program.expectCount(1);
					const ofs = this.program.pop('number')[1];
					const v = this.program.getAt(this.program.getStackCursor() + ofs);
					this.program.push(v[1], v[0]);
				} break;
				case CommandEnum.STK_DUMP: {
					this.program.expectCount(1, "There is nothing to dump on stack");
					this.program.onStdOut(this.program.pop()[1]);
				} break;
				case CommandEnum.STK_DROP: {
					this.program.expectCount(1, "There is nothing to drop on stack");
					this.program.pop();
				} break;
				case CommandEnum.STK_GET: {
					const v = this.program.pop();
					this.program.writeBuffer = v;
				} break;
				case CommandEnum.STK_SET: {
					if (this.program.writeBuffer === undefined)
						throw new Error(`There is nothing on write buffer`);
					this.program.push(this.program.writeBuffer[1], this.program.writeBuffer[0]);
				} break;
				case CommandEnum.STK_TOP: {
					const stackSize = this.program.getStackSize() - 1;
					this.program.push(stackSize, 'number');
				} break;
				case CommandEnum.STK_STCK: {
					this.program.printStack();
				} break;

				// Arithmetic operations
				case CommandEnum.ART_ADD: {
					this.program.expectCount(2, "Operation requires 2 data on stack");
					const [right, left] = [this.program.pop()[1], this.program.pop()[1]];
					this.program.push(left + right);
				} break;
				case CommandEnum.ART_SUB: {
					this.program.expectCount(2, "Operation requires 2 data on stack");
					const [right, left] = [this.program.pop()[1], this.program.pop()[1]];
					this.program.push(left - right);
				} break;
				case CommandEnum.ART_MLT: {
					this.program.expectCount(2, "Operation requires 2 data on stack");
					const [right, left] = [this.program.pop(), this.program.pop()];
					this.program.push(left[1] * right[1]);
				} break;
				case CommandEnum.ART_DIV: {
					this.program.expectCount(2, "Operation requires 2 data on stack");
					const [right, left] = [this.program.pop(), this.program.pop()];
					this.program.push(left[1] / right[1]);
				} break;
				case CommandEnum.ART_MOD: {
					this.program.expectCount(2, "Operation requires 2 data on stack");
					const [right, left] = [this.program.pop(), this.program.pop()];
					this.program.push(left[1] % right[1]);
				} break;

				// Mathematical operations
				case CommandEnum.MTH_MOD: {
					this.program.expectCount(2, "Operation requires 2 data on stack");
					const [right, left] = [this.program.pop(), this.program.pop()];
					//((n % m) + m) % m;
					this.program.push( ((left[1] % right[1]) + right[1]) % right[1]);
				} break;

				// Bitwise operations
				case CommandEnum.BTW_AND: {
					this.program.expectCount(2, "Operation requires 2 data on stack");
					const [right, left] = [this.program.pop(), this.program.pop()];
					this.program.push((left[1] & right[1]) >>> 0);
				} break;
				case CommandEnum.BTW_OR: {
					this.program.expectCount(2, "Operation requires 2 data on stack");
					const [right, left] = [this.program.pop(), this.program.pop()];
					this.program.push((left[1] | right[1]) >>> 0);
				} break;
				case CommandEnum.BTW_XOR: {
					this.program.expectCount(2, "Operation requires 2 data on stack");
					const [right, left] = [this.program.pop(), this.program.pop()];
					this.program.push((left[1] ^ right[1]) >>> 0);
				} break;
				case CommandEnum.BTW_NOT: {
					this.program.expectCount(1, "Expected a number on stack");
					this.program.push((~this.program.pop()[1]) >>> 0);
				} break;
				case CommandEnum.BTW_SHL: {
					this.program.expectCount(2, "Operation requires 2 data on stack");
					const [right, left] = [this.program.pop(), this.program.pop()];
					this.program.push((left[1] << right[1]) >>> 0);
				} break;
				case CommandEnum.BTW_SHR: {
					this.program.expectCount(2, "Operation requires 2 data on stack");
					const [right, left] = [this.program.pop(), this.program.pop()];
					this.program.push((left[1] >>> right[1]) >>> 0);
				} break;

				// Comparison operations
				case CommandEnum.CMP_EQ: {
					this.program.expectCount(2, "Operation requires 2 data on stack");
					const [right, left] = [this.program.pop(), this.program.pop()];
					this.program.push(left[1] === right[1] ? 1 : 0);
				} break;
				case CommandEnum.CMP_NEQ: {
					this.program.expectCount(2, "Operation requires 2 data on stack");
					const [right, left] = [this.program.pop(), this.program.pop()];
					this.program.push(left[1] !== right[1] ? 1 : 0);
				} break;
				case CommandEnum.CMP_GT: {
					this.program.expectCount(2, "Operation requires 2 data on stack");
					const [right, left] = [this.program.pop(), this.program.pop()];
					this.program.push(left[1] > right[1] ? 1 : 0);
				} break;
				case CommandEnum.CMP_LT: {
					this.program.expectCount(2, "Operation requires 2 data on stack");
					const [right, left] = [this.program.pop(), this.program.pop()];
					this.program.push(left[1] < right[1] ? 1 : 0);
				} break;
				case CommandEnum.CMP_GTE: {
					this.program.expectCount(2, "Operation requires 2 data on stack");
					const [right, left] = [this.program.pop(), this.program.pop()];
					this.program.push(left[1] >= right[1] ? 1 : 0);
				} break;
				case CommandEnum.CMP_LTE: {
					this.program.expectCount(2, "Operation requires 2 data on stack");
					const [right, left] = [this.program.pop(), this.program.pop()];
					this.program.push(left[1] <= right[1] ? 1 : 0);
				} break;
				case CommandEnum.CMP_NOT: {
					this.program.expectCount(1, "Expected a number on stack");
					const v = this.program.pop();
					this.program.push(v[1] ? 0 : 1);
				} break;

				// Scope operations
				case CommandEnum.SCP_IF: {
					this.program.expectCount(1);
					const condition = this.program.pop('number')[1];
					if (condition) {
						const ifScope = new ProgramScope(
							this.program, this, commandArg
						);
						ifScope.run();
					}
				} break;
				case CommandEnum.SCP_LOOP: {
					const loopScope = new ProgramScope(
						this.program, this, commandArg
					);
					loopScope.isLoop = true;
					while (true) {
						loopScope.run();
						if (loopScope.isStopped) break;
					}
				} break;
				case CommandEnum.SCP_FUNC: {
					const [funcName, funcCommands] = commandArg;
					const funcScope = new ProgramScope(
						this.program, this, funcCommands
					);
					if (this.hasIdentifier(funcName))
						throw new Error(`Identifier "${funcName}" already exists`);
					this.functions[funcName] = funcScope;
				} break;

				// Keywords
				case CommandEnum.KEY_BREK: {
					let p: ProgramScope = this;
					p.isStopped = true;
					while (true) {
						if (p === null) {
							throw new Error(`"break" command must be used inside loops only`);
						}
						if (p.isLoop) break;
						else {
							p = p.parent;
							p.isStopped = true;
						}
					}
				} break;
				case CommandEnum.KEY_CALL: {
					this.program.expectCount(1, "Expected function identifier");
					const funcName = this.program.pop('identifier')[1];
					const func = this.getFunction(funcName);
					if (func === undefined)
						throw new Error(`There is no function declared "${funcName}"`);
					func.run();
				} break;

				default: throw new Error(`Not implemented`)
			}
		}

		this.program.popRunningScope();
	}
}

export default class TicoProgram {
	public onStdOut: (...args: any[]) => void;
	public onStdErr: (...args: any[]) => void;
	/*public onStackChanged: (stack: [string, any][]) => void;
	public onStackCursorChanged: (cursorPos: number) => void;
	public onCurrentCommandChanged: (cmd: Command) => void;
	public onPaused: () => void;*/
	public currentCommand: Command;
	public writeBuffer: [string, any];
	/*public waitTimerStart: number;
	public paused: boolean;
	public pauseEveryCommand: boolean;*/
	/*private stackChanged: boolean;
	private stackCursorChanged: boolean;*/
	private mainScope: ProgramScope;
	private stack: [string, any][];
	private stackCursor: number;
	private stackSize: number;
	private commands: Command[];
	private running: boolean;
	private stopping: boolean;
	private runningScopes: ProgramScope[];

	public constructor(
		commands: Command[]
	) {
		this.commands = commands;
		this.stack = [];
		this.onStdOut = (...args) => { console.log(args) };
		this.onStdErr = (...args) => { console.error(args) };
		/*this.onStackChanged = (_) => { };
		this.onStackCursorChanged = (_) => { };
		this.onCurrentCommandChanged = (_) => { };
		this.onPaused = () => { };*/
		this.running = false;
		this.stopping = false;
		/*this.stopping = false;
		this.paused = false;
		this.pauseEveryCommand = false;*/
	}

	private _push(idx: number, item: [string, any]): void {
		this.stack.splice(idx, 0, item);
		this.stackSize++;
	}

	private _pop(idx: number): [string, any] {
		const v = this.stack.splice(idx, 1)[0];
		this.stackSize--;
		return v;
	}

	public getStackSize(): number { return this.stackSize; }

	public getStackCursor(): number { return this.stackCursor; }

	public getAt(pos: number): [string, any] {
		if (pos < 0 || pos >= this.stackSize)
			throw new RangeError(`Out of bounds`);
		return this.stack[pos];
	}

	public expectCount(count: number, msg: string = ""): void {
		if (this.stackCursor + 1 < count)
			throw new Error(`Command expected ${count} data on stack`);
	}

	public push(item: any, type: string = ""): void {
		if (type === "") type = typeof item;

		this._push(this.stackCursor + 1, [type, item]);
		this.stackCursor++;
		/*this.stackChanged = true;
		this.stackCursorChanged = true;*/
	}

	public pop(type: string = ""): [string, any] {
		const v = this._pop(this.stackCursor);
		this.stackCursor--;

		if (type !== "" && v[0] !== type) throw new Error(`Expected type "${type}"`);
		/*this.stackChanged = true;
		this.stackCursorChanged = true;*/
		return v;
	}

	public goto(pos: number): void {
		if (pos < 0 || pos >= this.stackSize)
			throw new RangeError(`Out of bounds`);
		this.stackCursor = pos;
		//this.stackCursorChanged = true;
	}

	public move(steps: number): void {
		this.stackCursor += steps;
		if (this.stackCursor < 0 || this.stackCursor >= this.stackSize)
			throw new RangeError(`Stack cursor out of bounds`);
		//this.stackCursorChanged = true;
	}

	public printStack(): void {
		if (this.stackSize === 0) {
			this.onStdOut("\nEmpty stack\n");
			return;
		}
		this.onStdOut(`\nStack (cursor at ${this.stackCursor}):\n`);
		let cs = "";
		this.onStdOut(this.stack.map(val => val[1]).join(", "));

		for (let i = 0; i < this.stackCursor && i < this.stackSize; i++) {
			cs += " ".repeat(("" + this.stack[i][1]).length);
			cs += "  ";
		}
		this.onStdOut("\n" + cs + "^");

		this.onStdOut("\n");
	}

	public pushRunningScope(scope: ProgramScope): void {
		this.runningScopes.push(scope);
	}

	public popRunningScope(): void {
		this.runningScopes.pop();
	}

	public run(): void {
		if (this.running) throw new Error(`Trying to run a running program, stop it first`);

		this.running = true;
		this.stopping = false;

		this.stack = [];
		this.runningScopes = [];
		this.stackCursor = -1;
		this.stackSize = 0;
		this.currentCommand = null;
		this.writeBuffer = undefined;
		/*this.stackChanged = false;
		this.stackChanged = false;
		this.waitTimerStart = Date.now();*/
		this.mainScope = new ProgramScope(
			this, null, this.commands
		);
		try {
			this.mainScope.run();
			if (!this.stopping) {
				if (this.stack.length > 0) {
					this.printStack();
					throw new Error(`Unhandled ${this.stack.length} data on end of program.`);
				}
			}

			this.stack = [];
			this.stackCursor = -1;
			this.onStdOut(`\nProgram end\n`);
		} catch (e) {
			this.onStdOut(`\nRuntime error at pos ${this.currentCommand[2]}: ${e}\n`);
		}

		this.running = false;
		this.stopping = false;
	}

	public stop(): void {
		if (!this.running) throw new Error(`Trying to stop a stopped program, run it first`);
		if (this.stopping) throw new Error(`Program already stopping.`);
		for (const scope of this.runningScopes) {
			scope.isStopped = true;
		}
		this.stopping = true;
	}

	public isRunning(): boolean {
		return this.running;
	}

	public isStopping(): boolean {
		return this.stopping;
	}

	public static fromSourceCode(source: string): TicoProgram {
		const parser = new Parser();
		const prog = new TicoProgram(parser.parse(source));
		return prog;
	}
}