import { throwErrorAtPos } from "../utils";
/**
 * Main tokenizer class, takes multiple token definitions with it's type and regex and tokenizes
 * a source string into tokens.
 */
export default class Tokenizer {
    constructor() {
        this.tokenDefs = {};
        this.source = "";
        this.sourceLength = 0;
        this.cursor = 0;
        this.skipIgnore = true;
    }
    /**
     * Adds a token definition
     * @param {TokenType} type The type of the token, can be any type of value
     * @param {string} regexes A array of expressions to be used
     * @param {boolean} [ignore=false] Should this token be ignored? Use this for whitespaces or comments
     */
    addTokenDefinition(type, regexes, ignore = false) {
        let regStr = "";
        const numExpressions = regexes.length;
        if (numExpressions === 0)
            throw new Error(`Can't provide 0 expressions for a token definition`);
        if (numExpressions === 1) {
            regStr += regexes[0].source;
        }
        else {
            for (let i = 0; i < numExpressions; i++) {
                regStr += "(?:";
                regStr += regexes[i].source;
                regStr += ")";
                if (i < numExpressions - 1)
                    regStr += "|";
            }
        }
        this.tokenDefs[type] = { type, regex: regStr, ignore };
    }
    /**
     * Returns if the tokenizer is at end of file
     * @returns {boolean}
     */
    eof() { return this.cursor >= this.sourceLength; }
    /**
     * Compiles the regex combining all the token definitions, for a better performance
     */
    compileRegex() {
        let regStr = "^(?:";
        const definitions = Object.values(this.tokenDefs);
        const numDefinitions = definitions.length;
        for (let i = 0; i < numDefinitions; i++) {
            const def = definitions[i];
            regStr += `(?<tk${def.type}>`;
            regStr += def.regex;
            regStr += ")";
            if (i < numDefinitions - 1) {
                regStr += "|";
            }
        }
        regStr += ")";
        this.compiledRegex = new RegExp(regStr);
    }
    /**
     * Initializes the tokenizer
     * @param {string} source The actual source code to be tokenized
     */
    init(source) {
        this.source = source;
        this.sourceLength = source.length;
        this.cursor = 0;
        this.tokens = [];
        this.numTokens = 0;
        this.tkCursor = 0;
        this.compileRegex();
    }
    /**
     * Get more info about a match
     * @param {RegExpExecArray} match The expression match to grab infp
     * @returns {[TokenDefinition, string[]]} The token type, groups and token definition
     */
    getMatchInfo(match) {
        let groups = Object.keys(match.groups);
        let numGroups = groups.length;
        let type = null;
        for (let i = 0; i < numGroups; i++) {
            if (match.groups[groups[i]] !== undefined) {
                if (type === null) {
                    type = Number(groups[i].slice(2));
                }
            }
        }
        if (type === null)
            throw new Error(`Couldn't find type`);
        const matchGroups = match.slice(1).filter(value => value !== undefined);
        return [this.tokenDefs[type], matchGroups];
    }
    /**
     * Gets the next token at cursor pos
     * @returns {Token} The next token
     */
    next() {
        // Match string after the cursor pos
        const str = this.source.slice(this.cursor);
        // Get a match from the compiled regex
        const match = this.compiledRegex.exec(str);
        // Matched token
        let tk = null;
        // Found something
        if (match) {
            // Grab info about matched string
            const [def, groups] = this.getMatchInfo(match);
            // This token should be ignored
            if (def.ignore && this.skipIgnore) {
                // Walk forward the cursor
                this.cursor += match[0].length;
                // Get the next token instead
                tk = this.next();
                // Build the token
            }
            else {
                tk = {
                    type: def.type,
                    match: groups,
                    start: this.cursor,
                    end: this.cursor + match[0].length
                };
                // Walk forward the cursor
                this.cursor += match[0].length;
            }
            // Didn't found something
        }
        else {
            // Found a invalid cahracter, return a invalid token
            if (!this.eof()) {
                // Try to get a somewhat relevant token, by matching word
                let tkGet = (/^\w+/).exec(str);
                // Else return a character
                if (tkGet === null) {
                    tkGet = (/^./).exec(str);
                }
                tk = {
                    type: Tokenizer.INVALID,
                    match: tkGet,
                    start: this.cursor,
                    end: this.cursor + tkGet[0].length
                };
                // Walk forward the cursor
                this.cursor += tkGet[0].length;
                // Reached EOF of the string
            }
            else {
                // Return a EOF token
                tk = {
                    type: Tokenizer.EOF,
                    match: null,
                    start: this.cursor,
                    end: this.cursor,
                };
            }
        }
        return tk;
    }
    /**
     * Tokenizes a source string
     * @param {string} source The actual source code to be tokenized
     */
    tokenize(source) {
        this.init(source);
        while (true) {
            const tk = this.next();
            this.tokens.push(tk);
            this.numTokens++;
            if (tk.type === Tokenizer.EOF)
                break;
        }
    }
    /**
     * Returns the current token position
     * @returns {number} The token position
     */
    csr() { return this.tkCursor; }
    /**
     * Returns the current token that matches the type or null if it don't match.
     * If it matches, it advances to the next token
     * @param {any} type The token type to match
     * @returns {Token} The current token or null
     */
    tk(type, goForward = true) {
        const currTk = this.tokens[this.tkCursor];
        if (currTk.type === type) {
            if (goForward)
                this.tkCursor += 1;
            return currTk;
        }
        return null;
    }
    /**
     * Just returns the current token and advances to the next token
     * @returns {Token} The current token
     */
    tkNext() {
        return this.tokens[this.tkCursor++];
    }
    /**
     * Returns if the current token is eof
     * @returns {boolean} Is eof?
     */
    tkEof() { return this.tokens[this.tkCursor].type === Tokenizer.EOF; }
    /**
     * Returns the token position to the position provided
     * @param {number} pos The position to return to
     * @returns {null}
     */
    tkRet(pos) { this.tkCursor = pos; return null; }
    /**
     * Throws the error message at the current token position
     * @param {string} msg The error message
     */
    throwErr(msg) {
        throwErrorAtPos(this.source, this.tokens[this.tkCursor].start, `At ($line:$column) : ${msg}`);
    }
    /**
     * Throws a unexpected token error
     * @param {string} msg The error message
     */
    unexpectedTokenErr(msg) {
        const str = this.source.slice(this.tokens[this.tkCursor].start);
        // Try to get a somewhat relevant token, by matching word
        let tkGet = (/^\w+/).exec(str);
        // Else return the character
        if (tkGet === null) {
            tkGet = (/^./).exec(str);
        }
        msg = msg.replace(/\$tk/g, tkGet[0]);
        this.throwErr(msg);
    }
    /**
     * Returns a substring of the source string providing the start and end positions
     * @param {number} start Substring start
     * @param {number} end Substring end
     * @returns {string} The source substring
     */
    sourceSubstr(start, end) { return this.source.slice(start, end); }
}
/**
 * EOF type token
 */
Tokenizer.EOF = -1;
/**
 * Invalid type token
 */
Tokenizer.INVALID = -2;
