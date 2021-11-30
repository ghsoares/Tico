
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

export function iota(reset: boolean = false): number;

export function treefy(tree: Object, options: TreefyOptions): string;

export function foreground(rgb: Color): string;

export function foregroundReset(): string;

export function background(rgb: Color): string;

export function backgroundReset(): string;

export function colorfy(str: string, fg: Color, bg: Color): string;

export function fromHex(hex: string): Color;

export function unescapeString(str: string): String;

export function getType(v: any): string;


