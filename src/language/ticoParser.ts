import {
	BinaryExpressionNode,
	BranchNode,
	LiteralNode,
	Node,
	NodeType,
	SetNode,
	IdentifierNode,
	FunctionCreateNode,
	FunctionCallNode
} from "../runtime/tico";
import TicoTokenizer, { TokenEnum } from "./ticoTokenizer";

type StringifyOptions = {
	indent?: string;
	showPosition?: boolean;
};

export default class TicoParser {
	private tokenizer: TicoTokenizer;

	private literal(): Node {
		const literal = this.tokenizer.tk(TokenEnum.LiteralNumber) ||
			this.tokenizer.tk(TokenEnum.LiteralString);
		if (literal) {
			switch (literal.type) {
				case TokenEnum.LiteralNumber: {
					return {
						type: NodeType.Literal,
						value: Number(literal.match[0]),
						raw: literal,
						start: literal.start,
						end: literal.end
					} as LiteralNode;
				}
				case TokenEnum.LiteralString: {
					return {
						type: NodeType.Literal,
						value: String(literal.match[1]),
						raw: literal,
						start: literal.start,
						end: literal.end
					} as LiteralNode;
				}
			}
		}
		return null;
	}

	private identifier(): Node {
		const v = this.tokenizer.tk(TokenEnum.ExtraIdentifier);
		if (v) {
			return {
				type: NodeType.Identifier,
				id: v,
				start: v.start,
				end: v.end
			} as IdentifierNode;
		}
		return null;
	}

	private functionCall(): Node {
		const tkPos = this.tokenizer.tkCursor();
		
		const id = this.identifier() as IdentifierNode;
		if (!id)
			return this.tokenizer.tkRet(tkPos);
		
		if (!this.tokenizer.tk(TokenEnum.SymbolParOpen))
			return this.tokenizer.tkRet(tkPos);
		
		const close = this.tokenizer.tk(TokenEnum.SymbolParClose);
		if (!close)
			throw new Error(`Expected ")"`);
		
		return {
			type: NodeType.FunctionCall,
			id,
			start: id.start,
			end: close.end
		} as FunctionCallNode;
	}

	private wrappedExpression(): Node {
		const tkPos = this.tokenizer.tkCursor();

		const parOpen = this.tokenizer.tk(TokenEnum.SymbolParOpen);
		if (!parOpen)
			return this.tokenizer.tkRet(tkPos);
		
		const expr = this.expression();
		
		const parClose = this.tokenizer.tk(TokenEnum.SymbolParClose);
		if (!parOpen)
			throw new Error(`Expected ")"`);
		
		if (!expr)
			return null;

		expr.start = parOpen.start;
		expr.end = parClose.end;

		return expr;
	}

	private expressionMember(): Node {
		return this.literal() || this.wrappedExpression() || this.functionCall() || this.identifier();
	}

	private expression(): Node {
		return 	this.variableSet() 			||
				this.functionExpression() 	||
				this.binaryExpression();
	}

	private binaryExpressionRecursive(left: Node): Node {
		const operators = [
			TokenEnum.BinaryOpStarStar,
			TokenEnum.BinaryOpStar,
			TokenEnum.BinaryOpSlash,
			TokenEnum.BinaryOpSlashSlash,
			TokenEnum.BinaryOpModulus,
			TokenEnum.BinaryOpModulusModulus,
			TokenEnum.BinaryOpPlus,
			TokenEnum.BinaryOpMinus
		];

		if (operators.length !== (TokenEnum.BinaryOpMax - TokenEnum.BinaryOpMin) - 1)
			throw new Error(`New binary operators added, update this function`)

		const operator = (l: Node, id: number): Node => {
			const op = this.tokenizer.tk(operators[id]);
			if (!op) { return l; }

			const next = this.expressionMember();
			if (!next) throw new Error(`Expected expression member`);

			let right = next;
			if (id > 0) {
				for (let i = id - 1; i >= 0; i--) {
					right = operator(right, i);
				}
			}

			const node: BinaryExpressionNode = {
				type: NodeType.BinaryExpression,
				left: l,
				operator: op,
				right,
				start: l.start,
				end: right.end
			};

			return operator(node, id);
		}

		let expr = left;
		for (let i = 0; i < operators.length; i++) {
			expr = operator(expr, i);
		}

		return expr;
	}

	private binaryExpression(): Node {
		const tkPos = this.tokenizer.tkCursor();

		const head = this.expressionMember();
		if (!head) { return this.tokenizer.tkRet(tkPos); }

		const right = this.binaryExpressionRecursive(head);
		if (!right) { return this.tokenizer.tkRet(tkPos); }

		return right;
	}

	private variableSet(): Node {
		const tkPos = this.tokenizer.tkCursor();

		const id = this.identifier();
		if (!id)
			return this.tokenizer.tkRet(tkPos);

		if (!this.tokenizer.tk(TokenEnum.SymbolEquals))
			return this.tokenizer.tkRet(tkPos);

		const expr = this.expression();
		if (!expr) throw new Error(`Expected expression`);

		const node = {
			type: NodeType.Set,
			id: id,
			value: expr,
			start: id.start,
			end: expr.end
		} as SetNode;

		return node;
	}

