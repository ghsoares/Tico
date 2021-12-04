import { BranchNode, Node } from "../runtime/tico";
import { TreefyOptions } from "../utils";
export declare type StringifyOptions = {
    indent?: string;
    showPosition?: boolean;
};
export default class TicoParser {
    private tokenizer;
    private literal;
    private identifier;
    private functionCallArgs;
    private functionCall;
    private wrappedExpression;
    private negateExpression;
    private expressionMember;
    private binaryExpressionRecursive;
    private binaryExpression;
    private ifExpression;
    private elseExpression;
    private elifExpression;
    private whileLoopExpression;
    private forExpression;
    private variableSet;
    private functionExpressionArgs;
    private functionExpression;
    private returnStatement;
    private breakStatement;
    private expression;
    private branch;
    private mainBranch;
    parse(source: string): BranchNode;
    static stringify(source: string, node: Node, options?: StringifyOptions, treefyOptions?: TreefyOptions): string;
}
