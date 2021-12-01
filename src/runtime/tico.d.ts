declare type TicoVariables = { [key: string]: any };
declare type TicoFunctions = { [key: string]: (...args: any[]) => any };

declare class TicoProgram {
	private mainBranch: Object;
	private variables: TicoVariables;
	private functions: TicoFunctions;

	public constructor(main: Object);

	private evaluateExpression(branch: Object, node: Object): any;
	private evaluateBinaryExpression(branch: Object, node: Object): any;
	private evaluateNegateExpression(branch: Object, node: Object): any;
	private evaluateIfExpression(branch: Object, node: Object): any;
	private evaluateWhileLoopExpression(branch: Object, node: Object): any;
	private evaluateForLoopExpression(branch: Object, node: Object): any;
	private evaluateSet(branch: Object, node: Object): any;
	private evaluateIdentifier(branch: Object, node: Object): any;
	private evaluateFunctionCreate(branch: Object, node: Object): any;
	private evaluateReturnStatement(branch: Object, node: Object): any;
	private evaluateBreakStatement(branch: Object, node: Object): any;
	private evaluateFunctionCall(branch: Object, node: Object): any;
	private evaluateFunction(branch: Object, node: Object): any;

	private runBranch(branch: Object): any;

	public run(variables: TicoVariables, functions: TicoFunctions): any;

	public static fromSourceCode(source: string): TicoProgram;
}

export default TicoProgram;