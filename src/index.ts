import TicoParser from "./language/ticoParser";
import fs from "fs";
import TicoProgram from "./runtime/tico";

const source = fs.readFileSync('examples/pi.tico', 'utf-8');
const program = new TicoProgram(source);

program.run().then(val => console.log(val));