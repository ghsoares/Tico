import TicoParser from "../language/ticoParser";
import { TokenEnum } from "../language/ticoTokenizer";
import { throwAtPos, Token } from "../language/tokenizer";
import { foregroundReset, foreground, unescapeString, background, backgroundReset } from "../utils";

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
	line: number;
	column: number;
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

export type BinaryExpressionNode = {
	left: Node;
	operator: Token;
	right: Node;
} & Node;

export type NegateExpressionNode = {
	expr: Node;
} & Node;

export type IfExpressionNode = {
	condition: Node;
	next?: Node;
} & BranchNode;

export type ElseExpressionNode = {} & BranchNode;

export type WhileLoopExpressionNode = {
	condition: Node;
} & BranchNode;

export type ForLoopExpressionNode = {
	init: Node;
	condition: Node;
	iterate: Node;
} & BranchNode;

export type LiteralNode = {
	value: any;
	raw: Token;
} & Node;

export type IdentifierNode = {
	id: Token;
} & Node;

export type SetNode = {
	id: IdentifierNode;
	value: Node;
} & Node;

export type FunctionArgNode = {
	id: IdentifierNode;
	defaultValueExpression: Node;
	defaultValueEvaluated?: any;
	staticDefaultValue: boolean;
} & Node;

export type FunctionExpressionNode = {
	id: IdentifierNode;
	args: FunctionArgNode[];
} & BranchNode;

export type ReturnStatementNode = {
	expression: Node;
} & Node;

export type BreakStatementNode = {} & Node;

export type FunctionCallNode = {
	id: IdentifierNode;
	args: Node[];
} & Node;

export type SetterGetterValue = {
	set(val: any): void;
	get(): any;
};

export type FunctionValue = {
	create(branch: BranchNode): void;
	call(args: Node[]): any;
};

export default class TicoProgram {
	private mainBranch: BranchNode;
	private variables: { [key: string]: any };
	private functions: { [key: string]: (...args: any[]) => any };

	public constructor(main: BranchNode) {
		this.mainBranch = main;
	}

	private evaluateExpression(branch: BranchNode, node: Node): any {
		switch (node.type) {
			case NodeType.Literal: {
				return (node as LiteralNode).value;
			}
			case NodeType.BinaryExpression: {
				return this.evaluateBinaryExpression(branch, node as BinaryExpressionNode);
			}
			case NodeType.NegateExpression: {
				return this.evaluateNegateExpression(branch, node as NegateExpressionNode);
			}
			case NodeType.IfExpression: {
				return this.evaluateIfExpression(branch, node as IfExpressionNode);
			}
			case NodeType.WhileLoopExpression: {
				return this.evaluateWhileLoopExpression(branch, node as WhileLoopExpressionNode);
			}
			case NodeType.Set: {
				return this.evaluateSet(branch, node as SetNode);
			}
			case NodeType.Identifier: {
				return this.evaluateIdentifier(branch, node as IdentifierNode).get();
			}
			case NodeType.FunctionExpression: {
				return this.evaluateFunctionCreate(branch, node as FunctionExpressionNode);
			}
			case NodeType.ReturnStatement: {
				return this.evaluateReturnStatement(branch, node as ReturnStatementNode);
			}
			case NodeType.BreakStatement: {
				return this.evaluateBreakStatement(branch, node as BreakStatementNode);
			}
			case NodeType.FunctionCall: {
				return this.evaluateFunctionCall(branch, node as FunctionCallNode);
			}
			default: throw throwAtPos(node.line, node.column, `Not implemented`);
		}
	}

