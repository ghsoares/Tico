import {
	BinaryExpressionNode,
	BranchNode,
	LiteralNode,
	Node,
	NodeType,
	SetNode,
	IdentifierNode,
	FunctionExpressionNode,
	FunctionCallNode,
	FunctionArgNode,
	ReturnExpressionNode,
	NegateExpressionNode,
	IfExpressionNode,
	ElseExpressionNode,
	WhileLoopExpressionNode
} from "../runtime/tico";
import { treefy, TreefyOptions } from "../utils";
import TicoTokenizer, { TokenEnum } from "./ticoTokenizer";

export type StringifyOptions = {
	indent?: string;
	showPosition?: boolean;
};

export default class TicoParser {
	private tokenizer: TicoTokenizer;

	private literal(): Node {
		const literal = 
			this.tokenizer.tk(TokenEnum.LiteralNumber) ||
			this.tokenizer.tk(TokenEnum.LiteralBigInt) ||
			this.tokenizer.tk(TokenEnum.LiteralString) ||
			this.tokenizer.tk(TokenEnum.LiteralBoolean)
			;

		let val: any = null;

		if (literal) {
			switch (literal.type) {
				case TokenEnum.LiteralNumber: {
					val = Number(literal.match[0]);
				} break;
				case TokenEnum.LiteralBigInt: {
					val = BigInt(literal.match[1]);
				} break;
				case TokenEnum.LiteralString: {
					val = String(literal.match[1]);
				} break;
				case TokenEnum.LiteralBoolean: {
					val = literal.match[0] === 'true';
				} break;
			}
			return {
				type: NodeType.Literal,
				value: val,
				raw: literal,
				start: literal.start,
				end: literal.end,
				line: literal.line,
				column: literal.column
			} as LiteralNode;
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
				end: v.end,
				line: v.line,
				column: v.column
			} as IdentifierNode;
		}
		return null;
	}

	private functionCallArgs(): Node[] {
		const args: Node[] = [];

		while (true) {
			const val = this.expression();
			if (!val) {
				if (args.length > 0)
					this.tokenizer.tkThrowErr(`Expected expression`);
				break;
			}

			args.push(val);

			if (!this.tokenizer.tk(TokenEnum.SymbolComma))
				break;
		}

		return args;
	}

	private functionCall(): Node {
		const tkPos = this.tokenizer.tkCursor();

		const id = this.identifier() as IdentifierNode;
		if (!id)
			return this.tokenizer.tkRet(tkPos);

		if (!this.tokenizer.tk(TokenEnum.SymbolParOpen))
			return this.tokenizer.tkRet(tkPos);

		const args = this.functionCallArgs();

		const close = this.tokenizer.tk(TokenEnum.SymbolParClose);
		if (!close)
			this.tokenizer.tkThrowErr(`Expected ")"`);

		return {
			type: NodeType.FunctionCall,
			id,
			args,
			start: id.start,
			end: close.end,
			line: id.line,
			column: id.column
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
			this.tokenizer.tkThrowErr(`Expected ")"`);

		if (!expr)
			return null;

		expr.start = parOpen.start;
		expr.end = parClose.end;

		return expr;
	}

	private negateExpression(): Node {
		const tkPos = this.tokenizer.tkCursor();

		const negate = this.tokenizer.tk(TokenEnum.SymbolExclamationMark);
		if (!negate)
			return this.tokenizer.tkRet(tkPos);

		const expr = this.expression();
		if (!expr)
			this.tokenizer.tkThrowErr(`Expected expression`);

		return {
			type: NodeType.NegateExpression,
			expr,
			start: negate.start,
			end: expr.end,
			line: negate.line,
			column: negate.column
		} as NegateExpressionNode;
	}

		return  this.negateExpression() ||
				this.literal()
				;
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
			if (!next) this.tokenizer.tkThrowErr(`Expected expression member`);

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
				end: right.end,
				line: l.line,
				column: l.column
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
	private ifExpression(): Node {
		const tkPos = this.tokenizer.tkCursor();

		const ifKey = this.tokenizer.tk(TokenEnum.KeywordIf);
		if (!ifKey) { return this.tokenizer.tkRet(tkPos); }

		const expr = this.expression();
		if (!expr)
			this.tokenizer.tkThrowErr("Expected expression");

		const branch = this.branch() as IfExpressionNode;

		branch.type = NodeType.IfExpression;
		branch.condition = expr;
		branch.start = ifKey.start;
		branch.line = ifKey.line;
		branch.column = ifKey.column;

		if (this.tokenizer.tk(TokenEnum.KeywordElse)) {
			this.tokenizer.tkBack();
			branch.next = this.elseExpression();
		} else if (this.tokenizer.tk(TokenEnum.KeywordElif)) {
			this.tokenizer.tkBack();
			branch.next = this.elifExpression();
		}

		return branch;
	}

	private elseExpression() {
		const tkPos = this.tokenizer.tkCursor();

		const elseKey = this.tokenizer.tk(TokenEnum.KeywordElse);
		if (!elseKey) { return this.tokenizer.tkRet(tkPos); }

		const branch = this.branch() as ElseExpressionNode;

		branch.type = NodeType.ElseExpression;
		branch.start = elseKey.start;
		branch.line = elseKey.line;
		branch.column = elseKey.column;

		return branch;
	}

	private elifExpression() {
		const tkPos = this.tokenizer.tkCursor();

		const elifKey = this.tokenizer.tk(TokenEnum.KeywordElif);
		if (!elifKey) { return this.tokenizer.tkRet(tkPos); }

		const expr = this.expression();
		if (!expr)
			this.tokenizer.tkThrowErr("Expected expression");

		const branch = this.branch() as IfExpressionNode;

		branch.type = NodeType.IfExpression;
		branch.condition = expr;
		branch.start = elifKey.start;
		branch.line = elifKey.line;
		branch.column = elifKey.column;

		if (this.tokenizer.tk(TokenEnum.KeywordElse)) {
			branch.next = this.elseExpression();
		} else if (this.tokenizer.tk(TokenEnum.KeywordElif)) {
			this.tokenizer.tkBack();
			branch.next = this.elifExpression();
		}

		return branch;
	}

	private whileExpression() {
		const tkPos = this.tokenizer.tkCursor();

		const whileKey = this.tokenizer.tk(TokenEnum.KeywordWhile);
		if (!whileKey) { return this.tokenizer.tkRet(tkPos); }

		const expr = this.expression();
		if (!expr)
			this.tokenizer.tkThrowErr("Expected expression");

		const branch = this.branch() as WhileLoopExpressionNode;

		branch.type = NodeType.WhileLoopExpression;
		branch.condition = expr;
		branch.start = whileKey.start;
		branch.line = whileKey.line;
		branch.column = whileKey.column;

		return branch;
	}

	private variableSet(): Node {
		const tkPos = this.tokenizer.tkCursor();

		const id = this.identifier() as IdentifierNode;
		if (!id)
			return this.tokenizer.tkRet(tkPos);

		if (!this.tokenizer.tk(TokenEnum.SymbolEquals))
			return this.tokenizer.tkRet(tkPos);

		const expr = this.expression();
		if (!expr) this.tokenizer.tkThrowErr(`Expected expression`);

		const node: SetNode = {
			type: NodeType.Set,
			id,
			value: expr,
			start: id.start,
			end: expr.end,
			line: id.line,
			column: id.column
		};

		return node;
	}

	private functionExpressionArgs(): FunctionArgNode[] {
		const args: FunctionArgNode[] = [];

		while (true) {
			const staticArg = this.tokenizer.tk(TokenEnum.SymbolExclamationMark) !== null;

			const id = this.identifier() as IdentifierNode;
			if (!id) {
				if (args.length > 0)
					this.tokenizer.tkThrowErr(`Expected identifier`);
				break;
			}

			const eq = this.tokenizer.tk(TokenEnum.SymbolEquals);
			let defValue: Node = null;
			if (eq) {
				defValue = this.expression();
				if (!defValue)
					this.tokenizer.tkThrowErr(`Expected expression`);
			} else if (staticArg)
				this.tokenizer.tkThrowErr(`Static argument declaration expects a default value expression`);

			args.push({
				type: NodeType.FunctionArg,
				id,
				defaultValueExpression: defValue,
				staticDefaultValue: staticArg,
				start: id.start,
				end: defValue ? defValue.end : id.end,
				line: id.line,
				column: id.column
			});

			if (!this.tokenizer.tk(TokenEnum.SymbolComma))
				break;
		}

		return args;
	}

	private functionExpression(): Node {
		const tkPos = this.tokenizer.tkCursor();

		const keyFunc = this.tokenizer.tk(TokenEnum.KeywordFunction);
		if (!keyFunc)
			return this.tokenizer.tkRet(tkPos);

		const id = this.identifier() as IdentifierNode;
		if (!id)
			this.tokenizer.tkThrowErr(`Expected identifier`);

		if (!this.tokenizer.tk(TokenEnum.SymbolParOpen))
			this.tokenizer.tkThrowErr(`Expected "("`);

		const args = this.functionExpressionArgs();

		if (!this.tokenizer.tk(TokenEnum.SymbolParClose))
			this.tokenizer.tkThrowErr(`Expected ")"`);

		if (!this.tokenizer.tk(TokenEnum.SymbolCurlyBracketOpen))
			this.tokenizer.tkThrowErr(`Expected "{"`);

		const branch = this.branch() as FunctionExpressionNode;
		branch.type = NodeType.FunctionExpression;
		branch.id = id;
		branch.args = args;
		branch.start = keyFunc.start;

		return branch;
	}

	private returnExpression(): Node {
		const retKey = this.tokenizer.tk(TokenEnum.KeywordReturn);
		if (!retKey) return null;

		const retExpr = this.expression();

		return {
			type: NodeType.ReturnExpression,
			expression: retExpr,
			start: retKey.start,
			end: retExpr ? retExpr.end : retKey.end,
			line: retKey.line,
			column: retKey.column
		} as ReturnExpressionNode;
	}

		const expr = this.negateExpression() ||
			this.returnExpression() ||
			this.ifExpression() ||
			this.whileExpression() ||
		const branch: BranchNode = {
			type: NodeType.Branch,
			parent: null,
			children: [],
			start: 0,
			end: 0,
			line: 0,
			column: 0
		};

		let ended = false;

		while (true) {
			const node = this.variableSet() ||
				this.functionExpression() ||
				this.ifExpression() ||
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

		if (!main && !ended) this.tokenizer.tkThrowErr(`Expected "}"`);

		return branch;
	}

	public parse(source: string): BranchNode {
		this.tokenizer = new TicoTokenizer();
		this.tokenizer.tokenize(source);

		try {
			const main = this.branch(true);

			if (this.tokenizer.tokensLeft() > 0) {
				this.tokenizer.tkThrowErr(`Unexpected token [${this.tokenizer.currTk().match[0]}]`);
			}

			return main;
		} catch (e) {
			console.dir(this.tokenizer.getTokens(), { depth: null });

			throw e;
		}
	}

	public static stringify(node: Node, options: StringifyOptions = {}, treefyOptions: TreefyOptions = {}): string {
		const { showPosition = true } = options;

		const getTree = (n: Node) => {
			if (n === null) return null;

			const tree = {};

			const position = () => `(L ${n.line}, C ${n.column})`;

			switch (n.type) {
				case NodeType.Branch: {
					const nd = n as BranchNode;

					tree['title'] = "BranchNode";
					if (showPosition) tree['position'] = position();

					tree['scope'] = nd.children.map(c => getTree(c));
				} break;
				case NodeType.BinaryExpression: {
					const nd = n as BinaryExpressionNode;

					tree['title'] = "BinaryExpressionNode";
					if (showPosition) tree['position'] = position();

					tree['left'] = getTree(nd.left);
					tree['operator'] = nd.operator.match[0];
					tree['right'] = getTree(nd.right);
				} break;
				case NodeType.ConditionalExpression: {
					const nd = n as ConditionalExpressionNode;

					tree['title'] = "ConditionalExpressionNode";
					if (showPosition) tree['position'] = position();

					tree['left'] = getTree(nd.left);
					tree['operator'] = nd.operator.match[0];
					tree['right'] = getTree(nd.right);
				case NodeType.NegateExpression: {
					const nd = n as NegateExpressionNode;

					tree['title'] = "NegateExpressionNode";
					if (showPosition) tree['position'] = position();

					tree['expr'] = getTree(nd.expr);
				} break;
				case NodeType.IfExpression: {
					const nd = n as IfExpressionNode;

					tree['title'] = "IfExpressionNode";
					if (showPosition) tree['position'] = position();

					tree['condition'] = getTree(nd.condition);
					if (nd.children.length === 0) {
						tree['scope'] = 'empty';
					} else {
						tree['scope'] = nd.children.map(c => getTree(c));
					}
					if (nd.next) {
						tree['next'] = getTree(nd.next);
					} else {
						tree['next'] = 'empty';
					}
				} break;
				case NodeType.ElseExpression: {
					const nd = n as ElseExpressionNode;

					tree['title'] = "ElseExpressionNode";
					if (showPosition) tree['position'] = position();

					if (nd.children.length === 0) {
						tree['scope'] = 'empty';
					} else {
						tree['scope'] = nd.children.map(c => getTree(c));
					}
				} break;
				case NodeType.WhileLoopExpression: {
					const nd = n as WhileLoopExpressionNode;

					tree['title'] = "WhileLoopExpressionNode";
					if (showPosition) tree['position'] = position();

					tree['condition'] = getTree(nd.condition);
					if (nd.children.length === 0) {
						tree['scope'] = 'empty';
					} else {
						tree['scope'] = nd.children.map(c => getTree(c));
					}
				} break;
				case NodeType.Literal: {
					const nd = n as LiteralNode;

					tree['title'] = "LiteralNode";
					if (showPosition) tree['position'] = position();

					tree['value'] = nd.value;
				} break;
				case NodeType.Identifier: {
					const nd = n as IdentifierNode;

					tree['title'] = "IdentifierNode";
					if (showPosition) tree['position'] = position();

					tree['id'] = nd.id.match[0];
				} break;
				case NodeType.Set: {
					const nd = n as SetNode;

					tree['title'] = "SetNode";
					if (showPosition) tree['position'] = position();

					tree['id'] = getTree(nd.id);
					tree['value'] = getTree(nd.value);
				} break;
				case NodeType.FunctionArg: {
					const nd = n as FunctionArgNode;

					tree['title'] = "FunctionArgNode";
					if (showPosition) tree['position'] = position();

					tree['id'] = getTree(nd.id);
					tree['defaultValue'] = getTree(nd.defaultValueExpression);
					tree['staticDefaultValue'] = nd.staticDefaultValue;
				} break;
				case NodeType.FunctionExpression: {
					const nd = n as FunctionExpressionNode;

					tree['title'] = "FunctionExpressionNode";
					if (showPosition) tree['position'] = position();

					tree['id'] = getTree(nd.id);
					tree['args'] = nd.args.map(arg => getTree(arg));
					tree['scope'] = nd.children.map(c => getTree(c));
				} break;
				case NodeType.ReturnExpression: {
					const nd = n as ReturnExpressionNode;

					tree['title'] = "ReturnExpressionNode";
					if (showPosition) tree['position'] = position();

					tree['expression'] = getTree(nd.expression);
				} break;
				case NodeType.FunctionCall: {
					const nd = n as FunctionCallNode;

					tree['title'] = "FunctionCallNode";
					if (showPosition) tree['position'] = position();

					tree['id'] = getTree(nd.id);
					tree['args'] = nd.args.map(arg => getTree(arg));
				} break;
				default: throw new Error(`Not implemented`);
			}

			return tree;
		}

		return treefy(getTree(node), treefyOptions);
	}
}