declare type TokenType = number;
export declare type Token = {
    type: TokenType;
    match: string[];
    start: number;
    end: number;
};
/**
 * Main tokenizer class, takes multiple token definitions with it's type and regex and tokenizes
 * a source string into tokens.
 */
export default class Tokenizer {
    /**
     * EOF type token
     */
    static EOF: number;
    /**
     * Invalid type token
     */
    static INVALID: number;
    /**
     * Object containing all token definitions
     */
    private tokenDefs;
    /**
     * Compiled global regex expression
     */
    private compiledRegex;
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
     * Array containing all the tokens tokenized
     */
    private tokens;
    /**
     * Number of tokens tokenized
     */
    private numTokens;
    /**
     * Token cursor
     */
    private tkCursor;
    constructor();
    /**
     * Adds a token definition
     * @param {TokenType} type The type of the token, can be any type of value
     * @param {string} regexes A array of expressions to be used
     * @param {boolean} [ignore=false] Should this token be ignored? Use this for whitespaces or comments
     */
    addTokenDefinition(type: TokenType, regexes: RegExp[], ignore?: boolean): void;
    /**
     * Returns if the tokenizer is at end of file
     * @returns {boolean}
     */
    private eof;
    /**
     * Compiles the regex combining all the token definitions, for a better performance
     */
    private compileRegex;
    /**
     * Initializes the tokenizer
     * @param {string} source The actual source code to be tokenized
     */
    private init;
    /**
     * Get more info about a match
     * @param {RegExpExecArray} match The expression match to grab infp
     * @returns {[TokenDefinition, string[]]} The token type, groups and token definition
     */
    private getMatchInfo;
    /**
     * Gets the next token at cursor pos
     * @returns {Token} The next token
     */
    private next;
    /**
     * Tokenizes a source string
     * @param {string} source The actual source code to be tokenized
     */
    tokenize(source: string): void;
    /**
     * Returns the current token position
     * @returns {number} The token position
     */
    csr(): number;
    /**
     * Returns the current token that matches the type or null if it don't match.
     * If it matches, it advances to the next token
     * @param {any} type The token type to match
     * @returns {Token} The current token or null
     */
    tk(type: TokenType, goForward?: boolean): Token;
    /**
     * Just returns the current token and advances to the next token
     * @returns {Token} The current token
     */
    tkNext(): Token;
    /**
     * Returns if the current token is eof
     * @returns {boolean} Is eof?
     */
    tkEof(): boolean;
    /**
     * Returns the token position to the position provided
     * @param {number} pos The position to return to
     * @returns {null}
     */
    tkRet(pos: number): null;
    /**
     * Throws the error message at the current token position
     * @param {string} msg The error message
     */
    throwErr(msg: string): void;
    /**
     * Throws a unexpected token error
     * @param {string} msg The error message
     */
    unexpectedTokenErr(msg: string): void;
    /**
     * Returns a substring of the source string providing the start and end positions
     * @param {number} start Substring start
     * @param {number} end Substring end
     * @returns {string} The source substring
     */
    sourceSubstr(start: number, end: number): string;
}
export {};
