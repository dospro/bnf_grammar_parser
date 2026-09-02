import {ILR1Item as LR1Item} from "../lr1/parser_builder.js";

export function isEqual(a: any, b: any): boolean {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (typeof a !== typeof b) return false;

    if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) return false;
        return a.every((val, index) => isEqual(val, b[index]));
    }

    if (typeof a === 'object' && typeof b === 'object') {
        const keysA = Object.keys(a);
        const keysB = Object.keys(b);
        if (keysA.length !== keysB.length) return false;

        return keysA.every(key => isEqual(a[key], b[key]));
    }
    return false;
}

export const hasItem = (collection: LR1Item[], item: LR1Item): boolean => {
    return collection.some(i => isEqual(item, i));
};

export function take(limit: number): number[] {
    let result = [];
    for (let i = 0; i < limit; ++i) {
        result.push(i);
    }
    return result;
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
    collection.forEach((cc, i) => {
        console.log(`\n\nGroup: ${i}\n`);
        cc.forEach((item) => {
            const rightHand = item
                .rightHand
                .reduce((acc, i, counter) => {
                    if (counter === item.pointPosition) {
                        acc += ".";
                    }
                    acc += ` ${i.text} `;
                    return acc;
                }, "");
            console.log("[%s -> %s, %s]", item.leftHand, rightHand, item.lookAheads);
        });
    });
};
