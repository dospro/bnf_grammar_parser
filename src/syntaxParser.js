const isEqual = require("lodash/isEqual");
const utils = require("./utils");

class LR1Item {
    constructor(params) {
        if (!params)
            params = {};
        this.leftHand = params.leftHand || "";
        this.rightHand = params.rightHand || [];
        this.ruleAction = params.ruleAction || undefined;
        this.pointPosition = params.pointPosition || 0;
        this.lookAheads = params.lookAheads || [];
    }

    equals(item) {
        return isEqual(this, item);
    }

    tokenNextToPoint() {
        if (this.pointPosition >= this.rightHand.length)
            return null;
        return this.rightHand[this.pointPosition];
    }
}

class SyntaxParser {
    constructor(grammar) {
        this.grammar = grammar;
        this.cannonicalCollection = [];
    }

    closure(item) {
        let queuedItems = [item];
        let finalItemsSet = [];

        while (queuedItems.length > 0) {
            let currentItem = queuedItems.pop();
            finalItemsSet.push(currentItem);

            let tokenNextToPoint = currentItem.tokenNextToPoint();
            if (tokenNextToPoint == null)
                continue;

            if (tokenNextToPoint.type === "terminal")
                continue;

            // We have a no terminal, add all the rules for that no-terminal
            const leftHand = tokenNextToPoint.text;
            const rules = this.grammar[leftHand];
            for (let rule of rules) {
                const lookAheads = this.getLookAheads(currentItem);
                for (let symbol of lookAheads) {
                    let newItem = new LR1Item(
                        {
                            leftHand: leftHand,
                            rightHand: rule["rightHand"],
                            ruleAction: rule["ruleAction"],
                            pointPosition: 0,
                            lookAheads: [symbol]
                        });

                    //console.log "Created new item %o", newItem
                    // If newItem is not in finalItemsSet
                    let wasNotProcessed = finalItemsSet.every((item) => {
                        return !newItem.equals(item);
                    });

                    if (wasNotProcessed)
                        queuedItems.push(newItem);
                }
            }
        }
        return finalItemsSet;
    }


    getLookAheads(item) {
        /* Given an LR1, finds the set of look ahead symbols */
        if (item.pointPosition >= item.rightHand.length - 1)
            return item.lookAheads;

        let nextItem = item.rightHand[item.pointPosition + 1];
        if (nextItem.type === "terminal")
            return [nextItem.text];


        return this.getFirstsSet(nextItem.text);
    }


    getFirstsSet(noTerminal) {
        let firstsSet = new Set;
        let todoTokens = [noTerminal];
        let doneTokens = [];
        while (todoTokens.length > 0) {
            let nextNoTerminal = todoTokens.pop();
            doneTokens.push(nextNoTerminal);
            let rules = this.grammar[nextNoTerminal];
            for (let rule of rules) {
                if (rule.rightHand[0].type === "no-terminal") {
                    let text = rule[0].text;
                    if ((doneTokens.indexOf(text) !== -1) && (todoTokens.indexOf(text) !== -1))
                        todoTokens.push(text);
                }
                else
                    firstsSet.add(rule.rightHand[0].text);
            }
        }
        return Array.from(firstsSet);
    }


    goto(itemsSet, token) {
        let newItems = [];
        for (let item of itemsSet) {
            if (isEqual(item.rightHand[item.pointPosition], token)) {
                let newItem = new LR1Item(
                    {
                        leftHand: item.leftHand,
                        rightHand: item.rightHand,
                        ruleAction: item.ruleAction,
                        pointPosition: item.pointPosition + 1,
                        lookAheads: item.lookAheads,
                    });
                let closureItems = this.closure(newItem);
                for (let i of closureItems) {
                    if (!utils.hasItem(newItems, i))
                        newItems.push(i);
                }
            }
        }
        return newItems;
    }

    buildCannonicalCollection(tokensList) {
        if (this.cannonicalCollection.length > 0)
            return;

        let queuedItems = [this.closure(
            new LR1Item(
                {
                    leftHand: "goal",
                    rightHand: this.grammar["goal"][0]["rightHand"],
                    ruleAction: this.grammar["goal"][0]["ruleAction"],
                    pointPosition: 0,
                    lookAheads: ["$"]
                })
        )];


        while (queuedItems.length > 0) {
            const currentCollection = queuedItems.shift();

            if (utils.hasItem(this.cannonicalCollection, currentCollection))
                continue;

            this.cannonicalCollection.push(currentCollection);
            for (let token of tokensList) {
                let cc = this.goto(currentCollection, token);
                if (cc.length > 0) {
                    if (!utils.hasItem(this.cannonicalCollection, cc)) {
                        queuedItems.push(cc);
                    }
                }
            }
        }
    }

    getActionTable() {
        let actionTable = new ActionTable();
        for (let i = 0; i < this.cannonicalCollection.length; ++i) {
            let cc = this.cannonicalCollection[i];
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
                    let nextState = this.goto(cc, nextToken);
                    let newStateIndex = utils.getIndex(this.cannonicalCollection, nextState);
                    if (newStateIndex !== null) {
                        console.log("Recording shift[%d, %s]<-%d", i, nextToken.text, newStateIndex);
                        actionTable.addShift(i, nextToken.text, newStateIndex);
                    }
                }
            }
        }
        return actionTable;

    }

    getGotoTable(noTerminals) {
        let gotoTable = {};
        for (let i = 0; i < this.cannonicalCollection.length; ++i) {
            let cc = this.cannonicalCollection[i];
            for (let nt of noTerminals) {
                let nextState = this.goto(cc, nt);
                let nextStateIndex = utils.getIndex(this.cannonicalCollection, nextState);
                if (nextStateIndex !== null) {
                    if (!(i in gotoTable))
                        gotoTable[i] = {};
                    gotoTable[i][nt.text] = nextStateIndex;
                }
            }
        }
        return gotoTable;
    }
}

class ActionTable {
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
            itemsToPull: item.rightHand.length,
            ruleAction: item.ruleAction
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
            itemsToPull: item.rightHand.length,
            ruleAction: item.ruleAction
        };
    }

    getAction(state, token) {
        return this.data[state][token];
    }
}

exports.SyntaxParser = SyntaxParser;
exports.LR1Item = LR1Item;
exports.ActionTable = ActionTable;