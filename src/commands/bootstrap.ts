import {bnfGrammar} from "../bnf/meta_grammar.js";
import {ParserBuilder} from "../lr1/parser_builder.js";
import * as fs from "fs";

/**
 * Builds the LR(1) tables for the BNF meta-grammar — the tables that parse every
 * other `.bnf` file, and the reason this project can describe its own input
 * language in its own input language.
 *
 * Not yet wired to the CLI: the write below still emits the raw `ActionTable`
 * instance, whose erased `private` fields leak a `data` wrapper and a
 * `collisions` array into the file, and the grammar's known conflict is not
 * consulted before writing.
 */
export function bootstrap() {
    console.log("Grammar Tables Builder.");

    console.log("Loading grammar?");
    let syntaxParser = new ParserBuilder(bnfGrammar);

    console.log("Generating tables");
    const actionTable = syntaxParser.getActionTable();
    const gotoTable = syntaxParser.getGotoTable();

    const result = {
        "actionTable": actionTable,
        "gotoTable": gotoTable,
    };
    fs.writeFile("tables.json", JSON.stringify(result), (err) => {
        console.log(err);
    });
}
