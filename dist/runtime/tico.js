import TicoParser from "../language/ticoParser";
import { TokenEnum } from "../language/ticoTokenizer";
import { throwAtPos } from "../language/tokenizer";
import { foregroundReset, foreground, unescapeString, background, backgroundReset } from "../utils";
/**
 * Node type enum, contains all the node types used by Tico
 */
export var NodeType;
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
})(NodeType || (NodeType = {}));
function wait(ms = 0) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}
export default class TicoProgram {
    constructor(main) {
        this.mainBranch = main;
        this.execBatchMS = 15;
        this.waitMS = 0;
    }
    async evaluateExpression(branch, node) {
        if (Date.now() - this.execBatchStart > this.execBatchMS) {
            await wait(this.waitMS);
            this.execBatchStart = Date.now();
        }
        switch (node.type) {
            case NodeType.Literal: {
                return node.value;
            }
            case NodeType.BinaryExpression: {
                return await this.evaluateBinaryExpression(branch, node);
            }
            case NodeType.NegateExpression: {
                return await this.evaluateNegateExpression(branch, node);
            }
            case NodeType.IfExpression: {
                return await this.evaluateIfExpression(branch, node);
            }
            case NodeType.WhileLoopExpression: {
                return await this.evaluateWhileLoopExpression(branch, node);
            }
            case NodeType.ForLoopExpression: {
                return await this.evaluateForLoopExpression(branch, node);
            }
            case NodeType.Set: {
                return await this.evaluateSet(branch, node);
            }
            case NodeType.Identifier: {
                return (await this.evaluateIdentifier(branch, node)).get();
            }
            case NodeType.FunctionExpression: {
                return await this.evaluateFunctionCreate(branch, node);
            }
            case NodeType.ReturnStatement: {
                return await this.evaluateReturnStatement(branch, node);
            }
            case NodeType.BreakStatement: {
                return await this.evaluateBreakStatement(branch, node);
            }
            case NodeType.FunctionCall: {
                return await this.evaluateFunctionCall(branch, node);
            }
            default: throw throwAtPos(node.line, node.column, `Not implemented`);
        }
    }
    async evaluateBinaryExpression(branch, node) {
        const { left, operator, right } = node;
        let leftValue = await this.evaluateExpression(branch, left);
        let rightValue = await this.evaluateExpression(branch, right);
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
                    return modOverload(addOverload(modOverload(leftValue, rightValue), rightValue), rightValue);
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
    async evaluateNegateExpression(branch, node) {
        return !(await this.evaluateExpression(branch, node.expr));
    }
    async evaluateIfExpression(branch, node) {
        const isTrue = await this.evaluateExpression(branch, node.condition);
        if (isTrue) {
            node.parent = branch;
            node.functions = {};
            node.variables = {};
            return await this.runBranch(node);
        }
        else if (node.next) {
            if (node.next.type === NodeType.ElseExpression) {
                const elseNode = node.next;
                elseNode.parent = branch;
                elseNode.functions = {};
                elseNode.variables = {};
                return await this.runBranch(elseNode);
            }
            else if (node.next.type === NodeType.IfExpression) {
                return await this.evaluateExpression(branch, node.next);
            }
        }
    }
    async evaluateWhileLoopExpression(branch, node) {
        let currVal = undefined;
        let isTrue = await this.evaluateExpression(branch, node.condition);
        while (isTrue) {
            node.parent = branch;
            node.variables = {};
            node.functions = {};
            currVal = await this.runBranch(node);
            isTrue = await this.evaluateExpression(branch, node.condition);
            if (node.stopped)
                break;
        }
        return currVal;
    }
    async evaluateForLoopExpression(branch, node) {
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
            if (node.stopped)
                break;
        }
        return currVal;
    }
    async evaluateSet(branch, node) {
        const val = await this.evaluateExpression(branch, node.value);
        const setget = await this.evaluateIdentifier(branch, node.id);
        setget.set(val);
        return val;
    }
    async evaluateIdentifier(branch, node) {
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
    async evaluateFunctionCreate(branch, node) {
        const f = await this.evaluateFunction(branch, node.id);
        await f.create(node);
    }
    async evaluateReturnStatement(branch, node) {
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
        return await this.evaluateExpression(branch, node.expression);
    }
    async evaluateBreakStatement(branch, node) {
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
    async evaluateFunctionCall(branch, node) {
        const f = await this.evaluateFunction(branch, node.id);
        const mappedArgs = [];
        for (const arg of node.args) {
            mappedArgs.push(await this.evaluateExpression(branch, arg));
        }
        return await f.call(await Promise.all(mappedArgs));
    }
    async evaluateFunction(branch, node) {
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
            async create(func) {
                if (found)
                    throw throwAtPos(node.line, node.column, `Identifier "${key}" already exists`);
                for (const arg of func.args) {
                    if (arg.staticDefaultValue) {
                        arg.defaultValueEvaluated = await self.evaluateExpression(branch, arg.defaultValueExpression);
                    }
                    else {
                        arg.defaultValueEvaluated = null;
                    }
                }
                func.parent = branch;
                obj[key] = func;
            },
            async call(args) {
                if (!found)
                    throw throwAtPos(node.line, node.column, `Couldn't find identifer "${key}"`);
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
                                f.variables[id] = await self.evaluateExpression(branch, arg.defaultValueExpression);
                            }
                        }
                        else {
                            f.variables[id] = args[i];
                        }
                    }
                    return await self.runBranch(f);
                }
            }
        };
    }
    async runBranch(branch) {
        let retValue = undefined;
        for (const node of branch.children) {
            const v = await this.evaluateExpression(branch, node);
            if (v !== undefined)
                retValue = v;
            if (branch.stopped)
                break;
        }
        return retValue;
    }
    setExecBatchDuration(ms) {
        this.execBatchMS = ms;
    }
    setWaitDuration(ms) {
        this.waitMS = ms;
    }
    async run(variables = {}, functions = {}) {
        this.variables = {
            ...variables
        };
        this.functions = {
            'write': (what) => {
                return process.stdout.write(unescapeString("" + what));
            },
            'writeLine': (what) => {
                return process.stdout.write(unescapeString("" + what) + "\n");
            },
            'fg': (r, g, b) => {
                return process.stdout.write(foreground([r, g, b]));
            },
            'fgReset': () => {
                return process.stdout.write(foregroundReset());
            },
            'bg': (r, g, b) => {
                return process.stdout.write(background([r, g, b]));
            },
            'bgReset': () => {
                return process.stdout.write(backgroundReset());
            },
            'color': (r1, g1, b1, r2, g2, b2) => {
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
        return await this.runBranch(this.mainBranch);
    }
    static fromSourceCode(source) {
        const parser = new TicoParser();
        return new TicoProgram(parser.parse(source));
    }
}
