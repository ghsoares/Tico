/**
 * Color type, consists of rgb channels from 0-255
 */
export declare type Color = [number, number, number];
export declare type GlobalOptions = {
    tabIndentSize: number;
};
/**
 * Options for treefy function
 */
export declare type TreefyOptions = {
    /**
     * Apply colors for the tree?
     */
    colors?: boolean;
    /**
     * Indent for the arrows
     */
    indentSize?: number;
    /**
     * Colors [foreground, background] used for the arrows pointing to each property
     */
    arrowsColor?: [Color, Color];
    /**
     * Colors [foreground, background] used for the object title
     */
    titleColor?: [Color, Color];
    /**
     * Colors [foreground, background] used for a object property key
     */
    keyColor?: [Color, Color];
    /**
     * Colors [foreground, background] used for a number literal
     */
    numberColor?: [Color, Color];
    /**
     * Colors [foreground, background] used for a bigint literal
     */
    bigIntColor?: [Color, Color];
    /**
     * Colors [foreground, background] used for a string literal
     */
    stringColor?: [Color, Color];
    /**
     * Colors [foreground, background] used for a boolean literal
     */
    booleanColor?: [Color, Color];
    /**
     * Colors [foreground, background] used for a null value
     */
    nullColor?: [Color, Color];
    /**
     * Colors [foreground, background] used for a undefined value
     */
    undefinedColor?: [Color, Color];
};
export declare const globalOptions: GlobalOptions;
/**
 * Treefy function, turns recursively a object into a prettified tree
 * @example
 * const str = treefy({
 * 	title: "A object",
 * 	propA: 10,
 * 	probB: [ "apple", "grape"]
 * });
 *
 * console.log(str);
 * // Turns into:
 * // A object
 * // ├──propA: 10
 * // └──probB
 * //    └──Object
 * //       ├──"apple"
 * //       └──"grape"
 *
 * @param {Object} tree The actual object tree
 * @param {TreefyOptions} options Options to customize the output string
 * @returns {string} The treefied string
 */
export declare function treefy(tree: Object, options?: TreefyOptions): string;
/**
 * Returns foreground escape string
 * @param {Color} rgb The foreground color
 * @returns {string} The escaped string in ANSI format
 */
export declare function foreground(rgb: Color): string;
/**
 * Returns a foreground color reset escape string
 * @returns {string} The escaped string in ANSI format
 */
export declare function foregroundReset(): string;
/**
 * Returns background escape string
 * @param {Color} rgb The background color
 * @returns {string} The escaped string in ANSI format
 */
export declare function background(rgb: Color): string;
/**
 * Returns a background color reset escape string
 * @returns {string} The escaped string in ANSI format
 */
export declare function backgroundReset(): string;
/**
 * Applies foreground and background color to a string
 * @param {string} str The string to be colorized
 * @param {Color} fg The foreground color
 * @param {Color} bg The background color
 * @returns {string} The colorized string
 */
export declare function colorfy(str: string, fg: Color, bg?: Color): string;
/**
 * Converts a hex string to color
 * @param {string} hex A valid hex format color string
 * @returns {Color} The converted color
 */
export declare function fromHex(hex: string): Color;
/**
 * Unescape characters in a string that are followed by "\\"
 * @param {string} str String to be unescaped
 * @returns {string} The unescaped string
 */
export declare function unescapeString(str: string): string;
/**
 * Returns the line and column position at character position in a string
 * @param {string} str The string to be used
 * @param {number} pos The position in the range of the string length
 * @returns {[number, number]} Line and column of the cursor
 */
export declare function lineColumnFromString(str: string, pos: number): [number, number];
/**
 * Throws an error at string position, with a preview of where is the error
 * @param {string} str The string to throw error
 * @param {string} pos The position of the error
 * @param {string} msg The error message
 */
export declare function throwErrorAtPos(str: string, pos: number, msg: string): void;
