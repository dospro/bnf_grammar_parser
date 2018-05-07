const isEqual = require("lodash/isEqual");

function hasItem(collection, item) {
    for (let i of collection) {
        if (isEqual(item, i))
            return true;
    }
    return false;
}

function getIndex(collection, item) {
    for (let i = 0; i < collection.length; ++i) {
        if (isEqual(item, collection[i])) {
            return i;
        }
    }
    return null;
}

function printFormattedGrammar(grammar) {
    for (const leftHand in grammar) {
        for (const rule of grammar[leftHand]) {
            process.stdout.write(`<${leftHand}> ::= `);
            for (const token of rule) {
                if (token.type === "terminal")
                    process.stdout.write(`"${token.text}" `);
                else {
                    process.stdout.write(`<${token.text}> `);
                    process.stdout.write("\b\n");
                }
            }
        }
    }
}

function printCollection(collection) {
    for (const cc of collection) {
        console.log("\n\nGroup:\n");
        for (const item of cc) {
            let rightHand = "";
            let counter = 0;
            for (i of item.rightHand) {
                if (counter === item.pointPosition) {
                    rightHand += ".";
                }
                rightHand += i.text;
                counter++;
            }
            console.log("[%s -> %s, %s]", item.leftHand, rightHand, item.lookAheads);
        }
    }
}

exports.hasItem = hasItem;
exports.getIndex = getIndex;
exports.printFormattedGrammar = printFormattedGrammar;
exports.printCollection = printCollection;