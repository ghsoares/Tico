import TicoParser from "../language/ticoParser";
import { TokenEnum } from "../language/ticoTokenizer";
import { Token } from "../language/tokenizer";
import { foregroundReset, foreground, unescapeString, background, backgroundReset, lineColumnFromString, throwErrorAtPos } from "../utils";

/**
 * Node type enum, contains all the node types used by Tico
 */
export enum NodeType {
	Branch,
	BinaryExpression,
	NegateExpression,
	IfExpression,
	ElseExpression,
	WhileLoopExpression,
	ForLoopExpression,
	Literal,
	Identifier,
	Set,
	FunctionArg,
	FunctionExpression,
	ReturnStatement,
	BreakStatement,
	FunctionCall,

	Max,
}

/**
 * Basic node type, contains the type, start and end pos, line and column
 */
export type Node = {
	type: NodeType;
	start: number;
	end: number;
};

/**
 * Branch node type, one of the main nodes that divides the program into scopes
 */
export type BranchNode = {
	parent: BranchNode;
	children: Node[];
	variables?: { [key: string]: any };
	functions?: { [key: string]: FunctionExpressionNode };
	stopped?: boolean;
} & Node;

/**
 * Binary expression node type, allowing recursive expression calculation
 */
export type BinaryExpressionNode = {
	left: Node;
	operator: Token;
	right: Node;
} & Node;

/**
 * Negate expression node type, negates the value from the expression
 */
export type NegateExpressionNode = {
	expr: Node;
} & Node;

/**
 * If expression node type, evaluates the condition and
 * run the branch or next branch if any
 */
export type IfExpressionNode = {
	condition: Node;
	next?: Node;
} & BranchNode;

/**
 * Else expression node type, this branch is run if the previous
 * if/elif node condition were false
 */
export type ElseExpressionNode = {} & BranchNode;

/**
 * While loop expression node type, keeps running this branch while
 * the condition is true
 */
export type WhileLoopExpressionNode = {
	condition: Node;
} & BranchNode;

/**
 * For loop expression node type, run the init node expression,
 * keeps running while the condition is true and run the iterate node expression
 */
export type ForLoopExpressionNode = {
	init: Node;
	condition: Node;
	iterate: Node;
} & BranchNode;

/**
 * Literal node type, stores the raw and the value of the literal
 */
export type LiteralNode = {
	value: any;
	raw: Token;
} & Node;

/**
 * Identifier node type, stores the id literal of a variable,
 * searches for the id in the current scope or any of it's parent scopes.
 */
export type IdentifierNode = {
	id: Token;
} & Node;

/**
 * Set node type, sets the identifier to the value expression
 */
export type SetNode = {
	id: IdentifierNode;
	value: Node;
} & Node;

/**
 * Function arg node, contains an individual argument of a function,
 * can contain a static or non-static default value expression
 */
export type FunctionArgNode = {
	id: IdentifierNode;
	defaultValueExpression: Node;
	defaultValueEvaluated?: any;
	staticDefaultValue: boolean;
} & Node;

/**
 * Function expression node, the main node to declare a function on runtime,
 * contains the id and the arguments
 */
export type FunctionExpressionNode = {
	id: IdentifierNode;
	args: FunctionArgNode[];
} & BranchNode;

/**
 * Return statement node, returns the expression from a function or exits the main
 * program early.
 */
export type ReturnStatementNode = {
	expression: Node;
} & Node;

/**
 * Break statement node, breaks a running loop
 */
export type BreakStatementNode = {} & Node;

/**
 * Function call node, calls a function identified by id and provides the argument expressions
 */
export type FunctionCallNode = {
	id: IdentifierNode;
	args: Node[];
} & Node;

export type SetterGetterValue = {
	set(val: any): void;
	get(): any;
};

export type FunctionValue = {
	create(branch: BranchNode): Promise<void>;
	call(args: Node[]): Promise<any>;
};

export type TicoVariables = { [key: string]: any };
export type TicoFunctions = { [key: string]: (...args: any[]) => any };

function wait(ms: number = 0): Promise<void> {
	return new Promise<void>(resolve => {
		setTimeout(resolve, ms);
	});
}