	private functionExpression(): Node {
		const tkPos = this.tokenizer.tkCursor();

		const keyFunc = this.tokenizer.tk(TokenEnum.KeywordFunction);
		if (!keyFunc)
			return this.tokenizer.tkRet(tkPos);
		
		const id = this.identifier() as IdentifierNode;
		if (!id)
			throw new Error(`Expected identifier`);
		
		if (!this.tokenizer.tk(TokenEnum.SymbolParOpen))
			throw new Error(`Expected "("`);
		
		if (!this.tokenizer.tk(TokenEnum.SymbolParClose))
			throw new Error(`Expected ")"`);
		
		if (!this.tokenizer.tk(TokenEnum.SymbolCurlyBracketOpen))
			throw new Error(`Expected "{"`);
		
		const branch = this.branch() as FunctionCreateNode;
		branch.type = NodeType.FunctionCreate;
		branch.id = id;
		branch.start = keyFunc.start;

		return branch;
	}

	private branch(main: boolean = false): BranchNode {
		const branch: BranchNode = {
			type: NodeType.Branch,
			parent: null,
			children: [],
			start: 0,
			end: 0
		};

		let ended = false;

		while (true) {
			const node = 	this.variableSet() 			||
							this.functionExpression() 	||
							this.expression();
			if (node) {
				if (branch.children.length === 0)
					branch.start = node.start;

				branch.end = node.end;
				branch.children.push(node);
			} else {
				if (!main) {
					const closeBracket = this.tokenizer.tk(TokenEnum.SymbolCurlyBracketClose);
					if (closeBracket) {
						ended = true;
						branch.end = closeBracket.end;
						break;
					}
				} else {
					break;
				}
			}
		}

		if (!main && !ended) throw new Error(`Expected "}"`);

		return branch;
	}

	public parse(source: string): BranchNode {
		this.tokenizer = new TicoTokenizer();
		this.tokenizer.tokenize(source);

		const main = this.branch(true);

		if (this.tokenizer.tokensLeft() > 0) {
			throw new Error(`Unexpected token [${this.tokenizer.currTk().match[0]}]`);
		}

		return main;
	}

	public static stringify(node: Node, options: StringifyOptions = {}, lvl: number = 0): string {
		const { indent = " ", showPosition = true } = options;

		let str = "";

		if (node === null) {
			return str + "null";
		}

		const pos = indent.repeat(lvl + 1) + `Pos: [${node.start}, ${node.end}]\n`;

		switch (node.type) {
			case NodeType.Branch: {
				const branch = node as BranchNode;

				str += indent.repeat(lvl + 0) + "BranchNode:\n";
				if (showPosition) {
					str += pos;
				}
				for (const child of branch.children) {
					str += TicoParser.stringify(child, options, lvl + 1);
				}
			} break;
			case NodeType.BinaryExpression: {
				const bin = node as BinaryExpressionNode;

				str += indent.repeat(lvl + 0) + "BinaryExpressionNode:\n";
				if (showPosition) {
					str += pos;
				}
				str += indent.repeat(lvl + 1) + "left:\n";
				str += TicoParser.stringify(bin.left, options, lvl + 2);
				str += indent.repeat(lvl + 1) + `operator: ${bin.operator.match[0]}\n`;
				str += indent.repeat(lvl + 1) + "right:\n";
				str += TicoParser.stringify(bin.right, options, lvl + 2);
			} break;
			case NodeType.Literal: {
				const literal = node as LiteralNode;

				str += indent.repeat(lvl + 0) + "LiteralNode:\n";
				if (showPosition) {
					str += pos;
				}
				str += indent.repeat(lvl + 1) + `type: ${TokenEnum[literal.raw.type]}\n`;
				str += indent.repeat(lvl + 1) + `value: ${literal.value}\n`;
			} break;
			case NodeType.Set: {
				const varAssign = node as SetNode;

				str += indent.repeat(lvl + 0) + "SetNode:\n";
				if (showPosition) {
					str += pos;
				}
				str += indent.repeat(lvl + 1) + `id:\n`;
				str += TicoParser.stringify(varAssign.id, options, lvl + 2);
				str += indent.repeat(lvl + 1) + `value:\n`;
				str += TicoParser.stringify(varAssign.value, options, lvl + 2);
			} break;
			case NodeType.Identifier: {
				const v = node as IdentifierNode;

				str += indent.repeat(lvl + 0) + "IdentifierNode:\n";
				if (showPosition) {
					str += pos;
				}
				str += indent.repeat(lvl + 1) + `id: ${v.id.match[0]}\n`;
			} break;
			case NodeType.FunctionCreate: {
				const func = node as FunctionCreateNode;

				str += indent.repeat(lvl + 0) + "FunctionCreate:\n";
				if (showPosition) {
					str += pos;
				}
				str += indent.repeat(lvl + 1) + `id:\n`;
				str += TicoParser.stringify(func.id, options, lvl + 2);
				for (const child of func.children) {
					str += TicoParser.stringify(child, options, lvl + 1);
				}
			} break;
			case NodeType.FunctionCall: {
				const f = node as FunctionCallNode;

				str += indent.repeat(lvl + 0) + "FunctionCall:\n";
				if (showPosition) {
					str += pos;
				}
				str += indent.repeat(lvl + 1) + `id:\n`;
				str += TicoParser.stringify(f.id, options, lvl + 2);
			} break;
		}

		return str;
	}
}