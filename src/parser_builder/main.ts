/**
 * The goal of this app is to read a BNF grammar and generate the action and goto tables
 * to that grammar.
 *
 * Steps:
 *
 * 1. Read grammar string and pass it through the lexer to produce tokens
 * 2. Pass the tokens to the parser and generate a tree
 * 3. Use the visitor pattern to build a json representation of the grammar
 * 4. Use the parser builder to generate the tables
 * 5. Save the tables.
 */

import {BNFLexer, Token} from "./bnf_lexer";
import {ActionTable, GotoTable, ParserBuilder, ReduceAction, ShiftAction} from "../common/parser_builder";
import {BNFVisitor, JSONBuilderBNFVisitor, TreeNode} from "./parser_generator";
import * as fs from "fs";
import * as path from 'path';
import {isEqual} from "lodash";
import {take} from "../common/utils";

function readPromise(filename: string): Promise<string> {
    return new Promise((resolve, reject) => {
        fs.readFile(path.join(__dirname, filename), (err, data) => {
            if (err) return reject(err);
            else return resolve(data.toString("utf-8"));
        });
    });
}

type Stack = Array<number | string>;

function getTop(collection: Stack): number | string {
    return collection[collection.length - 1];
}

function buildTree(actionTable: ActionTable, gotoTable: GotoTable, tokenStream: Token[]) {
    let stack: Stack = [];
    let treeStack: TreeNode[] = [];
    let tokenIndex = 0;
    stack.push('$');
    stack.push(0);

    let currentToken = tokenStream[tokenIndex++];
    while (true) {
        let currentState = getTop(stack) as number;
        // const action: ShiftAction | ReduceAction = actionTable.getAction(currentState, currentToken.type);
        if (currentToken === undefined) {
            currentToken = {
                type: '$',
                text: '$',
            }
        }
        const action: ShiftAction | ReduceAction = actionTable["data"][currentState][currentToken.type];
        if (action === undefined || action === null) {
            console.log("ERROR!!!");
            break;
        }
        if (action["action"] === "reduce") {
            const reduceAction = action as ReduceAction;

            const treeNode: TreeNode = {
                text: reduceAction["leftHand"],
                type: 'no-terminal',
                children: [] as TreeNode[],
                accept(visitor: BNFVisitor) {
                    visitor.visit(this);
                }
            };

            let subTree: string[] = [];

            take(reduceAction["itemsToPull"])
                .forEach((_) => {
                    stack.pop();
                    subTree.unshift(stack.pop() as string);
                    treeNode.children.unshift(treeStack.pop() as TreeNode);
                });

            treeStack.push(treeNode);

            currentState = getTop(stack) as number;

            stack.push(reduceAction["leftHand"]);

            let newState = gotoTable[currentState][reduceAction["leftHand"]];
            stack.push(newState);
        } else if (action["action"] === "shift") {
            const shiftAction = action as ShiftAction;
            stack.push(currentToken.text);
            stack.push(shiftAction["index"]);

            const treeNode: TreeNode = {
                text: currentToken.text,
                type: "terminal",
                tokenType: currentToken.type,
                children: [] as TreeNode[],
                accept(visitor: BNFVisitor) {
                    visitor.visit(this);
                }
            };
            treeStack.push(treeNode);

            currentToken = tokenStream[tokenIndex++];
        } else if (action["action"] === "accept") {
            const acceptAction = action as ReduceAction;
            let subTree = [];

            const treeNode: TreeNode = {
                text: acceptAction["leftHand"],
                type: 'no-terminal',
                children: [],
                accept(visitor: BNFVisitor) {
                    visitor.visit(this);
                }
            };

            take(acceptAction["itemsToPull"])
                .forEach((_) => {
                    stack.pop();
                    subTree.unshift(stack.pop() as string);
                    treeNode.children.unshift(treeStack.pop() as TreeNode);
                });
            treeStack.push(treeNode);

            currentState = getTop(stack) as number;
            stack.push(acceptAction["leftHand"]);

            return treeStack;
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
export async function main() {
    let tokensSet: Token[] = [];
    let tokensStream: Token[] = [];
    let terminals: Token[] = [];
    let noTerminals: Token[] = [];

    //Read bnf grammar file
    const grammarString = await readPromise("../../src/langs/arithmetic.bnf");
    const bnfLexer = new BNFLexer();
    bnfLexer.setString(grammarString);
    while (!bnfLexer.isEmpty()) {
        const token = bnfLexer.getNextToken();
        tokensStream.push(token);
        if (tokensSet.some(t => isEqual(t, token))) {
            continue;
        }
        tokensSet.push(token);
    }

    let bnfTables: any = await readPromise("../../tables.json");
    bnfTables = JSON.parse(bnfTables);
    const {tokens, actionTable, gotoTable} = bnfTables;
    // console.log("%o", tokens);
    // console.log("%o", actionTable);
    // console.log("%o", gotoTable);

    const tree = buildTree(actionTable, gotoTable, tokensStream);
    const visitor = new JSONBuilderBNFVisitor();
    if (tree) {
        tree[0].accept(visitor);
        const resultGrammar = visitor.getResult();
        const parserBuilder = new ParserBuilder(resultGrammar);
        parserBuilder.buildCannonicalCollection(tokensSet);
        const actionTable = parserBuilder.getActionTable();
        const gotoTable = parserBuilder.getGotoTable(tokensSet.filter(item => item.type === "no-terminal"));

        // Now that we have the grammar in json format, let's generate the tables
        // console.log(JSON.stringify(visitor.getResult(), null, 2));
        // console.log(JSON.stringify(actionTable, null, 2));
        // console.log(JSON.stringify(gotoTable, null, 2));

        const tablesFile = {
            "tokens": tokensSet,
            "actionTable": actionTable,
            "gotoTable": gotoTable,
        }
        fs.writeFile("arithmetic.json", JSON.stringify(tablesFile, null, 2), (err) => {
            if (err) {
                console.log(err);
            }
        });
    }
}