export default class TicoProgram {
	private sourceCode: string;
	private mainBranch: BranchNode;
	private variables: TicoVariables;
	private functions: TicoFunctions;
	private execBatchStart: number;
	private execBatchMS: number;
	private waitMS: number;
	private stdoutBuffer: string;
	private stderrBuffer: string;
	private onStdout: (msg: any) => any;
	private onStderr: (msg: any) => any;
	private running: boolean;
	private paused: boolean;

	public constructor(sourceCode: string) {
		this.sourceCode = sourceCode;
		this.mainBranch = new TicoParser().parse(sourceCode);
		this.execBatchMS = 15;
		this.waitMS = 0;
		this.running = false;
	}

	private throwError(msg: string, node: Node): void {
		throwErrorAtPos(this.sourceCode, node.start, msg);
	}

	private async evaluateExpression(branch: BranchNode, node: Node): Promise<any> {
		if (!this.running) throw 'TICO_PROGRAM_STOP'; 
		if (this.paused) {
			while (this.paused) {
				await wait(this.waitMS);
			}
		}

		if (Date.now() - this.execBatchStart > this.execBatchMS) {
			this.flushStdBuffers();
			await wait(this.waitMS);
			this.execBatchStart = Date.now();
		}

		try {
			switch (node.type) {
				case NodeType.Literal: {
					return (node as LiteralNode).value;
				}
				case NodeType.BinaryExpression: {
					return await this.evaluateBinaryExpression(branch, node as BinaryExpressionNode);
				}
				case NodeType.NegateExpression: {
					return await this.evaluateNegateExpression(branch, node as NegateExpressionNode);
				}
				case NodeType.IfExpression: {
					return await this.evaluateIfExpression(branch, node as IfExpressionNode);
				}
				case NodeType.WhileLoopExpression: {
					return await this.evaluateWhileLoopExpression(branch, node as WhileLoopExpressionNode);
				}
				case NodeType.ForLoopExpression: {
					return await this.evaluateForLoopExpression(branch, node as ForLoopExpressionNode);
				}
				case NodeType.Set: {
					return await this.evaluateSet(branch, node as SetNode);
				}
				case NodeType.Identifier: {
					return (await this.evaluateIdentifier(branch, node as IdentifierNode)).get();
				}
				case NodeType.FunctionExpression: {
					return await this.evaluateFunctionCreate(branch, node as FunctionExpressionNode);
				}
				case NodeType.ReturnStatement: {
					return await this.evaluateReturnStatement(branch, node as ReturnStatementNode);
				}
				case NodeType.BreakStatement: {
					return await this.evaluateBreakStatement(branch, node as BreakStatementNode);
				}
				case NodeType.FunctionCall: {
					return await this.evaluateFunctionCall(branch, node as FunctionCallNode);
				}
				default: this.throwError(`Not implemented`, node);
			}
		} catch (e) {
			this.flushStdBuffers();
			if (this.onStderr) {
				return this.onStderr(e);
			}
			throw e;
		}
	}

