import {isEqual} from "lodash";
import {hasItem} from "./utils";
import {Grammar} from "../parser_builder/bnf_grammar";
import {Token} from "../parser_builder/bnf_lexer";

export interface GotoTable {
    [key: number]: {
        [key: string]: number
    }
}

export interface ILR1Item {
    leftHand: string;
    rightHand: Token[];
    pointPosition: number;
    lookAheads: string[];
}

export class ParserBuilder {
    private readonly cannonicalCollection: Array<Array<ILR1Item>>;

    constructor(private readonly grammar: Grammar) {
        this.cannonicalCollection = [];
    }

    closure(item: ILR1Item) {
        let queuedItems: ILR1Item[] = [item];
        let finalItemsSet: ILR1Item[] = [];

        while (queuedItems.length > 0) {
            const currentItem = queuedItems.pop();
            if (currentItem === undefined) {
                continue;
            }
            finalItemsSet.push(currentItem);

            if (currentItem.pointPosition >= currentItem.rightHand.length)
                continue;

            const tokenNextToPoint = currentItem.rightHand[currentItem.pointPosition];

            if (tokenNextToPoint === null)
                continue;

            if (tokenNextToPoint.type === "terminal")
                continue;

            // We have a no terminal, add all the rules for that no-terminal
            const leftHand: string = tokenNextToPoint.text;
            const rules = this.grammar[leftHand];
            const newItems: ILR1Item[] = rules
                .map(rule => {
                    return this.getLookAheads(currentItem)
                        .map(symbol => {
                            return {
                                leftHand: leftHand,
                                rightHand: rule["predicate"],
                                pointPosition: 0,
                                lookAheads: [symbol]
                            };
                        })
                        .filter(newItem => finalItemsSet.every((item) => !isEqual(newItem, item)));
                })
                .reduce((acc, val) => acc.concat(val), []);

            queuedItems.push(...newItems);
        }
        return finalItemsSet;
    }


    getLookAheads(item: ILR1Item): string[] {
        /* Given an LR1, finds the set of look ahead symbols */
        if (item.pointPosition >= item.rightHand.length - 1)
            return item.lookAheads;

        let nextItem = item.rightHand[item.pointPosition + 1];
        if (nextItem.type === "terminal")
            return [nextItem.text];


        return this.getFirstsSet(nextItem.text);
    }


    getFirstsSet(noTerminal: string): string[] {
        let firstsSet: Set<string> = new Set;
        let todoTokens: string[] = [noTerminal];
        let doneTokens: Set<string> = new Set;
        while (todoTokens.length > 0) {
            const nextNoTerminal: string | undefined = todoTokens.pop();
            if (nextNoTerminal === undefined) {
                break;
            }
            doneTokens.add(nextNoTerminal);
            const rules = this.grammar[nextNoTerminal];
            for (const rule of rules) {
                if (rule.predicate[0].type === "no-terminal") {
                    const text = rule.predicate[0].text;
                    if (doneTokens.has(text) && todoTokens.includes(text)) {
                        todoTokens.push(text);
                    }
                } else {
                    firstsSet.add(rule.predicate[0].text);
                }
            }
        }
        return Array.from(firstsSet);
    }


    goto(collection: ILR1Item[], token: Token): ILR1Item[] {
        // console.log(`For token ${token.text}`);
        // printCollectionItem(collection);
        const result = collection
            .filter(item => isEqual(item.rightHand[item.pointPosition], token))
            .map(item => {
                return this.closure({
                    leftHand: item.leftHand,
                    rightHand: item.rightHand,
                    pointPosition: item.pointPosition + 1,
                    lookAheads: item.lookAheads,
                });
            })
            .reduce((acc, val) => acc.concat(val.filter(v => !hasItem(acc, v))), []); // TODO: Review. Can simplify
        // console.log("Result:");
        // printCollectionItem(result);
        return result;
    }

