import TicoParser from "./language/ticoParser.js";



const parser = new TicoParser();
const main = parser.parse("1 + 2");
const ast = TicoParser.stringify(main);

console.log(ast);