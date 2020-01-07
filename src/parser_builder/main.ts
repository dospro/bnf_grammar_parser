import {BNFLexer, Token} from "./bnf_lexer";
import {ActionTable, GotoTable, LR1Item, ReduceAction, ShiftAction, SyntaxParser} from "../common/syntax_parser";
import {bnfGrammar, bnfGrammarString} from "./bnf_grammar";
import {parenthesisGrammarString} from "../tests/testGrammars";
import {readFile} from "fs";
import {isEqual} from "lodash";


type Stack = Array<number | string>;

function getTop(collection: Stack): number | string {
    return collection[collection.length - 1];
}

function buildTree(actionTable: ActionTable, gotoTable: GotoTable) {
    let stack: Stack = [];
    let result: any = {};
    stack.push('$');
    stack.push(0);

    const lexicParser = new BNFLexer();
    lexicParser.setString(bnfGrammarString);

    let currentToken = lexicParser.getNextToken();
    while (true) {
        let currentState = getTop(stack) as number;

        const action: ShiftAction | ReduceAction = actionTable.getAction(currentState, currentToken.type);
        if (action === undefined || action === null) {
            console.log("ERROR!!!");
            break;
        }
        if (action["action"] === "reduce") {
            const reduceAction = action as ReduceAction;
            let subTree = [];
            for (let i = 0; i < reduceAction["itemsToPull"]; ++i) {
                stack.pop();
                subTree.unshift(stack.pop());
            }

            if (reduceAction["ruleAction"] !== null && reduceAction["ruleAction"] !== undefined) {
                result[reduceAction["leftHand"]] = reduceAction["ruleAction"](result, subTree);
            }

            currentState = getTop(stack) as number;

            stack.push(reduceAction["leftHand"]);

            let newState = gotoTable[currentState][reduceAction["leftHand"]];
            stack.push(newState);
        } else if (action["action"] === "shift") {
            const shiftAction = action as ShiftAction;
            stack.push(currentToken.text);
            stack.push(shiftAction["index"]);
            currentToken = lexicParser.getNextToken();
        } else if (action["action"] === "accept") {
            const acceptAction  = action as ReduceAction;
            let subTree = [];
            for (let i = 0; i < acceptAction["itemsToPull"]; ++i) {
                stack.pop();
                subTree.push(stack.pop());
            }

            if (acceptAction["ruleAction"] !== null && acceptAction["ruleAction"] !== undefined) {
                result[acceptAction["leftHand"]] = acceptAction["ruleAction"](result, subTree);
            }

            currentState = getTop(stack) as number;
            stack.push(acceptAction["leftHand"]);

            return result["goal"];
        } else {
            console.log("ERROR: Something went wrong");
            break;
        }
    }
}

/**
 * Should do the following
 *
 * 1. Read a BNF file containing a grammar defined in BNF format
 * 2. Do lexic analysis of the grammar to produce a stream of tokens
 * 3. Using the tokens do a syntactic analysis to produce a syntax tree
 * 4. Using the syntax tree use the generator to produce a file containing the action table
 * the goto table, the list of tokens
 */
export function main() {
    let tokensSet: Token[] = [];
    let tokensStream: Token[] = [];
    let terminals: Token[] = [];
    let noTerminals: Token[] = [];

    //Read bnf grammar file
    readFile("../lang/parenthesis/parenthesis.bnf", (err, data) => {
        const bnfLexer = new BNFLexer();
        bnfLexer.setString(data.toString("utf-8"));
        while(!bnfLexer.isEmpty()) {
            const token = bnfLexer.getNextToken();
            tokensStream.push(token);
            if (tokensSet.some(t => isEqual(t, token))) {
                continue;
            }
            tokensSet.push(token);
        }
        const syntaxParser = new SyntaxParser(bnfGrammar);

    });
    // note: We need first to get a list of different tokens which are used to build the cannonical collection.
    // With the cannonical collection we can run the syntax parser needed to build the tree

    // Lexer. Get tokens

    // Syntax parser. Get tree

    // Generator

    // TODO: This can be an iterator
    /*lexicParser.setString(parenthesisGrammarString);
    while (!lexicParser.isEmpty()) {
        let token = lexicParser.getNextToken();
        console.log("Processing %o", token);
        tokens.push(token);
        if (token.type === "terminal") {
            terminals.push(token);
        } else if (token.type === "no-terminal") {
            noTerminals.push(token);
        }
    }

    let syntaxParser = new SyntaxParser(bnfGrammar);

    console.log("Building cannonical collection");
    syntaxParser.buildCannonicalCollection(tokens);
    console.log("Built cannonical collection");
    let actionTable = syntaxParser.getActionTable();
    console.log("Built action table");
    let gotoTable = syntaxParser.getGotoTable(noTerminals);
    console.log("Built goto table");
    let result = buildTree(actionTable, gotoTable);
    console.log("%s", JSON.stringify(result, null, 2));*/
}
