import { lineColumnFromString } from "../utils";
export function throwAtPos(line, column, msg) {
    const e = new SyntaxError(`At line ${line + 1} column ${column + 1}: ${msg}`);
    return e;
}
/**
 * Main tokenizer class, takes multiple token definitions with it's type and regex and tokenizes
 * a source string into tokens.
 */
export default class Tokenizer {
    constructor() {
        this.skipIgnore = true;
        this.tokenDefs = [];
        this.source = "";
        this.sourceLength = 0;
        this.cursor = 0;
    }
    /**
     * Adds a token definition
     * @param {any} type - The type of the token, can be any type of value
     * @param {RegExp} regex - The regex expression used to tokenize this token
     * @param {boolean} [ignore=false] - Should this token be ignored? Use this for whitespaces or comments
     */
    addTokenDefinition(type, regex, ignore = false) {
        regex = new RegExp(`^${regex.source}`);
        this.tokenDefs.push({ type, regex, ignore });
    }
    /**
     * Initializes the tokenization step
     * @param {string} source - The actual source code used to tokenize
     */
    init(source) {
        this.source = source;
        this.sourceLength = source.length;
        this.cursor = 0;
        this.tokens = [];
        this.numTokens = 0;
        this.tokenCursor = 0;
    }
    /**
     * Is the tokenization step reached EOF?
     * @returns {boolean} Reached EOF?
     */
    EOF() {
        return this.cursor >= this.sourceLength;
    }
    /**
     * Gets the next token from the source string cursor
     * @returns {Token} The next token
     */
    getNextToken() {
        // Let's tokenize from the cursor position
        const str = this.source.slice(this.cursor);
        let tk = null;
        // Token should be ignored?
        let tkIgnore = false;
        // Go for each token definition, there should be a better way to do this
        for (const { type, regex, ignore } of this.tokenDefs) {
            // Matched the regex in the sliced string
            const matched = regex.exec(str);
            if (matched) {
                // Set the matched object index to the cursor position
                matched.index = this.cursor;
                // Construct the token object
                const newToken = {
                    type,
                    match: matched,
                    start: this.cursor,
                    end: this.cursor + matched[0].length,
                    line: -1,
                    column: -1,
                };
                // Set the current matched token to this token
                // if current token is null or this token length is bigger
                // than the current token
                if (tk === null || newToken.match[0].length > tk.match[0].length) {
                    tk = newToken;
                    tkIgnore = ignore;
                }
            }
        }
        // A token was found
        if (tk !== null) {
            // Walk the cursor
            this.cursor += tk.match[0].length;
            // This token should be ignored, so get the next token
            if (tkIgnore && this.skipIgnore) {
                tk = this.getNextToken();
            }
            // A token wasn't found
        }
        else {
            // Found a invalid cahracter, return a invalid token
            if (!this.EOF()) {
                // Try to get a somewhat relevant token, by matching word
                let tkGet = (/^\w+/).exec(str);
                // Else return a character
                if (tkGet === null) {
                    tkGet = (/^./).exec(str);
                }
                tk = {
                    type: "INVALID",
                    match: tkGet,
                    start: this.cursor,
                    end: this.cursor + tkGet[0].length,
                    line: -1,
                    column: -1
                };
                // Walk the cursor
                this.cursor += tkGet[0].length;
                // Reached EOF of the string
            }
            else {
                // Return a EOF token
                tk = {
                    type: "EOF",
                    match: null,
                    start: this.cursor,
                    end: this.cursor,
                    line: -1,
                    column: -1
                };
            }
        }
        // Set the line and column of the token
        const [line, column] = lineColumnFromString(this.source, tk.start);
        tk.line = line;
        tk.column = column;
        return tk;
    }
    /**
     * Main tokenization function, tokenizes the entire source string
     * @param {string} str - The source string
     */
    tokenize(str) {
        // Initializes this tokenizer providing a string
        this.init(str);
        // Keeps tokenizing until reaches EOF
        while (true) {
            const tk = this.getNextToken();
            this.tokens.push(tk);
            this.numTokens++;
            // Reached EOF
            if (tk.type === "EOF")
                break;
        }
    }
    /**
     * Returns the current token cursor position
     * @returns {number} position
     */
    tkCursor() { return this.tokenCursor; }
    /**
     * Returns the current token that matches the type or null if it don't match.
     * If it matches, it advances to the next token
     * @param {any} type - The token type to match
     * @returns {Token} The current token or null
     */
    tk(type) {
        // Out of range, return null
        if (this.tokenCursor >= this.numTokens)
            return null;
        // If current token type is the same as the provided type, return it
        if (this.tokens[this.tokenCursor].type === type) {
            const tk = this.tokens[this.tokenCursor];
            // Walk the token cursor
            this.tokenCursor += 1;
            return tk;
        }
        return null;
    }
    /**
     * Returns the current token
     * @returns {Token} The current token
     */
    currTk() {
        return this.tokens[this.tokenCursor];
    }
    /**
     * Go back one pos of the token cursor
     */
    tkBack() { this.tokenCursor -= 1; }
    /**
     * Returns the token position to the position provided
     * @param {number} pos - The position to return
     * @returns {null}
     */
    tkRet(pos) { this.tokenCursor = pos; return null; }
    /**
     * Throws the error message at the current token position
     * @param {string} msg - The error message
     */
    tkThrowErr(msg) {
        const currTk = this.currTk();
        throw new SyntaxError(`At line ${currTk.line + 1} column ${currTk.column + 1}: ${msg}`);
    }
    /**
     * Gets the number of tokens left to use
     * @returns {number} The number of left tokens
     */
    tokensLeft() { return this.numTokens - this.tokenCursor; }
    /**
     * Returns a copy of the tokenized tokens
     * @returns {Token[]} The array of tokens copy
     */
    getTokens() { return [...this.tokens]; }
    /**
     * Returns a substring of the source string providing the start and end positions
     * @param {number} start Substring start
     * @param {number} end Substring end
     * @returns {string} The source substring
     */
    sourceSubstr(start, end) { return this.source.slice(start, end); }
}