	private evaluateBinaryExpression(branch: BranchNode, node: BinaryExpressionNode): any {
		const { left, operator, right } = node;

		let leftValue: any = this.evaluateExpression(branch, left);
		let rightValue: any = this.evaluateExpression(branch, right);

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

			default: throw throwAtPos(operator.line, operator.column, `Not implemented`);
		}
	}

	private evaluateNegateExpression(branch: BranchNode, node: NegateExpressionNode): any {
		return !this.evaluateExpression(branch, node.expr);
	}

	private evaluateIfExpression(branch: BranchNode, node: IfExpressionNode): any {
		const isTrue = this.evaluateExpression(branch, node.condition);

		if (isTrue) {
			node.parent = branch;
			node.functions = {};
			node.variables = {};
			return this.runBranch(node);
		} else if (node.next) {
			if (node.next.type === NodeType.ElseExpression) {
				const elseNode = node.next as ElseExpressionNode;
				elseNode.parent = branch;
				elseNode.functions = {};
				elseNode.variables = {};
				return this.runBranch(elseNode);
			} else if (node.next.type === NodeType.IfExpression) {
				return this.evaluateExpression(branch, node.next as IfExpressionNode)
			}
		}
	}

	private evaluateWhileLoopExpression(branch: BranchNode, node: WhileLoopExpressionNode): any {
		let currVal = undefined;

		let isTrue = this.evaluateExpression(branch, node.condition);
		while (isTrue) {
			node.parent = branch;
			node.variables = {};
			node.functions = {};
			currVal = this.runBranch(node);

			isTrue = this.evaluateExpression(branch, node.condition);
			if (node.stopped) break;
		}

		return currVal;
	}

	private evaluateSet(branch: BranchNode, node: SetNode): any {
		const val = this.evaluateExpression(branch, node.value);
		const setget = this.evaluateIdentifier(branch, node.id);

		setget.set(val);

		return val;
	}

	private evaluateIdentifier(branch: BranchNode, node: Node): SetterGetterValue {
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
				//if (!found) throw throwAtPos(node.line, node.column, `Couldn't find identifier "${key}"`);
				if (!found) return undefined;
				return obj[key];
			},
			set(v: any) {
				obj[key] = v;
			}
		};
	}

	private evaluateFunctionCreate(branch: BranchNode, node: FunctionExpressionNode): any {
		this.evaluateFunction(branch, node.id).create(node as BranchNode);
	}

	private evaluateReturnStatement(branch: BranchNode, node: ReturnStatementNode): any {
		let b = branch;
		while (true) {
			b.stopped = true;
			if (b.type === NodeType.FunctionExpression) break;
			if (b.parent) b = b.parent;
			else break;
		}

		if (node.expression === null) return null;
		return this.evaluateExpression(branch, node.expression);
	}

	private evaluateBreakStatement(branch: BranchNode, node: BreakStatementNode): any {
		let b = branch;
		while (true) {
			b.stopped = true;
			if (b.type === NodeType.WhileLoopExpression) break;
			if (b.parent) b = b.parent;
			else break;
		}

		return undefined;
	}

	private evaluateFunctionCall(branch: BranchNode, node: FunctionCallNode): any {
		const f = this.evaluateFunction(branch, node.id);
		return f.call(node.args.map(v => this.evaluateExpression(branch, v)));
	}

	private evaluateFunction(branch: BranchNode, node: Node): FunctionValue {
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
			create(func: FunctionExpressionNode): void {
				if (found) throw throwAtPos(node.line, node.column, `Identifier "${key}" already exists`);

				func.args.forEach(arg => {
					if (arg.staticDefaultValue) {
						arg.defaultValueEvaluated = self.evaluateExpression(branch, arg.defaultValueExpression);
					} else {
						arg.defaultValueEvaluated = null;
					}
				});

				func.parent = branch;
				obj[key] = func;
			},
			call(args: any[]): any {
				if (!found) throw throwAtPos(node.line, node.column, `Couldn't find identifer "${key}"`);
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
								f.variables[id] = self.evaluateExpression(branch, arg.defaultValueExpression);
							}
						} else {
							f.variables[id] = args[i];
						}
					}

					return self.runBranch(f);
				}
			}
		};
	}

	private runBranch(branch: BranchNode): any {
		let retValue = undefined;

		for (const node of branch.children) {
			const v = this.evaluateExpression(branch, node);
			if (v !== undefined) retValue = v;
			if (branch.stopped) break;
		}

		return retValue;
	}

	public run(
		variables: { [key: string]: any } = {},
		functions: { [key: string]: any } = () => { }
	): any {
		this.variables = {
			...variables
		};
		this.functions = {
			...functions,
			'write': (what: any) => {
				return process.stdout.write(unescapeString("" + what))
			},
			'writeLine': (what: any) => {
				return process.stdout.write(unescapeString("" + what) + "\n")
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
			}
		};
		this.mainBranch.variables = {};
		this.mainBranch.functions = {};
		this.mainBranch.stopped = false;

		return this.runBranch(this.mainBranch);
	}

	public static fromSourceCode(source: string): TicoProgram {
		const parser = new TicoParser();
		return new TicoProgram(parser.parse(source));
	}
}