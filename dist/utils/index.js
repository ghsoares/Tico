/**
 * Global options for utils
 */
export const globalOptions = {
    tabIndentSize: 4
};
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
export function treefy(tree, options = {}) {
    /**
     * Default options destructuring
     */
    const { colors = true, indentSize = 2, titleColor = [fromHex("#00ff7f"), fromHex(null)], keyColor = [fromHex("#33daff"), fromHex(null)], arrowsColor = [fromHex("#ffffff"), fromHex(null)], numberColor = [fromHex("#ff9605"), fromHex(null)], bigIntColor = [fromHex("#c299ff"), fromHex(null)], stringColor = [fromHex("#FFCA68"), fromHex(null)], booleanColor = [fromHex("#ff516d"), fromHex(null)], nullColor = [fromHex("#FDDAEE"), fromHex(null)], undefinedColor = [fromHex("#FFC7CF"), fromHex(null)], } = options;
    /**
     * Apply foreground and background color to a string, if colors option is true
     * @param {string} str The string to be colorized
     * @param {[Color, Color]} c The foreground and background color be used
     * @returns {string} The colorized string
     */
    const applyColor = (str, c) => colors ? colorfy(str, c[0], c[1]) : str;
    /**
     * Arrows used for identation and better visualization of the tree
     */
    const arrows = [
        // Branch divide arrow
        applyColor("├", arrowsColor),
        // Branch end arrow
        applyColor("└", arrowsColor),
        // Branch connection arrow
        applyColor("│", arrowsColor),
        // Branch identation arrow
        applyColor("─".repeat(indentSize), arrowsColor)
    ];
    /**
     * Return a arrow of a type
     * @param {number} type The arrow type
     * @returns {string} The arrow string
     */
    const arrow = (type) => {
        switch (type) {
            case 0:
                return arrows[0] + arrows[3];
            case 1:
                return arrows[1] + arrows[3];
            case 2:
                return arrows[2];
        }
        return null;
    };
    /**
     * Applies identation in form of spaces
     * @param {number} lvl The tree level to be applied the identation
     * @returns {string} The identation string
     */
    const indent = (lvl) => " ".repeat(lvl * (indentSize + 1));
    /**
     * Applies connectio arrow
     * @param {string} str The string to be connected
     * @param {number} lvl Tree level
     * @param {boolean} skipFirst Skip first line
     * @returns {string} The connected string
     */
    const connect = (str, lvl, skipFirst = false) => {
        // Divides the string into lines
        const lines = str.split("\n");
        // Returns the lines mapped and joined by newline chracters
        return lines.map((line, idx) => {
            // If skipFirst is true and is the first line, just return it
            if (skipFirst && idx === 0)
                return line;
            // If isn't the last line apply the connection arrow
            if (idx < lines.length - 1) {
                // Calculate the position of the line to be replaced with a
                // connection arrow
                const p = lvl * (indentSize + 1);
                // Replace this position, but as strings can't be written in a index,
                // slice function is used
                line = line.slice(0, p) + arrow(2) + line.slice(p + 1);
            }
            // Return the connected line
            return line;
        }).join("\n");
    };
    /**
     * Recursive treefy function
     * @param {Object} obj The object to be treefied
     * @param {number} lvl The current tree level
     * @returns {string} The treefied string
     */
    const treefyRec = (obj, lvl) => {
        let str = "";
        str += applyColor(obj['title'] || 'Object', titleColor) + "\n";
        const keys = Object.keys(obj).filter(k => k !== 'title');
        const numKeys = keys.length;
        for (let i = 0; i < numKeys; i++) {
            const k = keys[i];
            const v = obj[k];
            if (i < numKeys - 1) {
                str += indent(lvl) + arrow(0);
            }
            else {
                str += indent(lvl) + arrow(1);
            }
            if (v !== null && typeof v === 'object') {
                let sss = "";
                if (Array.isArray(v)) {
                    str += applyColor(k, keyColor) + " []\n";
                    const len = v.length;
                    for (let j = 0; j < len; j++) {
                        let ss = indent(lvl + 1);
                        if (j < len - 1) {
                            ss += arrow(0);
                        }
                        else {
                            ss += arrow(1);
                        }
                        if (v[j] !== null && typeof v[j] === 'object') {
                            ss += treefyRec(v[j], lvl + 2);
                        }
                        else {
                            let vs;
                            if (v[j] === null) {
                                vs = applyColor("null", nullColor);
                            }
                            else if (v[j] === undefined) {
                                vs = applyColor("undefined", undefinedColor);
                            }
                            else if (typeof v[j] === 'number') {
                                vs = applyColor(`${v[j]}`, numberColor);
                            }
                            else if (typeof v[j] === 'bigint') {
                                vs = applyColor(`BigInt(${v[j]})`, bigIntColor);
                            }
                            else if (typeof v[j] === 'string') {
                                vs = applyColor(`"${v[j]}"`, stringColor);
                            }
                            else if (typeof v[j] === 'boolean') {
                                vs = applyColor(v[j] ? "true" : "false", booleanColor);
                            }
                            ss += `${vs}\n`;
                        }
                        if (j < len - 1) {
                            ss = connect(ss, lvl + 1, true);
                        }
                        sss += ss;
                    }
                    if (i < numKeys - 1) {
                        sss = connect(sss, lvl);
                    }
                    str += sss;
                }
                else {
                    str += applyColor(k, keyColor) + "\n";
                    let ss = indent(lvl + 1) + arrow(1);
                    ss += treefyRec(v, lvl + 2);
                    if (i < numKeys - 1) {
                        ss = connect(ss, lvl);
                    }
                    str += ss;
                }
            }
            else {
                const ks = applyColor(k, keyColor);
                let vs = `${v}`;
                if (v === null) {
                    vs = applyColor("null", nullColor);
                }
                else if (v === undefined) {
                    vs = applyColor("undefined", undefinedColor);
                }
                else if (typeof v === 'number') {
                    vs = applyColor(`${v}`, numberColor);
                }
                else if (typeof v === 'bigint') {
                    vs = applyColor(`BigInt(${v})`, bigIntColor);
                }
                else if (typeof v === 'string') {
                    vs = applyColor(`"${v}"`, stringColor);
                }
                else if (typeof v === 'boolean') {
                    vs = applyColor(v ? "true" : "false", booleanColor);
                }
                str += `${ks}: ${vs}\n`;
            }
        }
        return str;
    };
    const s = treefyRec(tree, 0);
    return s.slice(0, s.length - 1);
}
/**
 * Returns foreground escape string
 * @param {Color} rgb The foreground color
 * @returns {string} The escaped string in ANSI format
 */
