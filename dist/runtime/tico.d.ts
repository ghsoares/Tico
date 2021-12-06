import { Token } from "../language/tokenizer";
/**
 * Node type enum, contains all the node types used by Tico
 */
export declare enum NodeType {
    Branch = 0,
    BinaryExpression = 1,
    NegateExpression = 2,
    IfExpression = 3,
    ElseExpression = 4,
    WhileLoopExpression = 5,
    ForLoopExpression = 6,
    Literal = 7,
    Identifier = 8,
    Set = 9,
    FunctionArg = 10,
    FunctionExpression = 11,
    ReturnStatement = 12,
    BreakStatement = 13,
    FunctionCall = 14,
    Max = 15
}
/**
 * Basic node type, contains the type, start and end pos, line and column
 */
export declare type Node = {
    type: NodeType;
    start: number;
    end: number;
};
/**
 * Branch node type, one of the main nodes that divides the program into scopes
 */
export declare type BranchNode = {
    parent: BranchNode;
    children: Node[];
    variables?: {
        [key: string]: any;
    };
    functions?: {
        [key: string]: FunctionExpressionNode;
    };
    stopped?: boolean;
} & Node;
/**
 * Binary expression node type, allowing recursive expression calculation
 */
export declare type BinaryExpressionNode = {
    left: Node;
    operator: Token;
    right: Node;
} & Node;
/**
 * Negate expression node type, negates the value from the expression
 */
export declare type NegateExpressionNode = {
    expr: Node;
} & Node;
/**
 * If expression node type, evaluates the condition and
 * run the branch or next branch if any
 */
export declare type IfExpressionNode = {
    condition: Node;
    next?: Node;
} & BranchNode;
/**
 * Else expression node type, this branch is run if the previous
 * if/elif node condition were false
 */
export declare type ElseExpressionNode = {} & BranchNode;
/**
 * While loop expression node type, keeps running this branch while
 * the condition is true
 */
export declare type WhileLoopExpressionNode = {
    condition: Node;
} & BranchNode;
/**
 * For loop expression node type, run the init node expression,
 * keeps running while the condition is true and run the iterate node expression
 */
export declare type ForLoopExpressionNode = {
    init: Node;
    condition: Node;
    iterate: Node;
} & BranchNode;
/**
 * Literal node type, stores the raw and the value of the literal
 */
export declare type LiteralNode = {
    value: any;
    raw: Token;
} & Node;
/**
 * Identifier node type, stores the id literal of a variable,
 * searches for the id in the current scope or any of it's parent scopes.
 */
export declare type IdentifierNode = {
    id: Token;
} & Node;
/**
 * Set node type, sets the identifier to the value expression
 */
export declare type SetNode = {
    id: IdentifierNode;
    value: Node;
} & Node;
/**
 * Function arg node, contains an individual argument of a function,
 * can contain a static or non-static default value expression
 */
export declare type FunctionArgNode = {
    id: IdentifierNode;
    defaultValueExpression: Node;
    defaultValueEvaluated?: any;
    staticDefaultValue: boolean;
} & Node;
/**
 * Function expression node, the main node to declare a function on runtime,
 * contains the id and the arguments
 */
export declare type FunctionExpressionNode = {
    id: IdentifierNode;
    args: FunctionArgNode[];
} & BranchNode;
/**
 * Return statement node, returns the expression from a function or exits the main
 * program early.
 */
export declare type ReturnStatementNode = {
    expression: Node;
} & Node;
/**
 * Break statement node, breaks a running loop
 */
export declare type BreakStatementNode = {} & Node;
/**
 * Function call node, calls a function identified by id and provides the argument expressions
 */
export declare type FunctionCallNode = {
    id: IdentifierNode;
    args: Node[];
} & Node;
export declare type SetterGetterValue = {
    set(val: any): void;
    get(): any;
};
export declare type FunctionValue = {
    create(branch: BranchNode): Promise<void>;
    call(args: Node[]): Promise<any>;
};
export declare type TicoVariables = {
    [key: string]: any;
};
export declare type TicoFunctions = {
    [key: string]: (...args: any[]) => any;
};
export default class TicoProgram {
    private sourceCode;
    private mainBranch;
    private variables;
    private functions;
    private execBatchStart;
    private execBatchMS;
    private waitMS;
    private stdoutBuffer;
    private stderrBuffer;
    private onStdout;
    private onStderr;
    private running;
    private paused;
    constructor(sourceCode: string);
    private throwError;
    private evaluateExpression;
    private evaluateBinaryExpression;
    private evaluateNegateExpression;
    private evaluateIfExpression;
    private evaluateWhileLoopExpression;
    private evaluateForLoopExpression;
    private evaluateSet;
    private evaluateIdentifier;
    private evaluateFunctionCreate;
    private evaluateReturnStatement;
    private evaluateBreakStatement;
    private evaluateFunctionCall;
    private evaluateFunction;
    private runBranch;
    private flushStdBuffers;
    setExecBatchDuration(ms: number): void;
    setWaitDuration(ms: number): void;
    setStdout(callback: (what: any) => any): void;
    setStderr(callback: (what: any) => any): void;
    run(variables?: TicoVariables, functions?: TicoFunctions): Promise<any>;
    stop(): void;
    pause(): void;
    resume(): void;
}
