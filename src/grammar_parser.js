"use strict";

const lexic = require("./lexicParser");
const syntax = require("./syntaxParser");
const bnfGrammar = require("./bnfGrammar");
const grammars = require("./tests/testGrammars");

function getTop(collection) {
    return collection[collection.length - 1];
}

function buildTree(actionTable, gotoTable) {
    let stack = [];
    let result = {};
    stack.push('$');
    stack.push(0);

    let lexicParser = new lexic.StateMachine();
    lexicParser.setString(grammars.parenthesisGrammarString);

    let currentToken = lexicParser.getNextToken();
    while (true) {
        let currentState = getTop(stack);

        let action = actionTable.getAction(currentState, currentToken.type);
        if (action === undefined || action === null) {
            console.log("ERROR!!!");
            break;
        }
        if (action["action"] === "reduce") {
            let subTree = [];
            for (let i = 0; i < action["itemsToPull"]; ++i) {
                stack.pop();
                subTree.unshift(stack.pop());
            }

            if (action["ruleAction"] !== null && action["ruleAction"] !== undefined) {
                result[action["leftHand"]] = action["ruleAction"](result, subTree);
            }

            currentState = getTop(stack);

            stack.push(action["leftHand"]);

            let newState = gotoTable[currentState][action["leftHand"]];
            stack.push(newState);
        }
        else if (action["action"] === "shift") {
            stack.push(currentToken.text);
            stack.push(action["index"]);
            currentToken = lexicParser.getNextToken();
        }
        else if (action["action"] === "accept") {
            let subTree = [];
            for (let i = 0; i < action["itemsToPull"]; ++i) {
                stack.pop();
                subTree.push(stack.pop());
            }

            if (action["ruleAction"] !== null && action["ruleAction"] !== undefined) {
                result[action["leftHand"]] = action["ruleAction"](result, subTree);
            }

            currentState = getTop(stack);
            stack.push(action["leftHand"]);

            return result["goal"];
        }
        else {
            console.log("ERROR: Something went wrong");
            break;
        }
    }
}

function main() {
    let tokens = [];
    let terminals = [];
    let noTerminals = [];
    let lexicParser = new lexic.StateMachine();
    lexicParser.setString(bnfGrammar.bnfGrammarString);
    while (!lexicParser.isEmpty()) {
        let token = lexicParser.getNextToken();
        tokens.push(token);
        if (token.type === "terminal") {
            terminals.push(token);
        }
        else if (token.type === "no-terminal") {
            noTerminals.push(token);
        }
    }

    let syntaxParser = new syntax.SyntaxParser(bnfGrammar.bnfGrammar);

    syntaxParser.buildCannonicalCollection(tokens);
    let actionTable = syntaxParser.getActionTable();
    let gotoTable = syntaxParser.getGotoTable(noTerminals);
    let result = buildTree(actionTable, gotoTable);
    console.log("%s", JSON.stringify(result, null, 2));
}


exports.main = main;