export function foreground(rgb) {
    let [r, g, b] = rgb;
    r = r < 0 ? 0 : r > 255 ? 255 : r;
    g = g < 0 ? 0 : g > 255 ? 255 : g;
    b = b < 0 ? 0 : b > 255 ? 255 : b;
    return `\x1b[38;2;${r};${g};${b}m`;
}
/**
 * Returns a foreground color reset escape string
 * @returns {string} The escaped string in ANSI format
 */
export function foregroundReset() {
    return `\x1b[37m`;
}
/**
 * Returns background escape string
 * @param {Color} rgb The background color
 * @returns {string} The escaped string in ANSI format
 */
export function background(rgb) {
    let [r, g, b] = rgb;
    r = r < 0 ? 0 : r > 255 ? 255 : r;
    g = g < 0 ? 0 : g > 255 ? 255 : g;
    b = b < 0 ? 0 : b > 255 ? 255 : b;
    return `\x1b[48;2;${r};${g};${b}m`;
}
/**
 * Returns a background color reset escape string
 * @returns {string} The escaped string in ANSI format
 */
export function backgroundReset() {
    return `\x1b[40m`;
}
/**
 * Applies foreground and background color to a string
 * @param {string} str The string to be colorized
 * @param {Color} fg The foreground color
 * @param {Color} bg The background color
 * @returns {string} The colorized string
 */
