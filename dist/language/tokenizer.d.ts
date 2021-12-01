export declare type TokenDefinition = {
    type: any;
    regex: RegExp;
    ignore: boolean;
};
export declare type Token = {
    type: any;
    match: RegExpMatchArray;
    start: number;
    end: number;
    line: number;
    column: number;
};
export declare function throwAtPos(line: number, column: number, msg: string): SyntaxError;
/**
 * Main tokenizer class, takes multiple token definitions with it's type and regex and tokenizes
 * a source string into tokens.
 */
export default class Tokenizer {
    /**
     * Skips tokens to be ignored, turn this off if want to use these ignored tokens for
     * syntax highlighting, for example
     */
    skipIgnore: boolean;
    /**
     * Array containing all token definitions, identified by it's type and contains regex expression and
     * ignore flag.
     */
    private tokenDefs;
    /**
     * The current source being tokenized
     */
    private source;
    /**
     * The length of the current source being tokenized
     */
    private sourceLength;
    /**
     * The source string cursor, points at a character on the position of this cursor
     */
    private cursor;
    /**
     * All the tokens from the tokenization step
     */
    private tokens;
    /**
     * Total number of tokens from the tokenization step
     */
    private numTokens;
    /**
     * Cursor that points at a token
     */
    private tokenCursor;
    constructor();
    /**
     * Adds a token definition
     * @param {any} type - The type of the token, can be any type of value
     * @param {RegExp} regex - The regex expression used to tokenize this token
     * @param {boolean} [ignore=false] - Should this token be ignored? Use this for whitespaces or comments
     */
    addTokenDefinition(type: any, regex: RegExp, ignore?: boolean): void;
    /**
     * Initializes the tokenization step
     * @param {string} source - The actual source code used to tokenize
     */
    private init;
    /**
     * Is the tokenization step reached EOF?
     * @returns {boolean} Reached EOF?
     */
    private EOF;
    /**
     * Gets the next token from the source string cursor
     * @returns {Token} The next token
     */
    private getNextToken;
    /**
     * Gets additional cursor information at position
     * @param {number} pos - The cursor position
     * @returns {[number, number]} Line and column of the cursor
     */
    getCursorInfo(pos: number): [number, number];
    /**
     * Main tokenization function, tokenizes the entire source string
     * @param {string} str - The source string
     */
    tokenize(str: string): void;
    /**
     * Returns the current token cursor position
     * @returns {number} position
     */
    tkCursor(): number;
    /**
     * Returns the current token that matches the type or null if it don't match.
     * If it matches, it advances to the next token
     * @param {any} type - The token type to match
     * @returns {Token} The current token or null
     */
    tk(type: any): Token;
    /**
     * Returns the current token
     * @returns {Token} The current token
     */
    currTk(): Token;
    /**
     * Go back one pos of the token cursor
     */
    tkBack(): void;
    /**
     * Returns the token position to the position provided
     * @param {number} pos - The position to return
     * @returns {null}
     */
    tkRet(pos: number): null;
    /**
     * Throws the error message at the current token position
     * @param {string} msg - The error message
     */
    tkThrowErr(msg: string): void;
    /**
     * Gets the number of tokens left to use
     * @returns {number} The number of left tokens
     */
    tokensLeft(): number;
    /**
     * Returns a copy of the tokenized tokens
     * @returns {Token[]} The array of tokens copy
     */
    getTokens(): Token[];
    sourceSubstr(start: number, end: number): string;
}
