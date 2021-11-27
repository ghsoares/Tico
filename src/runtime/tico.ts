import TicoParser from "../language/ticoParser";
import { TokenEnum } from "../language/ticoTokenizer";
import { throwAtPos, Token } from "../language/tokenizer";

export enum NodeType {
	Branch,
	BinaryExpression,
	ConditionalExpression,
	Literal,
	Identifier,
	Set,
	FunctionArg,
	FunctionExpression,
	ReturnExpression,
	FunctionCall,

	Max,
}

export type Node = {
	type: NodeType;
	start: number;
	end: number;
	line: number;
	column: number;
};

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

export type ConditionalExpressionNode = {
	left: Node;
	operator: Token;
	right: Node;
} & Node;

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
	defaultValue: Node;
	defaultValueEvaluated?: any;
} & Node;

export type FunctionExpressionNode = {
	id: IdentifierNode;
	args: FunctionArgNode[];
} & BranchNode;

export type ReturnExpressionNode = {
	expression: Node;
} & Node;

export type FunctionCallNode = {
	id: IdentifierNode;
	args: Node[];
} & Node;

type SetterGetterValue = {
	set(val: any): void;
	get(): any;
};

type FunctionValue = {
	create(branch: BranchNode): void;
	call(args: Node[]): any;
};

export default class TicoProgram {
	private mainBranch: BranchNode;
	private variables: { [key: string]: any };
	private functions: { [key: string]: () => any };

	public constructor(main: BranchNode) {
		this.mainBranch = main;
	}

	private evaluateExpression(branch: BranchNode, node: Node): any {
		switch (node.type) {
			case NodeType.BinaryExpression: {
				return this.evaluateBinaryExpression(branch, node as BinaryExpressionNode);
			}
			case NodeType.ConditionalExpression: {
				return this.evaluateConditionalExpression(branch, node as ConditionalExpressionNode);
			}
			case NodeType.Literal: {
				return (node as LiteralNode).value;
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
			case NodeType.ReturnExpression: {
				return this.evaluateReturnExpression(branch, node as ReturnExpressionNode);
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

		switch (operator.type) {
			case TokenEnum.BinaryOpPlus: {
				if (leftValue['add'])
					return leftValue.add(rightValue);
				return leftValue + rightValue;
			}
			case TokenEnum.BinaryOpMinus: {
				if (leftValue['sub'])
					return leftValue.sub(rightValue);
				return leftValue - rightValue;
			}
			case TokenEnum.BinaryOpStar: {
				if (leftValue['mlt'])
					return leftValue.mlt(rightValue);
				return leftValue * rightValue;
			}
			case TokenEnum.BinaryOpStarStar: {
				if (leftValue['pow'])
					return leftValue.pow(rightValue);
				return Math.pow(leftValue, rightValue);
			}
			case TokenEnum.BinaryOpSlash: {
				if (leftValue['div'])
					return leftValue.div(rightValue);
				return leftValue / rightValue;
			}
			case TokenEnum.BinaryOpSlashSlash: {
				if (leftValue['div'])
					return Math.floor(leftValue.div(rightValue));
				return Math.floor(leftValue / rightValue);
			}
			case TokenEnum.BinaryOpModulus: {
				if (leftValue['mod'])
					return leftValue.mod(rightValue);
				return leftValue % rightValue;
			}
			case TokenEnum.BinaryOpModulusModulus: {
				if (leftValue['mod'] && leftValue['add'])
					return leftValue.mod(rightValue).add(rightValue).mod(rightValue);
				return ((leftValue % rightValue) + rightValue) % rightValue;
			}
			default: throw throwAtPos(operator.line, operator.column, `Not implemented`);
		}
	}

	private evaluateConditionalExpression(branch: BranchNode, node: ConditionalExpressionNode): boolean {
		const { left, operator, right } = node;

		let leftValue: any = this.evaluateExpression(branch, left);
		let rightValue: any = this.evaluateExpression(branch, right);

		switch (operator.type) {
			case TokenEnum.ConditionalOpGreater: {
				if (leftValue['greater'])
					return leftValue.greater(rightValue);
				return leftValue > rightValue;
			}
			case TokenEnum.ConditionalOpLess: {
				if (leftValue['less'])
					return leftValue.less(rightValue);
				return leftValue < rightValue;
			}
			case TokenEnum.ConditionalOpGreaterEqual: {
				if (leftValue['greater'] && leftValue['equal'])
					return leftValue.greater(rightValue) || leftValue.equal(rightValue);
				return leftValue >= rightValue;
			}
			case TokenEnum.ConditionalOpLessEqual: {
				if (leftValue['less'] && leftValue['equal'])
					return leftValue.less(rightValue) || leftValue.equal(rightValue);
				return leftValue <= rightValue;
			}
			case TokenEnum.ConditionalOpEqual: {
				if (leftValue['equal'])
					return leftValue.equal(rightValue);
				return leftValue === rightValue;
			}
			case TokenEnum.ConditionalOpNotEqual: {
				if (leftValue['equal'])
					return !leftValue.equal(rightValue);
				return leftValue !== rightValue;
			}
			default: throw throwAtPos(operator.line, operator.column, `Not implemented`);
		}
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
				if (!found) throw throwAtPos(node.line, node.column, `Couldn't find identifier "${key}"`);
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

	private evaluateReturnExpression(branch: BranchNode, node: ReturnExpressionNode): any {
		branch.stopped = true;
		if (node.expression === null) return null;
		return this.evaluateExpression(branch, node.expression);
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

				/*func.args.forEach(arg => {
					if (arg.defaultValue)
						arg.defaultValueEvaluated = self.evaluateExpression(branch, arg.defaultValue);
					else
						arg.defaultValueEvaluated = null;
				});*/

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
							// TODO: Switch between pre-evaluated default value or procedural default value
							f.variables[id] = self.evaluateExpression(branch, arg.defaultValue);
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
		this.variables = variables;
		this.functions = functions;
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