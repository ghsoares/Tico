import TicoProgram from "../runtime/tico";
import Tokenizer from "./tokenizer";

declare class TicoParser {
	private tokenizer: Tokenizer;

	private literal(): Object;
	private identifier(): Object;
	private functionCallArgs(): Object;
	private functionCall(): Object;
	private wrappedExpression(): Object;
	private negateExpression(): Object;
	private expressionMember(): Object;
	private binaryExpressionRecursive(left: Object): Object;
	private binaryExpression(): Object;
	private ifExpression(): Object;
	private elseExpression(): Object;
	private elifExpression(): Object;
	private whileLoopExpression(): Object;
	private forExpression(): Object;
	private variableSet(): Object;
	private functionExpressionArgs(): Object;
	private functionExpression(): Object;
	private returnStatement(): Object;
	private breakStatement(): Object;
	private expression(): Object;
	private branch(): Object;
	private mainBranch(): Object;

	public parse(source: string): Object;

	public static stringify(node: Object, options, treefyOptions): TicoProgram;
}

export default TicoParser;