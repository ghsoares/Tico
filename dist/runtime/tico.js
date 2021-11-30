"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeType = void 0;
const ticoParser_1 = __importDefault(require("../language/ticoParser"));
const ticoTokenizer_1 = require("../language/ticoTokenizer");
const tokenizer_1 = require("../language/tokenizer");
const utils_1 = require("../utils");
/**
 * Node type enum, contains all the node types used by Tico
 */
var NodeType;
(function (NodeType) {
    NodeType[NodeType["Branch"] = 0] = "Branch";
    NodeType[NodeType["BinaryExpression"] = 1] = "BinaryExpression";
    NodeType[NodeType["NegateExpression"] = 2] = "NegateExpression";
    NodeType[NodeType["IfExpression"] = 3] = "IfExpression";
    NodeType[NodeType["ElseExpression"] = 4] = "ElseExpression";
    NodeType[NodeType["WhileLoopExpression"] = 5] = "WhileLoopExpression";
    NodeType[NodeType["ForLoopExpression"] = 6] = "ForLoopExpression";
    NodeType[NodeType["Literal"] = 7] = "Literal";
    NodeType[NodeType["Identifier"] = 8] = "Identifier";
    NodeType[NodeType["Set"] = 9] = "Set";
    NodeType[NodeType["FunctionArg"] = 10] = "FunctionArg";
    NodeType[NodeType["FunctionExpression"] = 11] = "FunctionExpression";
    NodeType[NodeType["ReturnStatement"] = 12] = "ReturnStatement";
    NodeType[NodeType["BreakStatement"] = 13] = "BreakStatement";
    NodeType[NodeType["FunctionCall"] = 14] = "FunctionCall";
    NodeType[NodeType["Max"] = 15] = "Max";
})(NodeType = exports.NodeType || (exports.NodeType = {}));
class TicoProgram {
    constructor(main) {
        this.mainBranch = main;
    }
    evaluateExpression(branch, node) {
        switch (node.type) {
            case NodeType.Literal: {
                return node.value;
            }
            case NodeType.BinaryExpression: {
                return this.evaluateBinaryExpression(branch, node);
            }
            case NodeType.NegateExpression: {
                return this.evaluateNegateExpression(branch, node);
            }
            case NodeType.IfExpression: {
                return this.evaluateIfExpression(branch, node);
            }
            case NodeType.WhileLoopExpression: {
                return this.evaluateWhileLoopExpression(branch, node);
            }
            case NodeType.ForLoopExpression: {
                return this.evaluateForLoopExpression(branch, node);
            }
            case NodeType.Set: {
                return this.evaluateSet(branch, node);
            }
            case NodeType.Identifier: {
                return this.evaluateIdentifier(branch, node).get();
            }
            case NodeType.FunctionExpression: {
                return this.evaluateFunctionCreate(branch, node);
            }
            case NodeType.ReturnStatement: {
                return this.evaluateReturnStatement(branch, node);
            }
            case NodeType.BreakStatement: {
                return this.evaluateBreakStatement(branch, node);
            }
            case NodeType.FunctionCall: {
                return this.evaluateFunctionCall(branch, node);
            }
            default: throw tokenizer_1.throwAtPos(node.line, node.column, `Not implemented`);
        }
    }
    evaluateBinaryExpression(branch, node) {
        const { left, operator, right } = node;
        let leftValue = this.evaluateExpression(branch, left);
        let rightValue = this.evaluateExpression(branch, right);
        const overload = (type) => {
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
        };
        switch (operator.type) {
            // Arithmetic
            case ticoTokenizer_1.TokenEnum.BinaryOpPlus: {
                const addOverload = overload('add');
                if (addOverload)
                    return addOverload(leftValue, rightValue);
                return leftValue + rightValue;
            }
            case ticoTokenizer_1.TokenEnum.BinaryOpMinus: {
                const subOverload = overload('sub');
                if (subOverload)
                    return subOverload(leftValue, rightValue);
                return leftValue - rightValue;
            }
            case ticoTokenizer_1.TokenEnum.BinaryOpStar: {
                const multOverload = overload('mult');
                if (multOverload)
                    return multOverload(leftValue, rightValue);
                return leftValue * rightValue;
            }
            case ticoTokenizer_1.TokenEnum.BinaryOpStarStar: {
                const powOverload = overload('pow');
                if (powOverload)
                    return powOverload(leftValue, rightValue);
                return leftValue ** rightValue;
            }
            case ticoTokenizer_1.TokenEnum.BinaryOpSlash: {
                const divOverload = overload('div');
                if (divOverload)
                    return divOverload(leftValue, rightValue);
                return leftValue / rightValue;
            }
            case ticoTokenizer_1.TokenEnum.BinaryOpSlashSlash: {
                const fdivOverload = overload('fdiv');
                if (fdivOverload)
                    return fdivOverload(leftValue, rightValue);
                return Math.floor(leftValue / rightValue);
            }
            case ticoTokenizer_1.TokenEnum.BinaryOpModulus: {
                const modOverload = overload('mod');
                if (modOverload)
                    return modOverload(leftValue, rightValue);
                return leftValue % rightValue;
            }
            case ticoTokenizer_1.TokenEnum.BinaryOpModulusModulus: {
                const modOverload = overload('mod');
                const addOverload = overload('add');
                if (modOverload) {
                    return modOverload(addOverload(modOverload(leftValue, rightValue), rightValue), rightValue);
                }
                return ((leftValue % rightValue) + rightValue) % rightValue;
            }
            // Conditional
            case ticoTokenizer_1.TokenEnum.ConditionalOpGreater: {
                const greaterOverload = overload('greater');
                if (greaterOverload)
                    return greaterOverload(leftValue, rightValue);
                return leftValue > rightValue;
            }
            case ticoTokenizer_1.TokenEnum.ConditionalOpLess: {
                const lesserOverload = overload('lesser');
                if (lesserOverload)
                    return lesserOverload(leftValue, rightValue);
                return leftValue < rightValue;
            }
            case ticoTokenizer_1.TokenEnum.ConditionalOpGreaterEqual: {
                const greaterOverload = overload('greater');
                const equalsOverload = overload('equals');
                if (greaterOverload && equalsOverload)
                    return greaterOverload(leftValue, rightValue) || equalsOverload(leftValue, rightValue);
                return leftValue >= rightValue;
            }
            case ticoTokenizer_1.TokenEnum.ConditionalOpLessEqual: {
                const lesserOverload = overload('lesser');
                const equalsOverload = overload('equals');
                if (lesserOverload && equalsOverload)
                    return lesserOverload(leftValue, rightValue) || equalsOverload(leftValue, rightValue);
                return leftValue <= rightValue;
            }
            case ticoTokenizer_1.TokenEnum.ConditionalOpEqual: {
                const equalsOverload = overload('equals');
                if (equalsOverload)
                    return equalsOverload(leftValue, rightValue);
                return leftValue === rightValue;
            }
            case ticoTokenizer_1.TokenEnum.ConditionalOpNotEqual: {
                const equalsOverload = overload('equals');
                if (equalsOverload)
                    return !equalsOverload(leftValue, rightValue);
                return leftValue !== rightValue;
            }
            case ticoTokenizer_1.TokenEnum.ConditionalAnd: {
                const andOverload = overload('and');
                if (andOverload)
                    return !andOverload(leftValue, rightValue);
                return leftValue && rightValue;
            }
            case ticoTokenizer_1.TokenEnum.ConditionalOr: {
                const orOverload = overload('or');
                if (orOverload)
                    return !orOverload(leftValue, rightValue);
                return leftValue || rightValue;
            }
            default: throw tokenizer_1.throwAtPos(operator.line, operator.column, `Not implemented`);
        }
    }
    evaluateNegateExpression(branch, node) {
        return !this.evaluateExpression(branch, node.expr);
    }
    evaluateIfExpression(branch, node) {
        const isTrue = this.evaluateExpression(branch, node.condition);
        if (isTrue) {
            node.parent = branch;
            node.functions = {};
            node.variables = {};
            return this.runBranch(node);
        }
        else if (node.next) {
            if (node.next.type === NodeType.ElseExpression) {
                const elseNode = node.next;
                elseNode.parent = branch;
                elseNode.functions = {};
                elseNode.variables = {};
                return this.runBranch(elseNode);
            }
            else if (node.next.type === NodeType.IfExpression) {
                return this.evaluateExpression(branch, node.next);
            }
        }
    }
    evaluateWhileLoopExpression(branch, node) {
        let currVal = undefined;
        let isTrue = this.evaluateExpression(branch, node.condition);
        while (isTrue) {
            node.parent = branch;
            node.variables = {};
            node.functions = {};
            currVal = this.runBranch(node);
            isTrue = this.evaluateExpression(branch, node.condition);
            if (node.stopped)
                break;
        }
        return currVal;
    }
    evaluateForLoopExpression(branch, node) {
        let currVal = undefined;
        this.evaluateExpression(branch, node.init);
        let isTrue = this.evaluateExpression(branch, node.condition);
        while (isTrue) {
            node.parent = branch;
            node.variables = {};
            node.functions = {};
            currVal = this.runBranch(node);
            this.evaluateExpression(branch, node.iterate);
            isTrue = this.evaluateExpression(branch, node.condition);
            if (node.stopped)
                break;
        }
        return currVal;
    }
    evaluateSet(branch, node) {
        const val = this.evaluateExpression(branch, node.value);
        const setget = this.evaluateIdentifier(branch, node.id);
        setget.set(val);
        return val;
    }
    evaluateIdentifier(branch, node) {
        let found = false;
        let obj = branch.variables;
        let key = '';
        if (node.type === NodeType.Identifier) {
            key = node.id.match[0];
            let b = branch;
            while (true) {
                obj = b.variables;
                if (obj[key] !== undefined) {
                    found = true;
                    break;
                }
                if (!b.parent) {
                    obj = this.variables;
                    if (obj[key] !== undefined)
                        found = true;
                    break;
                }
                b = b.parent;
            }
            if (!found)
                obj = branch.variables;
        }
        return {
            get() {
                //if (!found) throw throwAtPos(node.line, node.column, `Couldn't find identifier "${key}"`);
                if (!found)
                    return undefined;
                return obj[key];
            },
            set(v) {
                obj[key] = v;
            }
        };
    }
    evaluateFunctionCreate(branch, node) {
        this.evaluateFunction(branch, node.id).create(node);
    }
    evaluateReturnStatement(branch, node) {
        let b = branch;
        while (true) {
            b.stopped = true;
            if (b.type === NodeType.FunctionExpression)
                break;
            if (b.parent)
                b = b.parent;
            else
                break;
        }
        if (node.expression === null)
            return null;
        return this.evaluateExpression(branch, node.expression);
    }
    evaluateBreakStatement(branch, node) {
        let b = branch;
        while (true) {
            b.stopped = true;
            if (b.type === NodeType.WhileLoopExpression)
                break;
            if (b.parent)
                b = b.parent;
            else
                break;
        }
        return undefined;
    }
    evaluateFunctionCall(branch, node) {
        const f = this.evaluateFunction(branch, node.id);
        return f.call(node.args.map(v => this.evaluateExpression(branch, v)));
    }
    evaluateFunction(branch, node) {
        let found = false;
        let obj = branch.functions;
        let key = '';
        if (node.type === NodeType.Identifier) {
            key = node.id.match[0];
            let b = branch;
            while (true) {
                obj = b.functions;
                if (obj[key] !== undefined) {
                    found = true;
                    break;
                }
                if (!b.parent) {
                    obj = this.functions;
                    if (obj[key] !== undefined)
                        found = true;
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
            create(func) {
                if (found)
                    throw tokenizer_1.throwAtPos(node.line, node.column, `Identifier "${key}" already exists`);
                func.args.forEach(arg => {
                    if (arg.staticDefaultValue) {
                        arg.defaultValueEvaluated = self.evaluateExpression(branch, arg.defaultValueExpression);
                    }
                    else {
                        arg.defaultValueEvaluated = null;
                    }
                });
                func.parent = branch;
                obj[key] = func;
            },
            call(args) {
                if (!found)
                    throw tokenizer_1.throwAtPos(node.line, node.column, `Couldn't find identifer "${key}"`);
                const f = obj[key];
                if (typeof f === 'function') {
                    return f.apply(null, args);
                }
                else {
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
                            }
                            else {
                                f.variables[id] = self.evaluateExpression(branch, arg.defaultValueExpression);
                            }
                        }
                        else {
                            f.variables[id] = args[i];
                        }
                    }
                    return self.runBranch(f);
                }
            }
        };
    }
    runBranch(branch) {
        let retValue = undefined;
        for (const node of branch.children) {
            const v = this.evaluateExpression(branch, node);
            if (v !== undefined)
                retValue = v;
            if (branch.stopped)
                break;
        }
        return retValue;
    }
    run(variables = {}, functions = {}) {
        this.variables = {
            ...variables
        };
        this.functions = {
            'write': (what) => {
                return process.stdout.write(utils_1.unescapeString("" + what));
            },
            'writeLine': (what) => {
                return process.stdout.write(utils_1.unescapeString("" + what) + "\n");
            },
            'fg': (r, g, b) => {
                return process.stdout.write(utils_1.foreground([r, g, b]));
            },
            'fgReset': () => {
                return process.stdout.write(utils_1.foregroundReset());
            },
            'bg': (r, g, b) => {
                return process.stdout.write(utils_1.background([r, g, b]));
            },
            'bgReset': () => {
                return process.stdout.write(utils_1.backgroundReset());
            },
            'color': (r1, g1, b1, r2, g2, b2) => {
                return process.stdout.write(utils_1.foreground([r1, g1, b1]) + utils_1.background([r2, g2, b2]));
            },
            'colorReset': () => {
                return process.stdout.write(utils_1.foregroundReset() + utils_1.backgroundReset());
            },
            ...functions,
        };
        this.mainBranch.variables = {};
        this.mainBranch.functions = {};
        this.mainBranch.stopped = false;
        return this.runBranch(this.mainBranch);
    }
    static fromSourceCode(source) {
        const parser = new ticoParser_1.default();
        return new TicoProgram(parser.parse(source));
    }
}
exports.default = TicoProgram;