	private async evaluateBinaryExpression(branch: BranchNode, node: BinaryExpressionNode): Promise<any> {
		const { left, operator, right } = node;

		let leftValue: any = await this.evaluateExpression(branch, left);
		let rightValue: any = await this.evaluateExpression(branch, right);

		const overload = (type: string) => {
			let o = null;
			if (leftValue !== null && leftValue !== undefined) {
				if (leftValue.constructor)
					o = o || leftValue.constructor[type];
			}
			if (rightValue !== null && rightValue !== undefined) {
				if (rightValue.constructor)
					o = o || rightValue.constructor[type];
			}
			return o;
		}

		switch (operator.type) {
			// Arithmetic
			case TokenEnum.BinaryOpPlus: {
				const addOverload = overload('add');
				if (addOverload)
					return addOverload(leftValue, rightValue);

				return leftValue + rightValue;
			}
			case TokenEnum.BinaryOpMinus: {
				const subOverload = overload('sub');
				if (subOverload)
					return subOverload(leftValue, rightValue);

				return leftValue - rightValue;
			}
			case TokenEnum.BinaryOpStar: {
				const multOverload = overload('mult');
				if (multOverload)
					return multOverload(leftValue, rightValue);

				return leftValue * rightValue;
			}
			case TokenEnum.BinaryOpStarStar: {
				const powOverload = overload('pow');
				if (powOverload)
					return powOverload(leftValue, rightValue);

				return leftValue ** rightValue;
			}
			case TokenEnum.BinaryOpSlash: {
				const divOverload = overload('div');
				if (divOverload)
					return divOverload(leftValue, rightValue);

				return leftValue / rightValue;
			}
			case TokenEnum.BinaryOpSlashSlash: {
				const fdivOverload = overload('fdiv');
				if (fdivOverload)
					return fdivOverload(leftValue, rightValue);

				return Math.floor(leftValue / rightValue);
			}
			case TokenEnum.BinaryOpModulus: {
				const modOverload = overload('mod');
				if (modOverload)
					return modOverload(leftValue, rightValue);

				return leftValue % rightValue;
			}
			case TokenEnum.BinaryOpModulusModulus: {
				const modOverload = overload('mod');
				const addOverload = overload('add');
				if (modOverload) {
					return modOverload(
						addOverload(
							modOverload(leftValue, rightValue), rightValue
						), rightValue
					);
				}

				return ((leftValue % rightValue) + rightValue) % rightValue;
			}

			// Conditional
			case TokenEnum.ConditionalOpGreater: {
				const greaterOverload = overload('greater');
				if (greaterOverload)
					return greaterOverload(leftValue, rightValue);

				return leftValue > rightValue;
			}
			case TokenEnum.ConditionalOpLess: {
				const lesserOverload = overload('lesser');
				if (lesserOverload)
					return lesserOverload(leftValue, rightValue);

				return leftValue < rightValue;
			}
			case TokenEnum.ConditionalOpGreaterEqual: {
				const greaterOverload = overload('greater');
				const equalsOverload = overload('equals');
				if (greaterOverload && equalsOverload)
					return greaterOverload(leftValue, rightValue) || equalsOverload(leftValue, rightValue);

				return leftValue >= rightValue;
			}
			case TokenEnum.ConditionalOpLessEqual: {
				const lesserOverload = overload('lesser');
				const equalsOverload = overload('equals');
				if (lesserOverload && equalsOverload)
					return lesserOverload(leftValue, rightValue) || equalsOverload(leftValue, rightValue);

				return leftValue <= rightValue;
			}
			case TokenEnum.ConditionalOpEqual: {
				const equalsOverload = overload('equals');
				if (equalsOverload)
					return equalsOverload(leftValue, rightValue);

				return leftValue === rightValue;
			}
			case TokenEnum.ConditionalOpNotEqual: {
				const equalsOverload = overload('equals');
				if (equalsOverload)
					return !equalsOverload(leftValue, rightValue);

				return leftValue !== rightValue;
			}
			case TokenEnum.ConditionalAnd: {
				const andOverload = overload('and');
				if (andOverload)
					return !andOverload(leftValue, rightValue);

				return leftValue && rightValue;
			}
			case TokenEnum.ConditionalOr: {
				const orOverload = overload('or');
				if (orOverload)
					return !orOverload(leftValue, rightValue);

				return leftValue || rightValue;
			}

			default: this.throwError(`Not implemented`, node);
		}
	}

	private async evaluateNegateExpression(branch: BranchNode, node: NegateExpressionNode): Promise<any> {
		return !(await this.evaluateExpression(branch, node.expr));
	}

	private async evaluateIfExpression(branch: BranchNode, node: IfExpressionNode): Promise<any> {
		const isTrue = await this.evaluateExpression(branch, node.condition);

		if (isTrue) {
			node.parent = branch;
			node.functions = {};
			node.variables = {};
			return await this.runBranch(node);
		} else if (node.next) {
			if (node.next.type === NodeType.ElseExpression) {
				const elseNode = node.next as ElseExpressionNode;
				elseNode.parent = branch;
				elseNode.functions = {};
				elseNode.variables = {};
				return await this.runBranch(elseNode);
			} else if (node.next.type === NodeType.IfExpression) {
				return await this.evaluateExpression(branch, node.next as IfExpressionNode)
			}
		}
	}

