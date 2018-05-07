"use strict";
const fs = require("fs");
const utils = require("./utils");
const lexic = require("./lexicParser");
const syntax = require("./syntaxParser");
const grammars = require("./tests/testGrammars");


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

utils.printFormattedGrammar(grammars.parenthesisGrammar);
console.log("Lexic analysis");

let lexicParser = new lexic.StateMachine();
lexicParser.setString(grammars.parenthesisGrammarString);
let tokens = [];

while (!lexicParser.isEmpty()) {
    let t = lexicParser.getNextToken();
    if ((t.type === 'terminal' || t.type === 'no-terminal') && !utils.hasItem(tokens, t))
        tokens.push(t);
}

console.log(tokens);
console.log("Building matrix");

let syntaxParser = new syntax.SyntaxParser(grammars.parenthesisGrammar);

let canonicalCollection = [];

let queuedItems = [syntaxParser.closure(
    new syntax.LR1Item(
        {
            leftHand: "goal",
            rightHand: grammars.parenthesisGrammar["goal"][0],
            pointPosition: 0,
            lookAheads: ["$"]
        })
)];


while (queuedItems.length > 0) {
    const currentCollection = queuedItems.shift();

    if (utils.hasItem(canonicalCollection, currentCollection))
        continue;

    canonicalCollection.push(currentCollection);
    for (let token of tokens) {
        let cc = syntaxParser.goto(currentCollection, token);
        if (cc.length > 0) {
            if (!utils.hasItem(canonicalCollection, cc)) {
                queuedItems.push(cc);
            }
        }
    }
}

class Matrix {
    constructor() {
        this.data = {};
    }

    addShift(sourceIndex, terminal, destIndex) {
        if (!(sourceIndex in this.data))
            this.data[sourceIndex] = {};
        this.data[sourceIndex][terminal] = {action: "shift", index: destIndex};
    }

    addReduce(sourceIndex, item) {
        if (!(sourceIndex in this.data))
            this.data[sourceIndex] = {};
        if (item.lookAheads[0] in this.data[sourceIndex]) {
            console.log("Reduce conflict!!!");
            return
        }
        this.data[sourceIndex][item.lookAheads[0]] = {
            action: "reduce",
            leftHand: item.leftHand,
            itemsToPull: item.rightHand.length
        };
    }

    addAccept(sourceIndex, item) {
        if (!(sourceIndex in this.data))
            this.data[sourceIndex] = {};
        if (item.lookAheads[0] in this.data[sourceIndex]) {
            console.log("Reduce conflict!!!");
            return
        }
        this.data[sourceIndex][item.lookAheads[0]] = {
            action: "accept",
            leftHand: item.leftHand,
            itemsToPull: item.rightHand.length
        };
    }
}

let matrix = new Matrix();
for (let i = 0; i < canonicalCollection.length; ++i) {
    let cc = canonicalCollection[i];
    for (let item of cc) {

        //[A->B.cG,a] and goto(CCi,c)=CCj
        let nextToken = item.tokenNextToPoint();
        if (nextToken === null) {
            if (item.leftHand === 'goal') {
                console.log("Recording reduce [%d, %s]<- accept %s", i, item.lookAheads, item.leftHand);
                matrix.addAccept(i, item)
            }
            else {
                console.log("Recording reduce [%d, %s]<- reduce %s", i, item.lookAheads, item.leftHand);
                matrix.addReduce(i, item)
            }
        }
        else if (nextToken && nextToken.type === "terminal") {
            let nextState = syntaxParser.goto(cc, nextToken);
            let newStateIndex = utils.getIndex(canonicalCollection, nextState);
            if (newStateIndex != null) {
                console.log("Recording shift[%d, %s]<-%d", i, nextToken.text, newStateIndex);
                matrix.addShift(i, nextToken.text, newStateIndex);
            }
        }
    }
}

let stringToParse = "(()()((()()))";



console.log("CC length: %o", canonicalCollection.length);
console.log(matrix.data);
//utils.printCollection(canonicalCollection);


