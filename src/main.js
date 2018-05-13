"use strict";
const fs = require("fs");
const utils = require("./utils");
const lexic = require("./lexicParser");
const syntax = require("./syntaxParser");
const grammars = require("./tests/testGrammars");
const bnfParser = require("./grammar_parser");


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

bnfParser.main();



