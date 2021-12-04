import { NodeType, } from "../runtime/tico";
import { lineColumnFromString, treefy } from "../utils";
import TicoTokenizer, { TokenEnum } from "./ticoTokenizer";
export default class TicoParser {
    literal() {
        const literal = this.tokenizer.tk(TokenEnum.LiteralNumber) ||
            this.tokenizer.tk(TokenEnum.LiteralBigInt) ||
            this.tokenizer.tk(TokenEnum.LiteralString) ||
            this.tokenizer.tk(TokenEnum.LiteralBoolean) ||
            this.tokenizer.tk(TokenEnum.LiteralNull) ||
            this.tokenizer.tk(TokenEnum.LiteralUndefined);
        let val = null;
        if (literal) {
            switch (literal.type) {
                case TokenEnum.LiteralNumber:
                    {
                        val = Number(literal.match[0]);
                    }
                    break;
                case TokenEnum.LiteralBigInt:
                    {
                        val = BigInt(literal.match[1]);
                    }
                    break;
                case TokenEnum.LiteralString:
                    {
                        val = String(literal.match[1]);
                    }
                    break;
                case TokenEnum.LiteralBoolean:
                    {
                        val = literal.match[0] === 'true';
                    }
                    break;
                case TokenEnum.LiteralNull:
                    {
                        val = null;
                    }
                    break;
                case TokenEnum.LiteralUndefined:
                    {
                        val = undefined;
                    }
                    break;
            }
            return {
                type: NodeType.Literal,
                value: val,
                raw: literal,
                start: literal.start,
                end: literal.end
            };
        }
        return null;
    }
    identifier() {
        const v = this.tokenizer.tk(TokenEnum.ExtraIdentifier);
        if (v) {
            return {
                type: NodeType.Identifier,
                id: v,
                start: v.start,
                end: v.end
            };
        }
        return null;
    }
    functionCallArgs() {
        const args = [];
        while (true) {
            const val = this.expression();
            if (!val) {
                if (args.length > 0)
                    this.tokenizer.throwErr(`Expected expression`);
                break;
            }
            args.push(val);
            if (!this.tokenizer.tk(TokenEnum.SymbolComma))
                break;
        }
        return args;
    }
    functionCall() {
        const tkPos = this.tokenizer.csr();
        const id = this.identifier();
        if (!id)
            return this.tokenizer.tkRet(tkPos);
        if (!this.tokenizer.tk(TokenEnum.SymbolParOpen))
            return this.tokenizer.tkRet(tkPos);
        const args = this.functionCallArgs();
        const close = this.tokenizer.tk(TokenEnum.SymbolParClose);
        if (!close)
            this.tokenizer.throwErr(`Expected ")"`);
        return {
            type: NodeType.FunctionCall,
            id,
            args,
            start: id.start,
            end: close.end,
        };
    }
    wrappedExpression() {
        const tkPos = this.tokenizer.csr();
        const parOpen = this.tokenizer.tk(TokenEnum.SymbolParOpen);
        if (!parOpen)
            return this.tokenizer.tkRet(tkPos);
        const expr = this.expression();
        const parClose = this.tokenizer.tk(TokenEnum.SymbolParClose);
        if (!parClose)
            this.tokenizer.throwErr(`Expected ")"`);
        if (!expr)
            return null;
        expr.start = parOpen.start;
        expr.end = parClose.end;
        return expr;
    }
    negateExpression() {
        const tkPos = this.tokenizer.csr();
        const negate = this.tokenizer.tk(TokenEnum.SymbolExclamationMark);
        if (!negate)
            return this.tokenizer.tkRet(tkPos);
        const expr = this.expressionMember();
        if (!expr)
            this.tokenizer.throwErr(`Expected expression`);
        return {
            type: NodeType.NegateExpression,
            expr,
            start: negate.start,
            end: expr.end,
        };
    }
    expressionMember() {
        return this.negateExpression() ||
            this.wrappedExpression() ||
            this.functionCall() ||
            this.identifier() ||
            this.literal();
    }
    binaryExpressionRecursive(left) {
        const operators = [
            // Binary
            [TokenEnum.BinaryOpSlash,
                TokenEnum.BinaryOpStar,
                TokenEnum.BinaryOpModulus],
            [TokenEnum.BinaryOpStarStar],
            [TokenEnum.BinaryOpSlashSlash,
                TokenEnum.BinaryOpModulusModulus],
            [TokenEnum.BinaryOpPlus,
                TokenEnum.BinaryOpMinus],
            // Conditional
            [TokenEnum.ConditionalOpGreater,
                TokenEnum.ConditionalOpLess,
                TokenEnum.ConditionalOpGreaterEqual,
                TokenEnum.ConditionalOpLessEqual],
            [TokenEnum.ConditionalOpEqual,
                TokenEnum.ConditionalOpNotEqual],
            [TokenEnum.ConditionalAnd,
                TokenEnum.ConditionalOr],
        ];
        const operator = (l, id) => {
            let op = null;
            for (const operator of operators[id]) {
                op = op || this.tokenizer.tk(operator);
            }
            if (!op) {
                return l;
            }
            const next = this.expressionMember();
            if (!next)
                this.tokenizer.throwErr(`Expected expression`);
            let right = next;
            for (let i = id - 1; i >= 0; i--) {
                right = operator(right, i);
            }
            let node = {
                type: NodeType.BinaryExpression,
                left: l,
                operator: op,
                right,
                start: l.start,
                end: right.end,
            };
            node = operator(node, id);
            return node;
        };
        let expr = left;
        let prev = left;
        while (true) {
            for (let i = 0; i < operators.length; i++) {
                expr = operator(expr, i);
            }
            if (expr === prev)
                break;
            prev = expr;
        }
        if (expr === left)
            return null;
        return expr;
    }
    binaryExpression() {
        const tkPos = this.tokenizer.csr();
        const head = this.expressionMember();
        if (!head) {
            return this.tokenizer.tkRet(tkPos);
        }
        const right = this.binaryExpressionRecursive(head);
        if (!right) {
            return this.tokenizer.tkRet(tkPos);
        }
        return right;
    }
    ifExpression() {
        const tkPos = this.tokenizer.csr();
        const ifKey = this.tokenizer.tk(TokenEnum.KeywordIf);
        if (!ifKey) {
            return this.tokenizer.tkRet(tkPos);
        }
        if (!this.tokenizer.tk(TokenEnum.SymbolParOpen))
            this.tokenizer.throwErr(`Expected "("`);
        const expr = this.expression();
        if (!expr)
            this.tokenizer.throwErr("Expected expression");
        if (!this.tokenizer.tk(TokenEnum.SymbolParClose))
            this.tokenizer.throwErr(`Expected ")"`);
        const branch = this.branch();
        branch.type = NodeType.IfExpression;
        branch.condition = expr;
        branch.start = ifKey.start;
        if (this.tokenizer.tk(TokenEnum.KeywordElse, false)) {
            branch.next = this.elseExpression();
        }
        else if (this.tokenizer.tk(TokenEnum.KeywordElif, false)) {
            branch.next = this.elifExpression();
        }
        return branch;
    }
    elseExpression() {
        const tkPos = this.tokenizer.csr();
        const elseKey = this.tokenizer.tk(TokenEnum.KeywordElse);
        if (!elseKey) {
            return this.tokenizer.tkRet(tkPos);
        }
        const branch = this.branch();
        branch.type = NodeType.ElseExpression;
        branch.start = elseKey.start;
        return branch;
    }
    elifExpression() {
        const tkPos = this.tokenizer.csr();
        const elifKey = this.tokenizer.tk(TokenEnum.KeywordElif);
        if (!elifKey) {
            return this.tokenizer.tkRet(tkPos);
        }
        if (!this.tokenizer.tk(TokenEnum.SymbolParOpen))
            this.tokenizer.throwErr(`Expected "("`);
        const expr = this.expression();
        if (!expr)
            this.tokenizer.throwErr("Expected expression");
        if (!this.tokenizer.tk(TokenEnum.SymbolParClose))
            this.tokenizer.throwErr(`Expected ")"`);
        const branch = this.branch();
        branch.type = NodeType.IfExpression;
        branch.condition = expr;
        branch.start = elifKey.start;
        if (this.tokenizer.tk(TokenEnum.KeywordElse, false)) {
            branch.next = this.elseExpression();
        }
        else if (this.tokenizer.tk(TokenEnum.KeywordElif, false)) {
            branch.next = this.elifExpression();
        }
        return branch;
    }
    whileLoopExpression() {
        const tkPos = this.tokenizer.csr();
        const whileKey = this.tokenizer.tk(TokenEnum.KeywordWhile);
        if (!whileKey) {
            return this.tokenizer.tkRet(tkPos);
        }
        if (!this.tokenizer.tk(TokenEnum.SymbolParOpen))
            this.tokenizer.throwErr(`Expected "("`);
        const expr = this.expression();
        if (!expr)
            this.tokenizer.throwErr("Expected expression");
        if (!this.tokenizer.tk(TokenEnum.SymbolParClose))
            this.tokenizer.throwErr(`Expected ")"`);
        const branch = this.branch();
        branch.type = NodeType.WhileLoopExpression;
        branch.condition = expr;
        branch.start = whileKey.start;
        return branch;
    }
    forExpression() {
        const tkPos = this.tokenizer.csr();
        const forKey = this.tokenizer.tk(TokenEnum.KeywordFor);
        if (!forKey) {
            return this.tokenizer.tkRet(tkPos);
        }
        if (!this.tokenizer.tk(TokenEnum.SymbolParOpen))
            this.tokenizer.throwErr(`Expected "("`);
        const init = this.expression();
        if (!init)
            this.tokenizer.throwErr(`Expected expression`);
        const condition = this.expression();
        if (!condition)
            this.tokenizer.throwErr(`Expected expression`);
        const iterate = this.expression();
        if (!iterate)
            this.tokenizer.throwErr(`Expected expression`);
        if (!this.tokenizer.tk(TokenEnum.SymbolParClose))
            this.tokenizer.throwErr(`Expected ")"`);
        const branch = this.branch();
        branch.type = NodeType.ForLoopExpression;
        branch.init = init;
        branch.condition = condition;
        branch.iterate = iterate;
        branch.start = forKey.start;
        return branch;
    }
    variableSet() {
        const tkPos = this.tokenizer.csr();
        const id = this.identifier();
        if (!id)
            return this.tokenizer.tkRet(tkPos);
        if (!this.tokenizer.tk(TokenEnum.SymbolEquals))
            return this.tokenizer.tkRet(tkPos);
        const expr = this.expression();
        if (!expr)
            this.tokenizer.throwErr(`Expected expression`);
        const node = {
            type: NodeType.Set,
            id,
            value: expr,
            start: id.start,
            end: expr.end,
        };
        return node;
    }
    functionExpressionArgs() {
        const args = [];
        while (true) {
            const staticArg = this.tokenizer.tk(TokenEnum.SymbolExclamationMark) !== null;
            const id = this.identifier();
            if (!id) {
                if (args.length > 0)
                    this.tokenizer.throwErr(`Expected identifier`);
                break;
            }
            const eq = this.tokenizer.tk(TokenEnum.SymbolEquals);
            let defValue = null;
            if (eq) {
                defValue = this.expression();
                if (!defValue)
                    this.tokenizer.throwErr(`Expected expression`);
            }
            else if (staticArg)
                this.tokenizer.throwErr(`Static argument declaration expects a default value expression`);
            args.push({
                type: NodeType.FunctionArg,
                id,
                defaultValueExpression: defValue,
                staticDefaultValue: staticArg,
                start: id.start,
                end: defValue ? defValue.end : id.end,
            });
            if (!this.tokenizer.tk(TokenEnum.SymbolComma))
                break;
        }
        return args;
    }
    functionExpression() {
        const tkPos = this.tokenizer.csr();
        const keyFunc = this.tokenizer.tk(TokenEnum.KeywordFunction);
        if (!keyFunc)
            return this.tokenizer.tkRet(tkPos);
        const id = this.identifier();
        if (!id)
            this.tokenizer.throwErr(`Expected identifier`);
        if (!this.tokenizer.tk(TokenEnum.SymbolParOpen))
            this.tokenizer.throwErr(`Expected "("`);
        const args = this.functionExpressionArgs();
        if (!this.tokenizer.tk(TokenEnum.SymbolParClose))
            this.tokenizer.throwErr(`Expected ")"`);
        const branch = this.branch();
        branch.type = NodeType.FunctionExpression;
        branch.id = id;
        branch.args = args;
        branch.start = keyFunc.start;
        return branch;
    }
    returnStatement() {
        const retKey = this.tokenizer.tk(TokenEnum.KeywordReturn);
        if (!retKey)
            return null;
        const retExpr = this.expression();
        return {
            type: NodeType.ReturnStatement,
            expression: retExpr,
            start: retKey.start,
            end: retExpr ? retExpr.end : retKey.end,
        };
    }
    breakStatement() {
        const breakKey = this.tokenizer.tk(TokenEnum.KeywordBreak);
        if (!breakKey)
            return null;
        return {
            type: NodeType.BreakStatement,
            start: breakKey.start,
            end: breakKey.end,
        };
    }
    expression() {
        const expr = this.variableSet() ||
            this.functionExpression() ||
            this.returnStatement() ||
            this.breakStatement() ||
            this.ifExpression() ||
            this.whileLoopExpression() ||
            this.forExpression() ||
            this.binaryExpression() ||
            this.expressionMember();
        this.tokenizer.tk(TokenEnum.SymbolSemicolon);
        return expr;
    }
    branch() {
        const branch = {
            type: NodeType.Branch,
            parent: null,
            children: [],
            start: 0,
            end: 0,
        };
        const singleExpression = this.tokenizer.tk(TokenEnum.SymbolCurlyBracketOpen) === null;
        let ended = false;
        while (true) {
            const node = this.expression();
            if (node) {
                if (branch.children.length === 0)
                    branch.start = node.start;
                branch.end = node.end;
                branch.children.push(node);
            }
            else if (this.tokenizer.tkEof()) {
                break;
            }
            else {
                this.tokenizer.unexpectedTokenErr(`Unexpected token [$tk]`);
            }
            if (singleExpression) {
                ended = true;
                break;
            }
            else {
                if (this.tokenizer.tk(TokenEnum.SymbolCurlyBracketClose)) {
                    branch.end = node.end;
                    ended = true;
                    break;
                }
            }
        }
        if (!ended)
            this.tokenizer.throwErr(`Expected "}"`);
        return branch;
    }
    mainBranch() {
        const branch = {
            type: NodeType.Branch,
            parent: null,
            children: [],
            start: 0,
            end: 0,
        };
        while (true) {
            const node = this.expression();
            if (node) {
                if (branch.children.length === 0)
                    branch.start = node.start;
                branch.end = node.end;
                branch.children.push(node);
            }
            else if (this.tokenizer.tkEof()) {
                break;
            }
            else {
                this.tokenizer.unexpectedTokenErr(`Unexpected token [$tk]`);
            }
        }
        return branch;
    }
    parse(source) {
        this.tokenizer = new TicoTokenizer();
        this.tokenizer.tokenize(source);
        const main = this.mainBranch();
        if (!this.tokenizer.tkEof()) {
            this.tokenizer.unexpectedTokenErr(`Unexpected token [$tk]`);
        }
        return main;
    }
    static stringify(source, node, options = {}, treefyOptions = {}) {
        const { showPosition = true } = options;
        const getTree = (n) => {
            if (n === null)
                return null;
            const tree = {};
            const [l, c] = lineColumnFromString(source, n.start);
            const position = () => `(L ${l + 1}, C ${c + 1})`;
            switch (n.type) {
                case NodeType.Branch:
                    {
                        const nd = n;
                        tree['title'] = "BranchNode";
                        if (showPosition)
                            tree['position'] = position();
                        if (nd.children.length === 0) {
                            tree['scope'] = 'empty';
                        }
                        else {
                            tree['scope'] = nd.children.map(c => getTree(c));
                        }
                    }
                    break;
                case NodeType.BinaryExpression:
                    {
                        const nd = n;
                        tree['title'] = "BinaryExpressionNode";
                        if (showPosition)
                            tree['position'] = position();
                        tree['left'] = getTree(nd.left);
                        tree['operator'] = nd.operator.match[0];
                        tree['right'] = getTree(nd.right);
                    }
                    break;
                case NodeType.NegateExpression:
                    {
                        const nd = n;
                        tree['title'] = "NegateExpressionNode";
                        if (showPosition)
                            tree['position'] = position();
                        tree['expr'] = getTree(nd.expr);
                    }
                    break;
                case NodeType.IfExpression:
                    {
                        const nd = n;
                        tree['title'] = "IfExpressionNode";
                        if (showPosition)
                            tree['position'] = position();
                        tree['condition'] = getTree(nd.condition);
                        if (nd.children.length === 0) {
                            tree['scope'] = 'empty';
                        }
                        else {
                            tree['scope'] = nd.children.map(c => getTree(c));
                        }
                        if (nd.next) {
                            tree['next'] = getTree(nd.next);
                        }
                        else {
                            tree['next'] = 'empty';
                        }
                    }
                    break;
                case NodeType.ElseExpression:
                    {
                        const nd = n;
                        tree['title'] = "ElseExpressionNode";
                        if (showPosition)
                            tree['position'] = position();
                        if (nd.children.length === 0) {
                            tree['scope'] = 'empty';
                        }
                        else {
                            tree['scope'] = nd.children.map(c => getTree(c));
                        }
                    }
                    break;
                case NodeType.WhileLoopExpression:
                    {
                        const nd = n;
                        tree['title'] = "WhileLoopExpressionNode";
                        if (showPosition)
                            tree['position'] = position();
                        tree['condition'] = getTree(nd.condition);
                        if (nd.children.length === 0) {
                            tree['scope'] = 'empty';
                        }
                        else {
                            tree['scope'] = nd.children.map(c => getTree(c));
                        }
                    }
                    break;
                case NodeType.ForLoopExpression:
                    {
                        const nd = n;
                        tree['title'] = "ForLoopExpressionNode";
                        if (showPosition)
                            tree['position'] = position();
                        tree['init'] = getTree(nd.init);
                        tree['condition'] = getTree(nd.condition);
                        tree['iterate'] = getTree(nd.iterate);
                        if (nd.children.length === 0) {
                            tree['scope'] = 'empty';
                        }
                        else {
                            tree['scope'] = nd.children.map(c => getTree(c));
                        }
                    }
                    break;
                case NodeType.Literal:
                    {
                        const nd = n;
                        tree['title'] = "LiteralNode";
                        if (showPosition)
                            tree['position'] = position();
                        tree['value'] = nd.value;
                    }
                    break;
                case NodeType.Identifier:
                    {
                        const nd = n;
                        tree['title'] = "IdentifierNode";
                        if (showPosition)
                            tree['position'] = position();
                        tree['id'] = nd.id.match[0];
                    }
                    break;
                case NodeType.Set:
                    {
                        const nd = n;
                        tree['title'] = "SetNode";
                        if (showPosition)
                            tree['position'] = position();
                        tree['id'] = getTree(nd.id);
                        tree['value'] = getTree(nd.value);
                    }
                    break;
                case NodeType.FunctionArg:
                    {
                        const nd = n;
                        tree['title'] = "FunctionArgNode";
                        if (showPosition)
                            tree['position'] = position();
                        tree['id'] = getTree(nd.id);
                        tree['defaultValue'] = getTree(nd.defaultValueExpression);
                        tree['staticDefaultValue'] = nd.staticDefaultValue;
                    }
                    break;
                case NodeType.FunctionExpression:
                    {
                        const nd = n;
                        tree['title'] = "FunctionExpressionNode";
                        if (showPosition)
                            tree['position'] = position();
                        tree['id'] = getTree(nd.id);
                        tree['args'] = nd.args.map(arg => getTree(arg));
                        if (nd.children.length === 0) {
                            tree['scope'] = 'empty';
                        }
                        else {
                            tree['scope'] = nd.children.map(c => getTree(c));
                        }
                    }
                    break;
                case NodeType.ReturnStatement:
                    {
                        const nd = n;
                        tree['title'] = "ReturnStatementNode";
                        if (showPosition)
                            tree['position'] = position();
                        tree['expression'] = getTree(nd.expression);
                    }
                    break;
                case NodeType.BreakStatement:
                    {
                        const nd = n;
                        tree['title'] = "BreakStatementNode";
                        if (showPosition)
                            tree['position'] = position();
                    }
                    break;
                case NodeType.FunctionCall:
                    {
                        const nd = n;
                        tree['title'] = "FunctionCallNode";
                        if (showPosition)
                            tree['position'] = position();
                        tree['id'] = getTree(nd.id);
                        tree['args'] = nd.args.map(arg => getTree(arg));
                    }
                    break;
                default: throw new Error(`Not implemented`);
            }
            return tree;
        };
        return treefy(getTree(node), treefyOptions);
    }
}
