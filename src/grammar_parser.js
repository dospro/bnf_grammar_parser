"use strict";

const lexic = require("./lexicParser");
const syntax = require("./syntaxParser");
const bnfGrammar = require("./bnfGrammar");
const utils = require("./utils");
const grammars = require("./tests/testGrammars");


function getCannonicalCollection(syntaxParser, tokensList) {

    let cannonicalCollection = [];

    let queuedItems = [syntaxParser.closure(
        new syntax.LR1Item(
            {
                leftHand: "goal",
                rightHand: bnfGrammar.bnfGrammar["goal"][0]["rightHand"],
                ruleAction: bnfGrammar.bnfGrammar["goal"][0]["ruleAction"],
                pointPosition: 0,
                lookAheads: ["$"]
            })
    )];


    while (queuedItems.length > 0) {
        const currentCollection = queuedItems.shift();

        if (utils.hasItem(cannonicalCollection, currentCollection))
            continue;

        cannonicalCollection.push(currentCollection);
        for (let token of tokensList) {
            let cc = syntaxParser.goto(currentCollection, token);
            if (cc.length > 0) {
                if (!utils.hasItem(cannonicalCollection, cc)) {
                    queuedItems.push(cc);
                }
            }
        }
    }
    return cannonicalCollection;
}

function getActionTable(syntaxParser, cannonicalCollection) {
    let actionTable = new syntax.ActionTable();
    for (let i = 0; i < cannonicalCollection.length; ++i) {
        let cc = cannonicalCollection[i];
        for (let item of cc) {

            //[A->B.cG,a] and goto(CCi,c)=CCj
            let nextToken = item.tokenNextToPoint();
            if (nextToken === null) {
                if (item.leftHand === 'goal') {
                    console.log("Recording reduce [%d, %s]<- accept %s", i, item.lookAheads, item.leftHand);
                    actionTable.addAccept(i, item)
                }
                else {
                    console.log("Recording reduce [%d, %s]<- reduce %s", i, item.lookAheads, item.leftHand);
                    actionTable.addReduce(i, item)
                }
            }
            else if (nextToken && nextToken.type === "terminal") {
                let nextState = syntaxParser.goto(cc, nextToken);
                let newStateIndex = utils.getIndex(cannonicalCollection, nextState);
                if (newStateIndex !== null) {
                    console.log("Recording shift[%d, %s]<-%d", i, nextToken.text, newStateIndex);
                    actionTable.addShift(i, nextToken.text, newStateIndex);
                }
            }
        }
    }
    return actionTable;
}

function getGotoTable(syntaxParser, cannonicalCollection, noTerminals) {
    let gotoTable = {};
    for (let i = 0; i < cannonicalCollection.length; ++i) {
        let cc = cannonicalCollection[i];
        for (let nt of noTerminals) {
            let nextState = syntaxParser.goto(cc, nt);
            let nextStateIndex = utils.getIndex(cannonicalCollection, nextState);
            if (nextStateIndex !== null) {
                if (!(i in gotoTable))
                    gotoTable[i] = {};
                gotoTable[i][nt.text] = nextStateIndex;
            }
        }
    }
    return gotoTable;
}

function buildTree(actionTable, gotoTable) {
    let stack = [];
    stack.push('$');
    stack.push(0);
    let lexicParser = new lexic.StateMachine();
    lexicParser.setString(grammars.parenthesisGrammarString);
    let currentToken = lexicParser.getNextToken();
    while (true) {
        //console.log(stack);
        let currentState = stack.pop();
        stack.push(currentState);
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
                action["ruleAction"](subTree);
            }

            currentState = stack.pop();
            stack.push(currentState);

            let tree = {};
            tree[action["leftHand"]] = subTree;
            stack.push(tree);

            let newState = gotoTable[currentState][action["leftHand"]];
            stack.push(newState);
        }
        else if (action["action"] === "shift") {
            stack.push(currentToken.text);
            stack.push(action["index"]);
            currentToken = lexicParser.getNextToken();
        }
        else if (action["action"] === "accept") {
            console.log("Accept");
            let subTree = [];
            for (let i = 0; i < action["itemsToPull"]; ++i) {
                stack.pop();
                subTree.push(stack.pop());
            }
            currentState = stack.pop();
            stack.push(currentState);
            let tree = {};
            tree[action["leftHand"]] = subTree;
            return tree;
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

    let cannonicalCollection = getCannonicalCollection(syntaxParser, tokens);
    let actionTable = getActionTable(syntaxParser, cannonicalCollection);
    let gotoTable = getGotoTable(syntaxParser, cannonicalCollection, noTerminals);
    console.log(gotoTable);
    let result = buildTree(actionTable, gotoTable);
    console.log("%o", JSON.stringify(result));
}


exports.main = main;