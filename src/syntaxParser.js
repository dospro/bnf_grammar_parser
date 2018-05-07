const isEqual = require("lodash/isEqual");
const utils = require("./utils");

class LR1Item {
    constructor(params) {
        if (!params)
            params = {};
        this.leftHand = params.leftHand || "";
        this.rightHand = params.rightHand || [];
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
                            rightHand: rule,
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
                if (rule[0].type === "no-terminal") {
                    let text = rule[0].text;
                    if ((doneTokens.indexOf(text) !== -1) && (todoTokens.indexOf(text) !== -1))
                        todoTokens.push(text);
                }
                else
                    firstsSet.add(rule[0].text);
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
}

exports.SyntaxParser = SyntaxParser;
exports.LR1Item = LR1Item;