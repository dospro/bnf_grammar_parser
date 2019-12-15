import {main} from "./parser_builder/main";
import * as fs from "fs";

console.log("Grammar Parser v1");


function load_bnf_file(filename) {
    fs.readFile(filename, "utf-8", (error, data) => {
        if (!error)
            throw error;

        let tokenizer = new lexic.StateMachine();
        tokenizer.setString(data);
        while (!tokenizer.isEmpty()) {
            console.log("Token: %o", tokenizer.getNextToken());
        }
    });
}

main();



