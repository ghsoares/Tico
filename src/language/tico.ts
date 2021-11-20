import Parser from "./parser";

let iotaState = 0;
function IOTA(reset = false) {
	if (reset) {
		let prev = iotaState;
		iotaState = 0;
		return prev;
	}
	return iotaState++;
}

export type Command = [number, any, number, number];

export const CommandEnum = {
	OP_PUSH: IOTA(),
	// Operations
	OP_DUMP: IOTA(),
	OP_STCK: IOTA(),
	OP_DROP: IOTA(),
	OP_DUPL: IOTA(),
	OP_REV: IOTA(),
	OP_FUNC: IOTA(),
	OP_LOOP: IOTA(),
	OP_BREK: IOTA(),
	OP_CALL: IOTA(),
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

type StdOut = (...args: any[]) => void;
type StdErr = (...args: any[]) => void;
type Performance = { peakMem: number };

class ProgramScope {
	public isLoop: boolean;
	public isBreaked: boolean;
	private functions: { [key: string]: ProgramScope };
	private variables: { [key: string]: any };
	private stack: any[];
	private program: TicoProgram;
	private parent: ProgramScope;
	private commands: Command[];

	constructor(
		stack: any[],
		program: TicoProgram,
		parent: ProgramScope,
		commands: Command[]
	) {
		this.stack = stack;
		this.program = program;
		this.parent = parent;
		this.commands = commands;
		this.isLoop = false;
		this.isBreaked = false;
	}

	private getFunction(name: string): ProgramScope {
		let func = this.functions[name];
		if (func === undefined && this.parent) {
			func = this.parent.getFunction(name);
		}
		if (func === undefined) {
			func = this.program.getFunction(name);
		}
		return func;
	}

	private getVariable(name: string): any {
		let val = this.variables[name];
		if (val === undefined && this.parent) {
			val = this.parent.getVariable(name);
		}
		if (val === undefined) {
			val = this.program.getVariable(name);
		}
		return val;
	}

	private setVariable(name: string, value: any): boolean {
		if (this.variables[name] !== undefined) {
			this.variables[name] = value;
			return true;
		}
		else if (this.parent) return this.parent.setVariable(name, value);
		else this.program.setVariable(name, value);

		return false;
	}

	// Operations
	private op_push(what: any): void {
		this.stack.push(what);
	}

	private op_drop(commandArg: any): void {
		if (this.stack.length < 1) throw new Error(`There is nothing to drop on stack`);
		this.stack.pop();
	}

	private op_dupl(commandArg: any): void {
		if (this.stack.length < 1) throw new Error(`There is nothing to duplicate on stack`);
		const v = this.stack.pop();
		this.stack.push(v, v);
	}

	private op_rev(commandArg: any): void {
		if (this.stack.length < 2) throw new Error(`Operation requires two data on stack`);
		const [right, left] = [this.stack.pop(), this.stack.pop()];
		this.stack.push(right, left);
	}

	private op_dump(commandArg: any): void {
		if (this.stack.length < 1) throw new Error(`There is nothing to dump on stack`);
		this.program.std_out(this.stack.pop());
	}

	private op_stck(commandArg: any): void {

		this.program.std_out("\nStack: ");
		this.program.std_out(this.stack);
		this.program.std_out("\n");
	}

	private op_func([funcName, funcCommands]): void {
		if (this.getFunction(funcName) !== undefined) throw new Error(`Function "${funcName}" is already declared`);
		this.functions[funcName] = new ProgramScope(
			this.stack,
			this.program,
			this,
			funcCommands
		);
	}

	private op_loop(lpCommands: Command[]): void {
		const loop = new ProgramScope(
			this.stack,
			this.program,
			this,
			lpCommands
		);
		loop.isLoop = true;

		while (true) {
			loop.run();
			if (loop.isBreaked) break;
		}
	}

	private op_brek(commandArg: any): void {
		if (this.isLoop) {
			this.isBreaked = true;
		} else if (this.parent) {
			this.parent.op_brek(commandArg);
		} else {
			throw new Error(`"break" keyword must be used inside loops`);
		}
	}

	private op_call(commandArg: any): void {
		if (this.stack.length < 1) throw new Error(`There is no identifier on stack`);
		const id = this.stack.pop();
		const func = this.getFunction(id);
		if (func === undefined) throw new Error(`There is no function called "${id}"`);
		func.run();
	}

	private op_set(commandArg: any): void {
		if (this.stack.length < 2) throw new Error(`Operation requires two data on stack`);
		const [value, identifier] = [this.stack.pop(), this.stack.pop()];
		if (!this.setVariable(identifier, value)) {
			this.variables[identifier] = value;
		}
	}

	private op_get(commandArg: any): void {
		if (this.stack.length < 1) throw new Error(`There is no identifier on stack`);
		const id = this.stack.pop();
		const value = this.getVariable(id);
		if (value === undefined) throw new Error(`There is no variable called "${id}"`);
		this.stack.push(value);
	}

	private op_if(ifCommands: Command[]): void {
		if (this.stack.length < 1) throw new Error(`There is no boolean on stack`);
		const condition = this.stack.pop();
		if (condition) {
			const exec = new ProgramScope(
				this.stack,
				this.program,
				this,
				ifCommands
			);
			exec.run();
		}
	}

	private op_str(commandArg: any): void {
		if (this.stack.length < 1) throw new Error(`There is no string on stack`);
		this.stack.push(String(this.stack.pop()));
	}

	private op_len(commandArg: any): void {
		if (this.stack.length < 1) throw new Error(`There is no string on stack`);
		const str = this.stack.pop();
		if (typeof str === 'string') {
			this.stack.push(str.length);
		} else throw new Error(`"len" operation only works for strings`);
	}

	// Binary operations
	private op_add(commandArg: any): void {
		if (this.stack.length < 2) throw new Error(`Operation requires two data on stack`);
		const [right, left] = [this.stack.pop(), this.stack.pop()];
		this.stack.push(left + right);
	}

	private op_sub(commandArg: any): void {
		if (this.stack.length < 2) throw new Error(`Operation requires two data on stack`);
		const [right, left] = [this.stack.pop(), this.stack.pop()];
		this.stack.push(left - right);
	}

	private op_mlt(commandArg: any): void {
		if (this.stack.length < 2) throw new Error(`Operation requires two data on stack`);
		const [right, left] = [this.stack.pop(), this.stack.pop()];
		this.stack.push(left * right);
	}

	private op_div(commandArg: any): void {
		if (this.stack.length < 2) throw new Error(`Operation requires two data on stack`);
		const [right, left] = [this.stack.pop(), this.stack.pop()];
		this.stack.push(left / right);
	}

	private op_mod(commandArg: any): void {
		if (this.stack.length < 2) throw new Error(`Operation requires two data on stack`);
		const [right, left] = [this.stack.pop(), this.stack.pop()];
		this.stack.push(left % right);
	}

	// Binary comparison operations
	private bop_gt(commandArg: any): void {
		if (this.stack.length < 2) throw new Error(`Operation requires two data on stack`);
		const [right, left] = [this.stack.pop(), this.stack.pop()];
		this.stack.push(left > right);
	}

	private bop_lt(commandArg: any): void {
		if (this.stack.length < 2) throw new Error(`Operation requires two data on stack`);
		const [right, left] = [this.stack.pop(), this.stack.pop()];
		this.stack.push(left < right);
	}

	private bop_gte(commandArg: any): void {
		if (this.stack.length < 2) throw new Error(`Operation requires two data on stack`);
		const [right, left] = [this.stack.pop(), this.stack.pop()];
		this.stack.push(left >= right);
	}

	private bop_lte(commandArg: any): void {
		if (this.stack.length < 2) throw new Error(`Operation requires two data on stack`);
		const [right, left] = [this.stack.pop(), this.stack.pop()];
		this.stack.push(left <= right);
	}

	private bop_eq(commandArg: any): void {
		if (this.stack.length < 2) throw new Error(`Operation requires two data on stack`);
		const [right, left] = [this.stack.pop(), this.stack.pop()];
		this.stack.push(left == right);
	}

	private bop_neq(commandArg: any): void {
		if (this.stack.length < 2) throw new Error(`Operation requires two data on stack`);
		const [right, left] = [this.stack.pop(), this.stack.pop()];
		this.stack.push(left != right);
	}

	private bop_not(commandArg: any): void {
		if (this.stack.length < 1) throw new Error(`There is no boolean on stack`);
		this.stack.push(!this.stack.pop());
	}

	private bop_and(commandArg: any): void {
		if (this.stack.length < 2) throw new Error(`Operation requires two data on stack`);
		const [right, left] = [this.stack.pop(), this.stack.pop()];
		this.stack.push(left && right);
	}

	private bop_or(commandArg: any): void {
		if (this.stack.length < 2) throw new Error(`Operation requires two data on stack`);
		const [right, left] = [this.stack.pop(), this.stack.pop()];
		this.stack.push(left || right);
	}

	private idfr(id: string): void {
		this.stack.push(id);
	}

	public run() {
		this.functions = {};
		this.variables = [];
		for (const command of this.commands) {
			this.program.currentCommand = command;
			const [commandType, commandArg] = command;
			switch (commandType) {
				case CommandEnum.OP_PUSH: this.op_push(commandArg); break;
				// Operations
				case CommandEnum.OP_DROP: this.op_drop(commandArg); break;
				case CommandEnum.OP_DUMP: this.op_dump(commandArg); break;
				case CommandEnum.OP_STCK: this.op_stck(commandArg); break;
				case CommandEnum.OP_DUPL: this.op_dupl(commandArg); break;
				case CommandEnum.OP_REV: this.op_rev(commandArg); break;
				case CommandEnum.OP_FUNC: this.op_func(commandArg); break;
				case CommandEnum.OP_LOOP: this.op_loop(commandArg); break;
				case CommandEnum.OP_BREK: this.op_brek(commandArg); break;
				case CommandEnum.OP_CALL: this.op_call(commandArg); break;
				case CommandEnum.OP_SET: this.op_set(commandArg); break;
				case CommandEnum.OP_GET: this.op_get(commandArg); break;
				case CommandEnum.OP_IF: this.op_if(commandArg); break;
				case CommandEnum.OP_STR: this.op_str(commandArg); break;
				case CommandEnum.OP_LEN: this.op_len(commandArg); break;
				// Binary operations
				case CommandEnum.OP_ADD: this.op_add(commandArg); break;
				case CommandEnum.OP_SUB: this.op_sub(commandArg); break;
				case CommandEnum.OP_MLT: this.op_mlt(commandArg); break;
				case CommandEnum.OP_DIV: this.op_div(commandArg); break;
				case CommandEnum.OP_MOD: this.op_mod(commandArg); break;
				// Binary comparison operations
				case CommandEnum.BOP_GT: this.bop_gt(commandArg); break;
				case CommandEnum.BOP_LT: this.bop_lt(commandArg); break;
				case CommandEnum.BOP_GTE: this.bop_gte(commandArg); break;
				case CommandEnum.BOP_LTE: this.bop_lte(commandArg); break;
				case CommandEnum.BOP_EQ: this.bop_eq(commandArg); break;
				case CommandEnum.BOP_NEQ: this.bop_neq(commandArg); break;
				case CommandEnum.BOP_NOT: this.bop_not(commandArg); break;
				case CommandEnum.BOP_AND: this.bop_and(commandArg); break;
				case CommandEnum.BOP_OR: this.bop_or(commandArg); break;

				case CommandEnum.IDFR: this.idfr(commandArg); break;

				default: throw new Error(`Not implemented`);
			}
			const usedMem = process.memoryUsage().heapUsed;
			this.program.performance.peakMem = Math.max(
				this.program.performance.peakMem,
				usedMem
			);
		}
	}
}

export default class TicoProgram {
	public stack: any[];
	public currentCommand: Command;
	public functions: { [key: string]: ProgramScope };
	public variables: { [key: string]: any };

	public performance: Performance;

	private mainScope: ProgramScope;
	private commands: Command[];
	private stdout: StdOut;
	private stderr: StdErr;

	public constructor(
		commands: Command[],
		stdout: StdOut = null,
		stderr: StdErr = null
	) {
		this.commands = commands;
		this.stack = [];
		this.stdout = stdout;
		this.stderr = stderr;
	}

	public getFunction(name: string): ProgramScope {
		return this.functions[name];
	}

	public getVariable(name: string): any {
		return this.variables[name];
	}

	public setVariable(name: string, value: any): boolean {
		if (this.variables[name] !== undefined) {
			this.variables[name] = value;
			return true;
		}

		return false;
	}

	public std_out(msg: any): void {
		if (this.stdout) this.stdout(msg);
		else console.log(msg);
	}

	public std_err(msg: any): void {
		if (this.stderr) this.stderr(msg);
		else console.error(msg);
	}

	public run(variables: { [key: string]: any } = {}): void {
		this.stack = [];
		this.mainScope = new ProgramScope(
			this.stack, this, null, this.commands
		);
		this.variables = variables;
		this.functions = {};
		this.performance = { peakMem: 0 };
		this.currentCommand = null;
		try {
			this.mainScope.run();

			if (this.stack.length > 0) {
				throw new Error(`Unhandled data on end of program.`);
			}

			this.std_out("\n");
			this.std_out(`Peak RAM: ${Math.round(this.performance.peakMem / 1024 / 1024 * 100) / 100} MBs`);
			this.std_out("\n");
		} catch (e) {
			this.std_err(`Runtime error at line ${this.currentCommand[2] + 1} column ${this.currentCommand[3] + 1}: ${e}`);
		}
	}

	public static fromSourceCode(
		source: string,
		stdout: StdOut = (...args: any[]) => { },
		stderr: StdErr = (...args: any[]) => { }
	): TicoProgram {
		const parser = new Parser();
		return new TicoProgram(parser.parse(source), stdout, stderr);
	}
}