	private async evaluateWhileLoopExpression(branch: BranchNode, node: WhileLoopExpressionNode): Promise<any> {
		let currVal = undefined;

		let isTrue = await this.evaluateExpression(branch, node.condition);
		while (isTrue) {
			node.parent = branch;
			node.variables = {};
			node.functions = {};
			currVal = await this.runBranch(node);

			isTrue = await this.evaluateExpression(branch, node.condition);
			if (node.stopped) break;
		}

		return currVal;
	}

	private async evaluateForLoopExpression(branch: BranchNode, node: ForLoopExpressionNode): Promise<any> {
		let currVal = undefined;

		await this.evaluateExpression(branch, node.init);

		let isTrue = await this.evaluateExpression(branch, node.condition);
		while (isTrue) {
			node.parent = branch;
			node.variables = {};
			node.functions = {};
			currVal = await this.runBranch(node);

			await this.evaluateExpression(branch, node.iterate);
			isTrue = await this.evaluateExpression(branch, node.condition);
			if (node.stopped) break;
		}

		return currVal;
	}

	private async evaluateSet(branch: BranchNode, node: SetNode): Promise<any> {
		const val = await this.evaluateExpression(branch, node.value);
		const setget = await this.evaluateIdentifier(branch, node.id);

		setget.set(val);

		return val;
	}

	private async evaluateIdentifier(branch: BranchNode, node: Node): Promise<SetterGetterValue> {
		let found = false;
		let obj = branch.variables;
		let key = '';

		if (node.type === NodeType.Identifier) {
			key = (node as IdentifierNode).id.match[0];
			let b = branch;

			while (true) {
				obj = b.variables;
				if (obj[key] !== undefined) {
					found = true;
					break;
				}

				if (!b.parent) {
					obj = this.variables;
					if (obj[key] !== undefined) found = true;
					break;
				}

				b = b.parent;
			}

			if (!found)
				obj = branch.variables;
		}


		return {
			get(): any {
				if (!found) return undefined;
				return obj[key];
			},
			set(v: any) {
				obj[key] = v;
			}
		};
	}

	private async evaluateFunctionCreate(branch: BranchNode, node: FunctionExpressionNode): Promise<any> {
		const f = await this.evaluateFunction(branch, node.id);
		await f.create(node as BranchNode);
	}

	private async evaluateReturnStatement(branch: BranchNode, node: ReturnStatementNode): Promise<any> {
		let b = branch;
		while (true) {
			b.stopped = true;
			if (b.type === NodeType.FunctionExpression) break;
			if (b.parent) b = b.parent;
			else break;
		}

		if (node.expression === null) return null;
		return await this.evaluateExpression(branch, node.expression);
	}

	private async evaluateBreakStatement(branch: BranchNode, node: BreakStatementNode): Promise<any> {
		let b = branch;
		while (true) {
			b.stopped = true;
			if (b.type === NodeType.WhileLoopExpression) break;
			if (b.parent) b = b.parent;
			else break;
		}

		return undefined;
	}

	private async evaluateFunctionCall(branch: BranchNode, node: FunctionCallNode): Promise<any> {
		const f = await this.evaluateFunction(branch, node.id);
		const mappedArgs = [];
		for (const arg of node.args) {
			mappedArgs.push(await this.evaluateExpression(branch, arg));
		}
		return await f.call(await Promise.all(mappedArgs));
	}

