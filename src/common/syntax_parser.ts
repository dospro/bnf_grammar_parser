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

export class LR1Item {
    public leftHand: string;
    public rightHand: Token[];
    public ruleAction: any;
    public pointPosition: number;
    public lookAheads: string[];

    constructor(params: any) {
        if (!params)
            params = {};
        this.leftHand = params.leftHand || "";
        this.rightHand = params.rightHand || [];
        this.ruleAction = params.ruleAction || undefined;
        this.pointPosition = params.pointPosition || 0;
        this.lookAheads = params.lookAheads || [];
    }

    public equals(item: LR1Item): boolean {
        return isEqual(this, item);
    }

    public tokenNextToPoint(): Token | null {
        if (this.pointPosition >= this.rightHand.length)
            return null;
        return this.rightHand[this.pointPosition];
    }
}

export class SyntaxParser {
    private readonly cannonicalCollection: Array<Array<LR1Item>>;

    constructor(private readonly grammar: Grammar) {
        this.cannonicalCollection = [];
    }

    closure(item: LR1Item) {
        let queuedItems: LR1Item[] = [item];
        let finalItemsSet: LR1Item[] = [];

        while (queuedItems.length > 0) {
            const currentItem: LR1Item | undefined = queuedItems.pop() as LR1Item;
            finalItemsSet.push(currentItem);

            const tokenNextToPoint: Token | null = currentItem.tokenNextToPoint();
            if (tokenNextToPoint === null)
                continue;

            if (tokenNextToPoint.type === "terminal")
                continue;

            // We have a no terminal, add all the rules for that no-terminal
            const leftHand: string = tokenNextToPoint.text;
            const rules = this.grammar[leftHand];
            const newItems: LR1Item[] = rules
                .map(rule => {
                    return this.getLookAheads(currentItem)
                        .map(symbol => {
                            return new LR1Item({
                                leftHand: leftHand,
                                rightHand: rule["predicate"],
                                ruleAction: rule["ruleAction"],
                                pointPosition: 0,
                                lookAheads: [symbol]
                            });
                        })
                        .filter(newItem => finalItemsSet.every((item) => !newItem.equals(item)));
                })
                .reduce((acc, val) => acc.concat(val), []);

            queuedItems.push(...newItems);
        }
        return finalItemsSet;
    }


    getLookAheads(item: LR1Item): string[] {
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


    goto(collection: LR1Item[], token: Token): LR1Item[] {
        // console.log(`For token ${token.text}`);
        // printCollectionItem(collection);
        const result = collection
            .filter(item => isEqual(item.rightHand[item.pointPosition], token))
            .map(item => {
                return this.closure(new LR1Item({
                    leftHand: item.leftHand,
                    rightHand: item.rightHand,
                    ruleAction: item.ruleAction,
                    pointPosition: item.pointPosition + 1,
                    lookAheads: item.lookAheads,
                }));
            })
            .reduce((acc, val) => acc.concat(val.filter(v => !hasItem(acc, v))), []);
        // console.log("Result:");
        // printCollectionItem(result);
        return result;
    }

    buildCannonicalCollection(tokenSet: Token[]) {
        if (this.cannonicalCollection.length > 0)
            return;

        //cc0 <- closure({[S'->S,eof]})
        const cc0 = this.closure(
            new LR1Item(
                {
                    leftHand: "goal",
                    rightHand: this.grammar["goal"][0]["predicate"],
                    ruleAction: this.grammar["goal"][0]["ruleAction"],
                    pointPosition: 0,
                    lookAheads: ["$"]
                })
        );
        //printCollectionItem(cc0);

        //CC <- {cc0}
        let queuedItems = [cc0];

        while (queuedItems.length > 0) {
            const currentCollection = queuedItems.shift() as LR1Item[];

            const isInCollection = (cannonicalCollection: LR1Item[][], collection: LR1Item[]): boolean => {
                for (const cc of cannonicalCollection) {
                    if (cc.length !== collection.length) {
                        continue;
                    }
                    const result = cc.every(ccItem => collection.some(collectionItem => collectionItem.equals(ccItem)));
                    console.log("Result: %o", result);
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
                let nextToken = item.tokenNextToPoint();
                if (nextToken === null) {
                    if (item.leftHand === 'goal') {
                        actionTable.addAccept(i, item)
                    } else {
                        actionTable.addReduce(i, item)
                    }
                } else if (nextToken && nextToken.type === "terminal") {
                    let nextState = this.goto(cc, nextToken);
                    let newStateIndex = this.cannonicalCollection.findIndex(group => isEqual(group, nextState));
                    if (newStateIndex !== -1) {
                        actionTable.addShift(i, nextToken.text, newStateIndex);
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
                let nextStateIndex = this.cannonicalCollection.findIndex(group => isEqual(group, nextState));
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
    ruleAction: any
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

    addReduce(sourceIndex: number, item: LR1Item) {
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
            ruleAction: item.ruleAction
        };
    }

    addAccept(sourceIndex: number, item: LR1Item) {
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
            ruleAction: item.ruleAction
        };
    }

    getAction(state: number, token: string): ShiftAction | ReduceAction {
        return this.data[state][token];
    }
}
