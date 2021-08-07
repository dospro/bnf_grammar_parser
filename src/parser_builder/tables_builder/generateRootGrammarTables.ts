import {bnfGrammarString, bnfGrammar} from "../bnf_grammar";
import {BNFLexer, Token} from "../bnf_lexer";
import {isEqual} from "lodash";
import {ParserBuilder} from "../../common/parser_builder";
import * as fs from "fs";

/*
 * TODO:
 * Maybe we don't need the grammar string. If we could get the token set from the
 * json grammar, that should be enough.
 */

export function generateRootGrammarTables() {
    console.log("Grammar Tables Builder.");

    const tokensStream: Token[] = [];
    const tokenSet: Token[] = [];
    const bnfLexer = new BNFLexer();

    console.log("Loading BNF Grammar of a grammar");
    bnfLexer.setString(bnfGrammarString);

    console.log("Scanning grammar string");
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

    console.log("Loading grammar?");
    let syntaxParser = new ParserBuilder(bnfGrammar);
    console.log("Parsing grammar into a syntax tree");
    syntaxParser.buildCannonicalCollection(tokenSet);

    console.log("Generating tables");
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

generateRootGrammarTables();
