import {bnfGrammarString, bnfGrammar} from "../bnf_grammar";
import {BNFLexer, Token} from "../bnf_lexer";
import {isEqual} from "lodash";
import {ParserBuilder} from "../../common/parser_builder";
import * as fs from "fs";

export function main() {
    const tokensStream: Token[] = [];
    const tokenSet: Token[] = [];
    const bnfLexer = new BNFLexer();
    bnfLexer.setString(bnfGrammarString);
    while(!bnfLexer.isEmpty()) {
        const token = bnfLexer.getNextToken();
        tokensStream.push(token);
        if (tokenSet.some(item => isEqual(item, token))) {
            continue;
        }
        tokenSet.push(token);
    }
    console.log("Tokens stream: %o", tokensStream);
    console.log("Tokens set: %o", tokenSet);

    let syntaxParser = new ParserBuilder(bnfGrammar);
    syntaxParser.buildCannonicalCollection(tokenSet);
    const actionTable = syntaxParser.getActionTable();
    const gotoTable = syntaxParser.getGotoTable(tokenSet.filter(item => item.type === "no-terminal"));

    console.log("Action table: %o", actionTable);
    console.log("Goto table: %o", gotoTable);

    const result = {
        "tokens": tokenSet,
        "actionTable": actionTable,
        "gotoTable": gotoTable,
    };
    fs.writeFile("tables.json", JSON.stringify(result), (err) => {
        console.log(err);
    });

}

main();
