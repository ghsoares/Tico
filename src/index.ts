import TicoParser from "./language/ticoParser";
import fs from "fs";
import TicoProgram from "./runtime/tico";

const prog = new TicoProgram(`writeLine('aa');`);

prog.run().then(val => console.log(val));