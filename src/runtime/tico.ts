import TicoParser from "../language/ticoParser";
import { TokenEnum } from "../language/ticoTokenizer";
import { Token } from "../language/tokenizer";

export enum NodeType {
	Branch,
	BinaryExpression,
	Literal,
	Identifier,
	Set,
	FunctionCreate,
	FunctionCall,

	Max,
}

export type Node = {
	type: NodeType;
	start: number;
	end: Number;
};

export type BranchNode = {
	parent: BranchNode;
	children: Node[];
	variables?: { [key: string]: any };
	functions?: { [key: string]: BranchNode };
} & Node;

export type BinaryExpressionNode = {
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

export type FunctionCreateNode = {
	id: IdentifierNode;
} & BranchNode;

export type FunctionCallNode = {
	id: IdentifierNode;
} & Node;

type SetterGetterValue = {
	set(val: any): void;
	get(): any;
};

type FunctionValue = {
	create(branch: BranchNode): void;
	call(): any;
};

class TicoRuntimeError extends Error {
	public constructor(node: Node, msg: string) {
		super(`At ${node.start}: ${msg}`);
	}
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
			case NodeType.Literal: {
				return (node as LiteralNode).value;
			}
			case NodeType.Set: {
				return this.evaluateSet(branch, node as SetNode);
			}
			case NodeType.Identifier: {
				return this.evaluateIdentifier(branch, node as IdentifierNode).get();
			}
			case NodeType.FunctionCreate: {
				return this.evaluateFunctionCreate(branch, node as FunctionCreateNode);
			}
			case NodeType.FunctionCall: {
				return this.evaluateFunctionCall(branch, node as FunctionCallNode);
			}
			default: throw new TicoRuntimeError(node, `Not implemented`);
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
			default: throw new TicoRuntimeError(operator, `Not implemented`);
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
				if (!found) throw new TicoRuntimeError(node, `Couldn't find identifier "${key}"`);
				return obj[key];
			},
			set(v: any) {
				obj[key] = v;
			}
		};
	}

	private evaluateFunctionCreate(branch: BranchNode, node: FunctionCreateNode): any {
		this.evaluateFunction(branch, node.id).create(node as BranchNode);
	}

	private evaluateFunctionCall(branch: BranchNode, node: FunctionCallNode): any {
		const f = this.evaluateFunction(branch, node.id);
		return f.call();
	}

	private evaluateFunction(branch: BranchNode, node: Node): FunctionValue {
		let found = false;
		let obj: {[key: string]: BranchNode|(() => any)} = branch.functions;
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
			create(func: BranchNode): void {
				if (found) throw new TicoRuntimeError(node, `Identifier "${key}" already exists`);
				func.parent = branch;
				obj[key] = func;
			},
			call(): any {
				if (!found) throw new TicoRuntimeError(node, `Couldn't find identifer "${key}"`);
				const f = obj[key];
				if (typeof f === 'function') {
					return f();
				} else {
					f.variables = {};
					f.functions = {};
					return self.runBranch(f);
				}
			}
		};
	}

	private runBranch(branch: BranchNode): any {
		let retValue = undefined;

		for (const node of branch.children) {
			retValue = this.evaluateExpression(branch, node);
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

		return this.runBranch(this.mainBranch);
	}

	public static fromSourceCode(source: string): TicoProgram {
		const parser = new TicoParser();
		return new TicoProgram(parser.parse(source));
	}
}