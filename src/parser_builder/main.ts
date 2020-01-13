import {BNFLexer, Token} from "./bnf_lexer";
import {ActionTable, GotoTable, LR1Item, ReduceAction, ShiftAction, SyntaxParser} from "../common/syntax_parser";
import * as fs from "fs";
import * as path from 'path';
import {isEqual} from "lodash";
import {times} from "../common/utils";

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
    let result: any = {};
    let treeStack: any = [];
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
            let subTree = [];
            for (let i = 0; i < reduceAction["itemsToPull"]; ++i) {
                stack.pop();
                subTree.unshift(stack.pop());
            }

            if (reduceAction["ruleAction"] !== null && reduceAction["ruleAction"] !== undefined) {
                result[reduceAction["leftHand"]] = reduceAction["ruleAction"](result, subTree);
            }

            const treeNode: any = {
                text: reduceAction["leftHand"],
                type: 'no-terminal',
                token_type: null,
                children: [],
            };
            for (let i = 0; i < reduceAction["itemsToPull"]; ++i) {
                treeNode.children.unshift(treeStack.pop());
            }
            treeStack.push(treeNode);

            currentState = getTop(stack) as number;

            stack.push(reduceAction["leftHand"]);

            let newState = gotoTable[currentState][reduceAction["leftHand"]];
            stack.push(newState);
        } else if (action["action"] === "shift") {
            const shiftAction = action as ShiftAction;
            stack.push(currentToken.text);
            stack.push(shiftAction["index"]);

            const treeNode = {
                text: currentToken.text,
                type: 'terminal',
                token_type: currentToken.type,
                children: null,
            };
            treeStack.push(treeNode);

            currentToken = tokenStream[tokenIndex++];
        } else if (action["action"] === "accept") {
            const acceptAction = action as ReduceAction;
            let subTree = [];
            for (let i = 0; i < acceptAction["itemsToPull"]; ++i) {
                stack.pop();
                subTree.push(stack.pop());
            }

            if (acceptAction["ruleAction"] !== null && acceptAction["ruleAction"] !== undefined) {
                result[acceptAction["leftHand"]] = acceptAction["ruleAction"](result, subTree);
            }

            const treeNode: any = {
                text: acceptAction["leftHand"],
                type: 'no-terminal',
                token_type: null,
                children: [],
            };
            for (let i = 0; i < acceptAction["itemsToPull"]; ++i) {
                treeNode.children.unshift(treeStack.pop());
            }
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

    console.log(__dirname);
    //Read bnf grammar file
    const data = await readPromise("../../src/langs/parenthesis/parenthesis.bnf");

    const bnfLexer = new BNFLexer();
    bnfLexer.setString(data);
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
    console.log("%o", tokens);
    console.log("%o", actionTable);
    console.log("%o", gotoTable);

    let result = buildTree(actionTable, gotoTable, tokensStream);
    // console.log("%o", result);
    //console.log(printTree(result));
    let html = `<div><h3>${printTreeHTML(result)}</h3></div>`;
    fs.writeFile("grammar.html", html, (err) => {
        console.log(err);
    });

    //
    // console.log("Building cannonical collection");
    // syntaxParser.buildCannonicalCollection(tokens);
    // console.log("Built cannonical collection");
    // let actionTable = syntaxParser.getActionTable();
    // console.log("Built action table");
    // let gotoTable = syntaxParser.getGotoTable(noTerminals);
    // console.log("Built goto table");
    // let result = buildTree(actionTable, gotoTable);
    // console.log("%s", JSON.stringify(result, null, 2));
}

function printTree(tree: any, level: number = 0): string {
    let msg: string = '';
    let newLevel = level;

    for (const node of tree) {
        if (node.type !== 'no-terminal') {
            if (node.token_type === 'no-terminal') {
                msg += `<${node.text}> `;
            } else if (node.token_type === 'terminal') {
                msg += `"${node.text}" `;
            } else {
                msg += `${node.text} `;
            }
            msg += ' ';
            newLevel++;
        }
        if (node.text === 'rule') {
            msg += '\n';
        }
        if (node.children !== null) {
            msg += printTree(node.children, newLevel);
        }
    }
    return msg;
}

function printTreeHTML(tree: any, level: number = 0): string {
    let msg: string = '';
    let newLevel = level;

    for (const node of tree) {
        if (node.type !== 'no-terminal') {
            if (node.token_type === 'no-terminal') {
                msg += `<span style="color: blue"> ${node.text} </span>`;
            } else if (node.token_type === 'terminal') {
                msg += `<span style="color: cadetblue"> ${node.text} </span>`;
            } else {
                msg += `${node.text}`;
            }
            newLevel++;
        } else if (node.type === 'no-terminal' && node.text === 'rule') {
            msg += '</br>';
        }
        if (node.children !== null) {
            msg += printTreeHTML(node.children, newLevel);
        }
    }
    return msg;
}
