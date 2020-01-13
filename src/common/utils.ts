import {isEqual} from "lodash";
import {LR1Item} from "./syntax_parser";

export const hasItem = (collection: LR1Item[], item: LR1Item): boolean => {
    return collection.some(i => isEqual(item, i));
};

export function times(limit: number, callback: (i: number) => void) {
    for (let i = 0; i < limit; ++i) {
        callback(i);
    }
}


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

export function printCollectionItem(collection: LR1Item[]) {
    for (const item of collection) {
        let rightHand = "";
        let counter = 0;
        for (const i of item.rightHand) {
            if (counter === item.pointPosition) {
                rightHand += ".";
            }
            rightHand += ` ${i.text}`;
            counter++;
        }
        console.log(`[${item.leftHand} -> ${rightHand}, ${item.lookAheads}]`);
    }
};

export const printCollection = (collection: LR1Item[][]) => {
    for (const cc of collection) {
        console.log("\n\nGroup:\n");
        for (const item of cc) {
            let rightHand = "";
            let counter = 0;
            for (const i of item.rightHand) {
                if (counter === item.pointPosition) {
                    rightHand += ".";
                }
                rightHand += ` ${i.text}`;
                counter++;
            }
            console.log("[%s -> %s, %s]", item.leftHand, rightHand, item.lookAheads);
        }
    }
};
