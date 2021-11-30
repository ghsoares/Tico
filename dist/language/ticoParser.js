"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const tico_1 = require("../runtime/tico");
const utils_1 = require("../utils");
const ticoTokenizer_1 = __importStar(require("./ticoTokenizer"));
class TicoParser {
    literal() {
        const literal = this.tokenizer.tk(ticoTokenizer_1.TokenEnum.LiteralNumber) ||
            this.tokenizer.tk(ticoTokenizer_1.TokenEnum.LiteralBigInt) ||
            this.tokenizer.tk(ticoTokenizer_1.TokenEnum.LiteralString) ||
            this.tokenizer.tk(ticoTokenizer_1.TokenEnum.LiteralBoolean) ||
            this.tokenizer.tk(ticoTokenizer_1.TokenEnum.LiteralNull) ||
            this.tokenizer.tk(ticoTokenizer_1.TokenEnum.LiteralUndefined);
        let val = null;
        if (literal) {
            switch (literal.type) {
                case ticoTokenizer_1.TokenEnum.LiteralNumber:
                    {
                        val = Number(literal.match[0]);
                    }
                    break;
                case ticoTokenizer_1.TokenEnum.LiteralBigInt:
                    {
                        val = BigInt(literal.match[1]);
                    }
                    break;
                case ticoTokenizer_1.TokenEnum.LiteralString:
                    {
                        val = String(literal.match[1]);
                    }
                    break;
                case ticoTokenizer_1.TokenEnum.LiteralBoolean:
                    {
                        val = literal.match[0] === 'true';
                    }
                    break;
                case ticoTokenizer_1.TokenEnum.LiteralNull:
                    {
                        val = null;
                    }
                    break;
                case ticoTokenizer_1.TokenEnum.LiteralUndefined:
                    {
                        val = undefined;
                    }
                    break;
            }
            return {
                type: tico_1.NodeType.Literal,
                value: val,
                raw: literal,
                start: literal.start,
                end: literal.end,
                line: literal.line,
                column: literal.column
            };
        }
        return null;
    }
    identifier() {
        const v = this.tokenizer.tk(ticoTokenizer_1.TokenEnum.ExtraIdentifier);
        if (v) {
            return {
                type: tico_1.NodeType.Identifier,
                id: v,
                start: v.start,
                end: v.end,
                line: v.line,
                column: v.column
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
                    this.tokenizer.tkThrowErr(`Expected expression`);
                break;
            }
            args.push(val);
            if (!this.tokenizer.tk(ticoTokenizer_1.TokenEnum.SymbolComma))
                break;
        }
        return args;
    }
    functionCall() {
        const tkPos = this.tokenizer.tkCursor();
        const id = this.identifier();
        if (!id)
            return this.tokenizer.tkRet(tkPos);
        if (!this.tokenizer.tk(ticoTokenizer_1.TokenEnum.SymbolParOpen))
            return this.tokenizer.tkRet(tkPos);
        const args = this.functionCallArgs();
        const close = this.tokenizer.tk(ticoTokenizer_1.TokenEnum.SymbolParClose);
        if (!close)
            this.tokenizer.tkThrowErr(`Expected ")"`);
        return {
            type: tico_1.NodeType.FunctionCall,
            id,
            args,
            start: id.start,
            end: close.end,
            line: id.line,
            column: id.column
        };
    }
    wrappedExpression() {
        const tkPos = this.tokenizer.tkCursor();
        const parOpen = this.tokenizer.tk(ticoTokenizer_1.TokenEnum.SymbolParOpen);
        if (!parOpen)
            return this.tokenizer.tkRet(tkPos);
        const expr = this.expression();
        const parClose = this.tokenizer.tk(ticoTokenizer_1.TokenEnum.SymbolParClose);
        if (!parClose)
            this.tokenizer.tkThrowErr(`Expected ")"`);
        if (!expr)
            return null;
        expr.start = parOpen.start;
        expr.end = parClose.end;
        return expr;
    }
    negateExpression() {
        const tkPos = this.tokenizer.tkCursor();
        const negate = this.tokenizer.tk(ticoTokenizer_1.TokenEnum.SymbolExclamationMark);
        if (!negate)
            return this.tokenizer.tkRet(tkPos);
        const expr = this.expressionMember();
        if (!expr)
            this.tokenizer.tkThrowErr(`Expected expression`);
        return {
            type: tico_1.NodeType.NegateExpression,
            expr,
            start: negate.start,
            end: expr.end,
            line: negate.line,
            column: negate.column
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
            [ticoTokenizer_1.TokenEnum.BinaryOpStarStar],
            [ticoTokenizer_1.TokenEnum.BinaryOpSlash,
                ticoTokenizer_1.TokenEnum.BinaryOpStar,
                ticoTokenizer_1.TokenEnum.BinaryOpModulus],
            [ticoTokenizer_1.TokenEnum.BinaryOpSlashSlash,
                ticoTokenizer_1.TokenEnum.BinaryOpModulusModulus],
            [ticoTokenizer_1.TokenEnum.BinaryOpPlus,
                ticoTokenizer_1.TokenEnum.BinaryOpMinus],
            // Conditional
            [ticoTokenizer_1.TokenEnum.ConditionalOpGreater,
                ticoTokenizer_1.TokenEnum.ConditionalOpLess,
                ticoTokenizer_1.TokenEnum.ConditionalOpGreaterEqual,
                ticoTokenizer_1.TokenEnum.ConditionalOpLessEqual],
            [ticoTokenizer_1.TokenEnum.ConditionalOpEqual,
                ticoTokenizer_1.TokenEnum.ConditionalOpNotEqual],
            [ticoTokenizer_1.TokenEnum.ConditionalAnd,
                ticoTokenizer_1.TokenEnum.ConditionalOr],
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
                this.tokenizer.tkThrowErr(`Expected expression member`);
            let right = next;
            for (let i = id - 1; i >= 0; i--) {
                right = operator(right, i);
            }
            let node = {
                type: tico_1.NodeType.BinaryExpression,
                left: l,
                operator: op,
                right,
                start: l.start,
                end: right.end,
                line: l.line,
                column: l.column
            };
            for (let i = operators.length - 1; i > id; i--) {
                node = operator(node, i);
            }
            node = operator(node, id);
            return node;
        };
        let expr = left;
        for (let i = 0; i < operators.length; i++) {
            expr = operator(expr, i);
        }
        if (expr === left)
            return null;
        return expr;
    }
    binaryExpression() {
        const tkPos = this.tokenizer.tkCursor();
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
        const tkPos = this.tokenizer.tkCursor();
        const ifKey = this.tokenizer.tk(ticoTokenizer_1.TokenEnum.KeywordIf);
        if (!ifKey) {
            return this.tokenizer.tkRet(tkPos);
        }
        if (!this.tokenizer.tk(ticoTokenizer_1.TokenEnum.SymbolParOpen))
            this.tokenizer.tkThrowErr(`Expected "("`);
        const expr = this.expression();
        if (!expr)
            this.tokenizer.tkThrowErr("Expected expression");
        if (!this.tokenizer.tk(ticoTokenizer_1.TokenEnum.SymbolBracketClose))
            this.tokenizer.tkThrowErr(`Expected ")"`);
        const branch = this.branch();
        branch.type = tico_1.NodeType.IfExpression;
        branch.condition = expr;
        branch.start = ifKey.start;
        branch.line = ifKey.line;
        branch.column = ifKey.column;
        if (this.tokenizer.tk(ticoTokenizer_1.TokenEnum.KeywordElse)) {
            this.tokenizer.tkBack();
            branch.next = this.elseExpression();
        }
        else if (this.tokenizer.tk(ticoTokenizer_1.TokenEnum.KeywordElif)) {
            this.tokenizer.tkBack();
            branch.next = this.elifExpression();
        }
        return branch;
    }
    elseExpression() {
        const tkPos = this.tokenizer.tkCursor();
        const elseKey = this.tokenizer.tk(ticoTokenizer_1.TokenEnum.KeywordElse);
        if (!elseKey) {
            return this.tokenizer.tkRet(tkPos);
        }
        const branch = this.branch();
        branch.type = tico_1.NodeType.ElseExpression;
        branch.start = elseKey.start;
        branch.line = elseKey.line;
        branch.column = elseKey.column;
        return branch;
    }
    elifExpression() {
        const tkPos = this.tokenizer.tkCursor();
        const elifKey = this.tokenizer.tk(ticoTokenizer_1.TokenEnum.KeywordElif);
        if (!elifKey) {
            return this.tokenizer.tkRet(tkPos);
        }
        if (!this.tokenizer.tk(ticoTokenizer_1.TokenEnum.SymbolParOpen))
            this.tokenizer.tkThrowErr(`Expected "("`);
        const expr = this.expression();
        if (!expr)
            this.tokenizer.tkThrowErr("Expected expression");
        if (!this.tokenizer.tk(ticoTokenizer_1.TokenEnum.SymbolParClose))
            this.tokenizer.tkThrowErr(`Expected ")"`);
        const branch = this.branch();
        branch.type = tico_1.NodeType.IfExpression;
        branch.condition = expr;
        branch.start = elifKey.start;
        branch.line = elifKey.line;
        branch.column = elifKey.column;
        if (this.tokenizer.tk(ticoTokenizer_1.TokenEnum.KeywordElse)) {
            branch.next = this.elseExpression();
        }
        else if (this.tokenizer.tk(ticoTokenizer_1.TokenEnum.KeywordElif)) {
            this.tokenizer.tkBack();
            branch.next = this.elifExpression();
        }
        return branch;
    }
    whileLoopExpression() {
        const tkPos = this.tokenizer.tkCursor();
        const whileKey = this.tokenizer.tk(ticoTokenizer_1.TokenEnum.KeywordWhile);
        if (!whileKey) {
            return this.tokenizer.tkRet(tkPos);
        }
        if (!this.tokenizer.tk(ticoTokenizer_1.TokenEnum.SymbolParOpen))
            this.tokenizer.tkThrowErr(`Expected "("`);
        const expr = this.expression();
        if (!expr)
            this.tokenizer.tkThrowErr("Expected expression");
        if (!this.tokenizer.tk(ticoTokenizer_1.TokenEnum.SymbolParClose))
            this.tokenizer.tkThrowErr(`Expected ")"`);
        const branch = this.branch();
        branch.type = tico_1.NodeType.WhileLoopExpression;
        branch.condition = expr;
        branch.start = whileKey.start;
        branch.line = whileKey.line;
        branch.column = whileKey.column;
        return branch;
    }
    forExpression() {
        const tkPos = this.tokenizer.tkCursor();
        const forKey = this.tokenizer.tk(ticoTokenizer_1.TokenEnum.KeywordFor);
        if (!forKey) {
            return this.tokenizer.tkRet(tkPos);
        }
        if (!this.tokenizer.tk(ticoTokenizer_1.TokenEnum.SymbolParOpen))
            this.tokenizer.tkThrowErr(`Expected "("`);
        const init = this.expression();
        if (!init)
            this.tokenizer.tkThrowErr(`Expected expression`);
        const condition = this.expression();
        if (!condition)
            this.tokenizer.tkThrowErr(`Expected expression`);
        const iterate = this.expression();
        if (!iterate)
            this.tokenizer.tkThrowErr(`Expected expression`);
        if (!this.tokenizer.tk(ticoTokenizer_1.TokenEnum.SymbolParClose))
            this.tokenizer.tkThrowErr(`Expected "("`);
        const branch = this.branch();
        branch.type = tico_1.NodeType.ForLoopExpression;
        branch.init = init;
        branch.condition = condition;
        branch.iterate = iterate;
        branch.start = forKey.start;
        branch.line = forKey.line;
        branch.column = forKey.column;
        return branch;
    }
    variableSet() {
        const tkPos = this.tokenizer.tkCursor();
        const id = this.identifier();
        if (!id)
            return this.tokenizer.tkRet(tkPos);
        if (!this.tokenizer.tk(ticoTokenizer_1.TokenEnum.SymbolEquals))
            return this.tokenizer.tkRet(tkPos);
        const expr = this.expression();
        if (!expr)
            this.tokenizer.tkThrowErr(`Expected expression`);
        const node = {
            type: tico_1.NodeType.Set,
            id,
            value: expr,
            start: id.start,
            end: expr.end,
            line: id.line,
            column: id.column
        };
        return node;
    }
    functionExpressionArgs() {
        const args = [];
        while (true) {
            const staticArg = this.tokenizer.tk(ticoTokenizer_1.TokenEnum.SymbolExclamationMark) !== null;
            const id = this.identifier();
            if (!id) {
                if (args.length > 0)
                    this.tokenizer.tkThrowErr(`Expected identifier`);
                break;
            }
            const eq = this.tokenizer.tk(ticoTokenizer_1.TokenEnum.SymbolEquals);
            let defValue = null;
            if (eq) {
                defValue = this.expression();
                if (!defValue)
                    this.tokenizer.tkThrowErr(`Expected expression`);
            }
            else if (staticArg)
                this.tokenizer.tkThrowErr(`Static argument declaration expects a default value expression`);
            args.push({
                type: tico_1.NodeType.FunctionArg,
                id,
                defaultValueExpression: defValue,
                staticDefaultValue: staticArg,
                start: id.start,
                end: defValue ? defValue.end : id.end,
                line: id.line,
                column: id.column
            });
            if (!this.tokenizer.tk(ticoTokenizer_1.TokenEnum.SymbolComma))
                break;
        }
        return args;
    }
    functionExpression() {
        const tkPos = this.tokenizer.tkCursor();
        const keyFunc = this.tokenizer.tk(ticoTokenizer_1.TokenEnum.KeywordFunction);
        if (!keyFunc)
            return this.tokenizer.tkRet(tkPos);
        const id = this.identifier();
        if (!id)
            this.tokenizer.tkThrowErr(`Expected identifier`);
        if (!this.tokenizer.tk(ticoTokenizer_1.TokenEnum.SymbolParOpen))
            this.tokenizer.tkThrowErr(`Expected "("`);
        const args = this.functionExpressionArgs();
        if (!this.tokenizer.tk(ticoTokenizer_1.TokenEnum.SymbolParClose))
            this.tokenizer.tkThrowErr(`Expected ")"`);
        const branch = this.branch();
        branch.type = tico_1.NodeType.FunctionExpression;
        branch.id = id;
        branch.args = args;
        branch.start = keyFunc.start;
        branch.line = keyFunc.line;
        branch.column = keyFunc.column;
        return branch;
    }
    returnStatement() {
        const retKey = this.tokenizer.tk(ticoTokenizer_1.TokenEnum.KeywordReturn);
        if (!retKey)
            return null;
        const retExpr = this.expression();
        return {
            type: tico_1.NodeType.ReturnStatement,
            expression: retExpr,
            start: retKey.start,
            end: retExpr ? retExpr.end : retKey.end,
            line: retKey.line,
            column: retKey.column
        };
    }
    breakStatement() {
        const breakKey = this.tokenizer.tk(ticoTokenizer_1.TokenEnum.KeywordBreak);
        if (!breakKey)
            return null;
        return {
            type: tico_1.NodeType.BreakStatement,
            start: breakKey.start,
            end: breakKey.end,
            line: breakKey.line,
            column: breakKey.column
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
        this.tokenizer.tk(ticoTokenizer_1.TokenEnum.SymbolSemicolon);
        return expr;
    }
    branch() {
        const branch = {
            type: tico_1.NodeType.Branch,
            parent: null,
            children: [],
            start: 0,
            end: 0,
            line: 0,
            column: 0
        };
        const singleExpression = this.tokenizer.tk(ticoTokenizer_1.TokenEnum.SymbolCurlyBracketOpen) === null;
        let ended = false;
        while (true) {
            const node = this.expression();
            if (node) {
                if (branch.children.length === 0)
                    branch.start = node.start;
                branch.end = node.end;
                branch.children.push(node);
            }
            else if (this.tokenizer.tk("EOF")) {
                break;
            }
            else {
                this.tokenizer.tkThrowErr(`Unexpected token [${this.tokenizer.currTk().match[0]}]`);
            }
            if (singleExpression) {
                ended = true;
                break;
            }
            else {
                if (this.tokenizer.tk(ticoTokenizer_1.TokenEnum.SymbolCurlyBracketClose)) {
                    branch.end = node.end;
                    ended = true;
                    break;
                }
            }
        }
        if (!ended)
            this.tokenizer.tkThrowErr(`Expected "}"`);
        return branch;
    }
    mainBranch() {
        const branch = {
            type: tico_1.NodeType.Branch,
            parent: null,
            children: [],
            start: 0,
            end: 0,
            line: 0,
            column: 0
        };
        while (true) {
            const node = this.expression();
            if (node) {
                if (branch.children.length === 0)
                    branch.start = node.start;
                branch.end = node.end;
                branch.children.push(node);
            }
            else if (this.tokenizer.tk("EOF")) {
                break;
            }
            else {
                this.tokenizer.tkThrowErr(`Unexpected token [${this.tokenizer.currTk().match[0]}]`);
            }
        }
        return branch;
    }
    parse(source) {
        this.tokenizer = new ticoTokenizer_1.default();
        this.tokenizer.tokenize(source);
        const main = this.mainBranch();
        if (this.tokenizer.tokensLeft() > 1) {
            this.tokenizer.tkThrowErr(`Unexpected token [${this.tokenizer.currTk().match[0]}]`);
        }
        return main;
    }
    static stringify(node, options = {}, treefyOptions = {}) {
        const { showPosition = true } = options;
        const getTree = (n) => {
            if (n === null)
                return null;
            const tree = {};
            const position = () => `(L ${n.line}, C ${n.column})`;
            switch (n.type) {
                case tico_1.NodeType.Branch:
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
                case tico_1.NodeType.BinaryExpression:
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
                case tico_1.NodeType.NegateExpression:
                    {
                        const nd = n;
                        tree['title'] = "NegateExpressionNode";
                        if (showPosition)
                            tree['position'] = position();
                        tree['expr'] = getTree(nd.expr);
                    }
                    break;
                case tico_1.NodeType.IfExpression:
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
                case tico_1.NodeType.ElseExpression:
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
                case tico_1.NodeType.WhileLoopExpression:
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
                case tico_1.NodeType.ForLoopExpression:
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
                case tico_1.NodeType.Literal:
                    {
                        const nd = n;
                        tree['title'] = "LiteralNode";
                        if (showPosition)
                            tree['position'] = position();
                        tree['value'] = nd.value;
                    }
                    break;
                case tico_1.NodeType.Identifier:
                    {
                        const nd = n;
                        tree['title'] = "IdentifierNode";
                        if (showPosition)
                            tree['position'] = position();
                        tree['id'] = nd.id.match[0];
                    }
                    break;
                case tico_1.NodeType.Set:
                    {
                        const nd = n;
                        tree['title'] = "SetNode";
                        if (showPosition)
                            tree['position'] = position();
                        tree['id'] = getTree(nd.id);
                        tree['value'] = getTree(nd.value);
                    }
                    break;
                case tico_1.NodeType.FunctionArg:
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
                case tico_1.NodeType.FunctionExpression:
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
                case tico_1.NodeType.ReturnStatement:
                    {
                        const nd = n;
                        tree['title'] = "ReturnStatementNode";
                        if (showPosition)
                            tree['position'] = position();
                        tree['expression'] = getTree(nd.expression);
                    }
                    break;
                case tico_1.NodeType.BreakStatement:
                    {
                        const nd = n;
                        tree['title'] = "BreakStatementNode";
                        if (showPosition)
                            tree['position'] = position();
                    }
                    break;
                case tico_1.NodeType.FunctionCall:
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
        return utils_1.treefy(getTree(node), treefyOptions);
    }
}
exports.default = TicoParser;
