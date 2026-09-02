import assert from "node:assert/strict";
import {describe, it} from "node:test";

import {ParserBuilder} from "../lr1/parser_builder.js";
import type {Grammar} from "../lr1/grammar.js";

describe("ParserBuilder", () => {
    describe("grammar validation", () => {
        it("requires the start symbol to have exactly one production", () => {
            const missingStart: Grammar = {
                start: "goal",
                productions: [
                    {
                        leftHand: "value",
                        rightHand: [{kind: "terminal", name: "number"}],
                    },
                ],
            };
            const repeatedStart: Grammar = {
                start: "goal",
                productions: [
                    {
                        leftHand: "goal",
                        rightHand: [{kind: "terminal", name: "number"}],
                    },
                    {
                        leftHand: "goal",
                        rightHand: [{kind: "terminal", name: "name"}],
                    },
                ],
            };

            assert.throws(
                () => new ParserBuilder(missingStart),
                /Expected exactly one production for start symbol goal/,
            );
            assert.throws(
                () => new ParserBuilder(repeatedStart),
                /Expected exactly one production for start symbol goal/,
            );
        });

        it("rejects a reference to an undefined non-terminal", () => {
            const grammar: Grammar = {
                start: "goal",
                productions: [
                    {
                        leftHand: "goal",
                        rightHand: [{kind: "no-terminal", name: "expression"}],
                    },
                ],
            };

            assert.throws(
                () => new ParserBuilder(grammar),
                /Undefined non-terminal expression referenced by production goal/,
            );
        });
    });

    describe("table construction", () => {
        it("builds shift, goto, reduce, and accept entries for an augmented grammar", () => {
            const grammar: Grammar = {
                start: "goal",
                productions: [
                    {
                        leftHand: "goal",
                        rightHand: [{kind: "no-terminal", name: "expression"}],
                    },
                    {
                        leftHand: "expression",
                        rightHand: [{kind: "terminal", name: "number"}],
                    },
                ],
            };

            const builder = new ParserBuilder(grammar);
            const actions = builder.getActionTable();
            const gotos = builder.getGotoTable();
            const numberShift = actions.getAction(0, "number");
            const expressionState = gotos[0]?.expression;

            assert.equal(numberShift?.kind, "shift");
            assert.ok(expressionState !== undefined);
            assert.deepEqual(actions.getAction(expressionState, "$"), {kind: "accept"});
            assert.deepEqual(actions.getAction(numberShift.nextState, "$"), {
                kind: "reduce",
                leftHand: "expression",
                itemsToPull: 1,
            });
            assert.equal(actions.getAction(0, "$"), undefined);
            assert.deepEqual(actions.conflicts, []);
        });

        it("reduces only on the lookahead implied by the following terminal", () => {
            const grammar: Grammar = {
                start: "goal",
                productions: [
                    {
                        leftHand: "goal",
                        rightHand: [{kind: "no-terminal", name: "line"}],
                    },
                    {
                        leftHand: "line",
                        rightHand: [
                            {kind: "no-terminal", name: "value"},
                            {kind: "terminal", name: "new-line"},
                        ],
                    },
                    {
                        leftHand: "value",
                        rightHand: [{kind: "terminal", name: "number"}],
                    },
                ],
            };

            const actions = new ParserBuilder(grammar).getActionTable();
            const numberShift = actions.getAction(0, "number");

            assert.equal(numberShift?.kind, "shift");
            assert.deepEqual(actions.getAction(numberShift.nextState, "new-line"), {
                kind: "reduce",
                leftHand: "value",
                itemsToPull: 1,
            });
            assert.equal(actions.getAction(numberShift.nextState, "$"), undefined);
        });

        it("finds a starting terminal through a chain of non-terminals", () => {
            const grammar: Grammar = {
                start: "goal",
                productions: [
                    {
                        leftHand: "goal",
                        rightHand: [{kind: "no-terminal", name: "root"}],
                    },
                    {
                        leftHand: "root",
                        rightHand: [
                            {kind: "no-terminal", name: "prefix"},
                            {kind: "terminal", name: "end"},
                        ],
                    },
                    {
                        leftHand: "prefix",
                        rightHand: [{kind: "no-terminal", name: "middle"}],
                    },
                    {
                        leftHand: "middle",
                        rightHand: [{kind: "terminal", name: "value"}],
                    },
                ],
            };

            const actions = new ParserBuilder(grammar).getActionTable();

            assert.equal(actions.getAction(0, "value")?.kind, "shift");
        });
    });

    describe("conflict reporting", () => {
        it("reports a shift/reduce conflict for an ambiguous expression grammar", () => {
            const grammar: Grammar = {
                start: "goal",
                productions: [
                    {
                        leftHand: "goal",
                        rightHand: [{kind: "no-terminal", name: "expression"}],
                    },
                    {
                        leftHand: "expression",
                        rightHand: [
                            {kind: "no-terminal", name: "expression"},
                            {kind: "terminal", name: "+"},
                            {kind: "no-terminal", name: "expression"},
                        ],
                    },
                    {
                        leftHand: "expression",
                        rightHand: [{kind: "terminal", name: "number"}],
                    },
                ],
            };

            const conflicts = new ParserBuilder(grammar).getActionTable().conflicts;
            const [conflict] = conflicts;

            assert.equal(conflicts.length, 1);
            assert.ok(conflict);
            assert.equal(conflict.terminal, "+");
            assert.deepEqual(
                new Set([conflict.existing.kind, conflict.incoming.kind]),
                new Set(["shift", "reduce"]),
            );
        });

        it("reports a reduce/reduce conflict when two productions accept the same input", () => {
            const grammar: Grammar = {
                start: "goal",
                productions: [
                    {
                        leftHand: "goal",
                        rightHand: [{kind: "no-terminal", name: "value"}],
                    },
                    {
                        leftHand: "value",
                        rightHand: [{kind: "no-terminal", name: "first"}],
                    },
                    {
                        leftHand: "value",
                        rightHand: [{kind: "no-terminal", name: "second"}],
                    },
                    {
                        leftHand: "first",
                        rightHand: [{kind: "terminal", name: "number"}],
                    },
                    {
                        leftHand: "second",
                        rightHand: [{kind: "terminal", name: "number"}],
                    },
                ],
            };

            const conflicts = new ParserBuilder(grammar).getActionTable().conflicts;
            const [conflict] = conflicts;

            assert.equal(conflicts.length, 1);
            assert.ok(conflict);
            assert.equal(conflict.terminal, "$");
            assert.equal(conflict.existing.kind, "reduce");
            assert.equal(conflict.incoming.kind, "reduce");
        });
    });
});
