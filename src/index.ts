import TicoParser from "./language/ticoParser";
import fs from "fs";
import TicoProgram from "./runtime/tico";

const source = fs.readFileSync('src/test.tico', 'utf-8').replace(/\r\n/g, '\n');
const program = new TicoProgram(source);

program.run().then(val => console.log(val));