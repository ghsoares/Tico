
declare type Color = [number, number, number];

declare type TreefyOptions = {
	colors?: boolean;
	indentSize?: number;

	titleColor?: [Color, Color],
	keyColor?: [Color, Color],
	arrowsColor?: [Color, Color],
	numberColor?: [Color, Color],
	bigIntColor?: [Color, Color],
	stringColor?: [Color, Color],
	booleanColor?: [Color, Color]
};

declare function iota(reset: boolean): number;

declare function treefy(tree: Object, options: TreefyOptions): string;

declare function foreground(rgb: Color): string;

declare function foregroundReset(): string;

declare function background(rgb: Color): string;

declare function backgroundReset(): string;

declare function colorfy(str: string, fg: Color, bg: Color): string;

declare function fromHex(hex: string): Color;

declare function unescapeString(str: string): String;

declare function getType(v: any): string;

export {
	Color,
	TreefyOptions,
	iota,
	treefy,
	foreground,
	foregroundReset,
	background,
	backgroundReset,
	colorfy,
	fromHex,
	unescapeString,
	getType
}