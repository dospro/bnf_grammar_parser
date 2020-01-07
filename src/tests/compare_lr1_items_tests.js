/**
 * lr1_syntax_parser_tests.js
 * Set of tests for the syntax parser
 */

const expect = require('chai').expect;
const syntax = require("../common/syntax_parser");

describe("Compare LR1 Items", () => {
    const testItem = new syntax.LR1Item({
        leftHand: 'testRule',
        rightHand: [
            {
                type: 'no-terminal',
                test: 'testNoTerminal'
            }
        ],
        pointPosition: 0,
        lookAheads: ['t'],
    });
    beforeEach(() => {

    });

    it("should return true for equal items", () => {
        const equalItem = new syntax.LR1Item({
            leftHand: 'testRule',
            rightHand: [
                {
                    type: 'no-terminal',
                    test: 'testNoTerminal'
                }
            ],
            pointPosition: 0,
            lookAheads: ['t'],
        });
        expect(testItem.equals(equalItem)).to.be.equal(true);
    });

    it("should return false for different items", () => {
        const equalItem = new syntax.LR1Item({
            leftHand: 'testRule2',
            rightHand: [
                {
                    type: 'no-terminal',
                    test: 'testNoTerminal'
                }
            ],
            pointPosition: 0,
            lookAheads: ['t'],
        });
        expect(testItem.equals(equalItem)).to.be.equal(false);
    });

    it("should return false for different right hand sizes", () => {
        const equalItem = new syntax.LR1Item({
            leftHand: 'testRule2',
            rightHand: [
                {
                    type: 'no-terminal',
                    test: 'testNoTerminal'
                },
                {
                    type: 'no-terminal',
                    test: 'testNoTerminal1'
                }
            ],
            pointPosition: 0,
            lookAheads: ['t'],
        });
        expect(testItem.equals(equalItem)).to.be.equal(false);
    });

    it("should return false for different right hand values", () => {
        const equalItem = new syntax.LR1Item({
            leftHand: 'testRule2',
            rightHand: [
                {
                    type: 'no-terminal',
                    test: 'testNoTerminal1'
                }
            ],
            pointPosition: 0,
            lookAheads: ['t'],
        });
        expect(testItem.equals(equalItem)).to.be.equal(false);
    });
});
