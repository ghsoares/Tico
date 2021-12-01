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
    line: number;
    column: number;
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
export declare type BinaryExpressionNode = {
    left: Node;
    operator: Token;
    right: Node;
} & Node;
export declare type NegateExpressionNode = {
    expr: Node;
} & Node;
export declare type IfExpressionNode = {
    condition: Node;
    next?: Node;
} & BranchNode;
export declare type ElseExpressionNode = {} & BranchNode;
export declare type WhileLoopExpressionNode = {
    condition: Node;
} & BranchNode;
export declare type ForLoopExpressionNode = {
    init: Node;
    condition: Node;
    iterate: Node;
} & BranchNode;
export declare type LiteralNode = {
    value: any;
    raw: Token;
} & Node;
export declare type IdentifierNode = {
    id: Token;
} & Node;
export declare type SetNode = {
    id: IdentifierNode;
    value: Node;
} & Node;
export declare type FunctionArgNode = {
    id: IdentifierNode;
    defaultValueExpression: Node;
    defaultValueEvaluated?: any;
    staticDefaultValue: boolean;
} & Node;
export declare type FunctionExpressionNode = {
    id: IdentifierNode;
    args: FunctionArgNode[];
} & BranchNode;
export declare type ReturnStatementNode = {
    expression: Node;
} & Node;
export declare type BreakStatementNode = {} & Node;
export declare type FunctionCallNode = {
    id: IdentifierNode;
    args: Node[];
} & Node;
export declare type SetterGetterValue = {
    set(val: any): void;
    get(): any;
};
export declare type FunctionValue = {
    create(branch: BranchNode): void;
    call(args: Node[]): any;
};
export default class TicoProgram {
    private mainBranch;
    private variables;
    private functions;
    constructor(main: BranchNode);
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
    run(variables?: {
        [key: string]: any;
    }, functions?: {
        [key: string]: (...args: any[]) => any;
    }): any;
    static fromSourceCode(source: string): TicoProgram;
}