export function colorfy(str, fg, bg = null) {
    let ss = "";
    ss += foreground(fg);
    if (bg) {
        ss += background(bg);
    }
    ss += str;
    ss += foregroundReset();
    ss += backgroundReset();
    return ss;
}
/**
 * Converts a hex string to color
 * @param {string} hex A valid hex format color string
 * @returns {Color} The converted color
 */
export function fromHex(hex) {
    if (hex === null)
        return null;
    const m = (/#?([0-9a-fA-F]{1,2})([0-9a-fA-F]{1,2})([0-9a-fA-F]{1,2})/).exec(hex);
    if (m) {
        let [_, r, g, b] = m;
        return [
            parseInt(r, 16),
            parseInt(g, 16),
            parseInt(b, 16)
        ];
    }
    else {
        throw new Error(`Wrong format`);
    }
}
/**
 * Unescape characters in a string that are followed by "\\"
 * @param {string} str String to be unescaped
 * @returns {string} The unescaped string
 */
export function unescapeString(str) {
    // Replace basic escape characters
    str = str
        .replace(/\\'/g, "\'")
        .replace(/\\"/g, "\"")
        .replace(/\\\\/g, "\\")
        .replace(/\\n/g, "\n")
        .replace(/\\r/g, "\r")
        .replace(/\\b/g, "\b")
        .replace(/\\f/g, "\f")
        .replace(/\\v/g, "\v")
        .replace(/\\e/g, "\x1b")
        .replace(/\\0/g, "\0");
    // Hexadecimal characters
    str = str.replace(/\\x([0-9a-fA-F][0-9a-fA-F])/g, (match, d) => {
        return String.fromCharCode(parseInt(d, 16));
    });
    return str;
}
/**
 * Returns the line and column position at character position in a string
 * @param {string} str The string to be used
 * @param {number} pos The position in the range of the string length
 * @returns {[number, number]} Line and column of the cursor
 */
export function lineColumnFromString(str, pos) {
    let [line, column] = [0, -1];
    for (let i = 0; i <= pos; i++) {
        const c = str[i];
        if (c !== "\r")
            column += 1;
        if (c === "\t")
            column += globalOptions.tabIndentSize - 1;
        if (c === "\n") {
            line += 1;
            column = -1;
        }
    }
    return [line, column];
}
/**
 * Build an error at string position, with a preview of where is the error
 * @param {string} str The string to throw error
 * @param {string} pos The position of the error
 * @param {string} msg The error message
 * @returns {Error} The builded error
 */
export function buildErrorAtPos(str, pos, msg) {
    pos = Math.max(Math.min(pos, str.length - 1), 0);
    const [l, c] = lineColumnFromString(str, pos);
    msg = msg
        .replace(/\$line/g, "" + (l + 1))
        .replace(/\$column/g, "" + (c + 1));
    const lMin = Math.max(l - 3, 0);
    const cMin = Math.max(c - 10, 0);
    const cMax = c + 10;
    const lines = str.replace(/\t/g, '    ').split(/\r\n|\n/g).slice(lMin, l + 1);
    let cursorOffset = 0;
    const locationStr = lines.map((line, idx) => {
        let lineS = "";
        if (cMin > 0) {
            lineS += "... ";
            if (idx === 2)
                cursorOffset += 4;
        }
        lineS += line.slice(cMin, Math.min(cMax, line.length));
        if (cMax < line.length) {
            lineS += " ...";
        }
        const lineNumber = `${lMin + idx + 1}`.padEnd(6) + " | ";
        line = lineNumber + lineS;
        if (idx === 2)
            cursorOffset += lineNumber.length;
        return line;
    }).join("\n");
    cursorOffset += (c - cMin);
    const errMsg = msg + "\n\n" + locationStr + "\n" + " ".repeat(cursorOffset) + "^";
    const err = new Error();
    err.message = errMsg;
    return err;
}
/**
 * Throws an error at string position, with a preview of where is the error
 * @param {string} str The string to throw error
 * @param {string} pos The position of the error
 * @param {string} msg The error message
 */
export function throwErrorAtPos(str, pos, msg) {
    throw buildErrorAtPos(str, pos, msg);
}
