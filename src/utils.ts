import {isEqual} from "lodash";
import {LR1Item} from "./syntaxParser";

export const hasItem = (collection: LR1Item[], item: LR1Item): boolean => {
    return collection.some(i => isEqual(item, i));
};

export const getIndex = (collection: LR1Item[], item: LR1Item): number => {
    return collection.findIndex(i => isEqual(item, i));
};

export const printFormattedGrammar = (grammar: any) => {
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
};

export const printCollection = (collection: any) => {
    for (const cc of collection) {
        console.log("\n\nGroup:\n");
        for (const item of cc) {
            let rightHand = "";
            let counter = 0;
            for (const i of item.rightHand) {
                if (counter === item.pointPosition) {
                    rightHand += ".";
                }
                rightHand += i.text;
                counter++;
            }
            console.log("[%s -> %s, %s]", item.leftHand, rightHand, item.lookAheads);
        }
    }
};