    buildCannonicalCollection(tokenSet: Token[]) {
        if (this.cannonicalCollection.length > 0)
            return;

        //cc0 <- closure({[S'->S,eof]})
        const cc0 = this.closure({
                leftHand: "goal",
                rightHand: this.grammar["goal"][0]["predicate"],
                pointPosition: 0,
                lookAheads: ["$"],
            }
        );
        //printCollectionItem(cc0);

        //CC <- {cc0}
        let queuedItems = [cc0];

        while (queuedItems.length > 0) {
            const currentCollection = queuedItems.shift();
            if (currentCollection === undefined) {
                break;
            }

            const isInCollection = (cannonicalCollection: ILR1Item[][], collection: ILR1Item[]): boolean => {
                for (const cc of cannonicalCollection) {
                    if (cc.length !== collection.length) {
                        continue;
                    }
                    const result = cc.every(ccItem => collection.some(collectionItem => isEqual(collectionItem, ccItem)));
                    // console.log("Result: %o", result);
                    if (result) {
                        return true;
                    }
                }
                return false;
            };

            if (isInCollection(this.cannonicalCollection, currentCollection)) {
                continue;
            }

            this.cannonicalCollection.push(currentCollection);

            // foreach x following a . in an item in cci
            const results = tokenSet
                .map(token => this.goto(currentCollection, token))
                .filter(tempCollection => !this.cannonicalCollection
                    .some(collection => isEqual(collection, tempCollection)))
                .filter(tempCollection => tempCollection.length > 0);
            queuedItems.push(...results);
        }
    }

    getActionTable() {
        let actionTable = new ActionTable();
        this.cannonicalCollection.forEach((cc, i) => {
            cc.forEach(item => {
                //[A->B.cG,a] and goto(CCi,c)=CCj
                if (item.pointPosition >= item.rightHand.length) {
                    if (item.leftHand === 'goal') {
                        actionTable.addAccept(i, item)
                    } else {
                        actionTable.addReduce(i, item)
                    }
                } else {
                    let nextToken = item.rightHand[item.pointPosition];
                    if (nextToken.type === "terminal") {
                        let nextState = this.goto(cc, nextToken);
                        let newStateIndex = this
                            .cannonicalCollection
                            .findIndex(group => compareCollections(group, nextState));
                        if (newStateIndex !== -1) {
                            actionTable.addShift(i, nextToken.text, newStateIndex);
                        }
                    }
                }
            });
        });
        return actionTable;
    }


    getGotoTable(noTerminals: Token[]): GotoTable {
        return this.cannonicalCollection.reduce((acc, cc, i) => {
            return noTerminals.reduce((table, nt) => {
                let nextState = this.goto(cc, nt);
                let nextStateIndex = this.cannonicalCollection.findIndex(group => compareCollections(group, nextState));
                if (nextStateIndex !== -1) {
                    if (!(i in table))
                        table[i] = {};
                    table[i][nt.text] = nextStateIndex;
                }
                return table;
            }, acc);
        }, {} as GotoTable);
    }
}

export type ShiftAction = {
    action: string,
    index: number;
}
export type ReduceAction = {
    action: 'shift' | 'reduce' | 'accept',
    leftHand: string,
    itemsToPull: number,
}

export interface IActionTable {
    [index: number]: {
        [terminal: string]: ShiftAction | ReduceAction
    }
}

export class ActionTable {
    public data: IActionTable;

    constructor() {
        this.data = {};
    }

    addShift(sourceIndex: number, terminal: string, destIndex: number) {
        if (!(sourceIndex in this.data))
            this.data[sourceIndex] = {};
        this.data[sourceIndex][terminal] = {action: "shift", index: destIndex};
    }

    addReduce(sourceIndex: number, item: ILR1Item) {
        if (!(sourceIndex in this.data))
            this.data[sourceIndex] = {};
        if (item.lookAheads[0] in this.data[sourceIndex]) {
            console.log("Reduce conflict!!!");
            return
        }
        this.data[sourceIndex][item.lookAheads[0]] = {
            action: "reduce",
            leftHand: item.leftHand,
            itemsToPull: item.rightHand.length,
        };
    }

    addAccept(sourceIndex: number, item: ILR1Item) {
        if (!(sourceIndex in this.data))
            this.data[sourceIndex] = {};
        if (item.lookAheads[0] in this.data[sourceIndex]) {
            console.log("Reduce conflict!!!");
            return
        }
        this.data[sourceIndex][item.lookAheads[0]] = {
            action: "accept",
            leftHand: item.leftHand,
            itemsToPull: item.rightHand.length,
        };
    }

    getAction(state: number, token: string): ShiftAction | ReduceAction {
        return this.data[state][token];
    }
}

function compareCollections(a: ILR1Item[], b: ILR1Item[]) {
    if (a.length !== b.length) {
        return false;
    }
    return a.every(p => b.some(q => isEqual(p, q)));
}
