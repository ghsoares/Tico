import Tokenizer from "./tokenizer";
export declare enum TokenEnum {
    IgnoreMin = 0,
    IgnoreMultilineComment = 1,
    IgnoreComment = 2,
    IgnoreWhitespace = 3,
    IgnoreMax = 4,
    KeywordMin = 5,
    KeywordFunction = 6,
    KeywordReturn = 7,
    KeywordIf = 8,
    KeywordElse = 9,
    KeywordElif = 10,
    KeywordWhile = 11,
    KeywordFor = 12,
    KeywordBreak = 13,
    KeywordMax = 14,
    LiteralMin = 15,
    LiteralBigInt = 16,
    LiteralNumber = 17,
    LiteralString = 18,
    LiteralBoolean = 19,
    LiteralNull = 20,
    LiteralUndefined = 21,
    LiteralMax = 22,
    BinaryOpMin = 23,
    BinaryOpStarStar = 24,
    BinaryOpSlashSlash = 25,
    BinaryOpModulusModulus = 26,
    BinaryOpPlus = 27,
    BinaryOpMinus = 28,
    BinaryOpStar = 29,
    BinaryOpSlash = 30,
    BinaryOpModulus = 31,
    BinaryOpMax = 32,
    ConditionalOpMin = 33,
    ConditionalOpGreaterEqual = 34,
    ConditionalOpLessEqual = 35,
    ConditionalOpNotEqual = 36,
    ConditionalOpGreater = 37,
    ConditionalOpLess = 38,
    ConditionalOpEqual = 39,
    ConditionalAnd = 40,
    ConditionalOr = 41,
    ConditionalOpMax = 42,
    SymbolMin = 43,
    SymbolEquals = 44,
    SymbolParOpen = 45,
    SymbolParClose = 46,
    SymbolCurlyBracketOpen = 47,
    SymbolCurlyBracketClose = 48,
    SymbolBracketOpen = 49,
    SymbolBracketClose = 50,
    SymbolComma = 51,
    SymbolExclamationMark = 52,
    SymbolSemicolon = 53,
    SymbolMax = 54,
    ExtraMin = 55,
    ExtraIdentifier = 56,
    ExtraMax = 57
}
export default class TicoTokenizer extends Tokenizer {
    constructor();
    private addKeywords;
    private addLiterals;
    private addBinaryOps;
    private addConditionalOps;
    private addSymbols;
    private addExtra;
    throwErr(msg: string): void;
}