	private async evaluateFunction(branch: BranchNode, node: Node): Promise<FunctionValue> {
		let found = false;
		let obj: { [key: string]: FunctionExpressionNode | ((...args: any[]) => any) } = branch.functions;
		let key = '';

		if (node.type === NodeType.Identifier) {
			key = (node as IdentifierNode).id.match[0];
			let b = branch;

			while (true) {
				obj = b.functions;
				if (obj[key] !== undefined) {
					found = true;
					break;
				}

				if (!b.parent) {
					obj = this.functions;
					if (obj[key] !== undefined) found = true;
					break;
				}

				b = b.parent;
			}

			if (!found) {
				obj = branch.functions;
			}
		}

		const self = this;

		return {
			async create(func: FunctionExpressionNode): Promise<void> {
				if (found) self.throwError(`Identifier "${key}" already exists`, node);

				for (const arg of func.args) {
					if (arg.staticDefaultValue) {
						arg.defaultValueEvaluated = await self.evaluateExpression(branch, arg.defaultValueExpression);
					} else {
						arg.defaultValueEvaluated = null;
					}
				}

				func.parent = branch;
				obj[key] = func;
			},
			async call(args: any[]): Promise<any> {
				if (!found) self.throwError(`Couldn't find identifer "${key}"`, node);
				const f = obj[key];
				if (typeof f === 'function') {
					return f.apply(null, args);
				} else {
					f.variables = {};
					f.functions = {};
					f.stopped = false;

					const fArgs = f.args;

					for (let i = 0; i < fArgs.length; i++) {
						const arg = fArgs[i];
						const id = arg.id.id.match[0];
						if (i >= args.length) {
							if (arg.staticDefaultValue) {
								f.variables[id] = arg.defaultValueEvaluated;
							} else {
								f.variables[id] = await self.evaluateExpression(branch, arg.defaultValueExpression);
							}
						} else {
							f.variables[id] = args[i];
						}
					}

					return await self.runBranch(f);
				}
			}
		};
	}

	private async runBranch(branch: BranchNode): Promise<any> {
		let retValue = undefined;

		for (const node of branch.children) {
			const v = await this.evaluateExpression(branch, node);
			if (v !== undefined) retValue = v;
			if (branch.stopped) break;
		}

		return retValue;
	}

	private flushStdBuffers(): void {
		if (this.onStdout && this.stdoutBuffer !== "") {
			this.onStdout(this.stdoutBuffer);
			this.stdoutBuffer = "";
		}
		if (this.onStderr && this.stderrBuffer !== "") {
			this.onStderr(this.stderrBuffer);
			this.stderrBuffer = "";
		}
	}

	public setExecBatchDuration(ms: number) {
		this.execBatchMS = ms;
	}

	public setWaitDuration(ms: number) {
		this.waitMS = ms;
	}

	public setStdout(callback: (what: any) => any) {
		this.onStdout = callback;
	}

	public setStderr(callback: (what: any) => any) {
		this.onStderr = callback;
	}
	
	public async run(
		variables: TicoVariables = {},
		functions: TicoFunctions = {}
	): Promise<any> {
		if (this.running) throw new Error(`Program is already running`);

		this.variables = {
			...variables
		};
		this.functions = {
			'write': (what: any) => {
				const str = unescapeString("" + what);
				if (this.onStdout) {
					this.stdoutBuffer += str;
					return true;
				}
				return process.stdout.write(str);
			},
			'writeLine': (what: any) => {
				const str = unescapeString("" + what) + "\n";
				if (this.onStdout) {
					this.stdoutBuffer += str;
					return true;
				}
				return process.stdout.write(str);
			},
			'fg': (r: number, g: number, b: number) => {
				return process.stdout.write(foreground([r, g, b]));
			},
			'fgReset': () => {
				return process.stdout.write(foregroundReset());
			},
			'bg': (r: number, g: number, b: number) => {
				return process.stdout.write(background([r, g, b]));
			},
			'bgReset': () => {
				return process.stdout.write(backgroundReset());
			},
			'color': (
				r1: number, g1: number, b1: number,
				r2: number, g2: number, b2: number
			) => {
				return process.stdout.write(foreground([r1, g1, b1]) + background([r2, g2, b2]));
			},
			'colorReset': () => {
				return process.stdout.write(foregroundReset() + backgroundReset());
			},
			...functions,
		};
		this.mainBranch.variables = {};
		this.mainBranch.functions = {};
		this.mainBranch.stopped = false;
		this.execBatchStart = Date.now();
		this.stdoutBuffer = '';
		this.stderrBuffer = '';
		this.running = true;
		this.paused = false;

		try {
			const val = await this.runBranch(this.mainBranch);
			this.flushStdBuffers();
			return val;
		} catch (e) {
			this.flushStdBuffers();
			if (e === 'TICO_PROGRAM_STOP') {
				return null;
			}
			throw e;
		}
	}

	public stop(): void {
		this.running = false;
	}

	public pause(): void {
		this.paused = true;
	}

	public resume(): void {
		this.paused = false;
	}
}