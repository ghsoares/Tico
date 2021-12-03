import TicoParser from "./language/ticoParser";
import fs from "fs";

const source = fs.readFileSync("src/test.tico", "utf-8");

const start = Date.now();

const parser = new TicoParser();
parser.parse(source);

const elapsed = Date.now() - start;

console.log(`Elapsed: ${elapsed} ms`);