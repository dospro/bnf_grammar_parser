import {main} from "./parser_builder/main";
import * as fs from "fs";
import {BNFLexer} from "./parser_builder/bnf_lexer";

console.log("Grammar Parser v1");


/*function load_bnf_file(filename: string) {
    fs.readFile(filename, "utf-8", (error, data) => {
        if (!error)
            throw error;

        let tokenizer = new BNFLexer();
        tokenizer.setString(data);
        while (!tokenizer.isEmpty()) {
            console.log("Token: %o", tokenizer.getNextToken());
        }
    });
}*/

console.log("Calling main");
main();


