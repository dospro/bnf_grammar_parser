import type {Grammar, GrammarSymbol} from "../lr1/grammar.js";

const bnfGrammarString: string = `
<goal> ::= <rules_list>
<rules_list> ::= "new-line"<rules_list>
<rules_list> ::= <rules_list><rule>
<rules_list> ::= <rule>
<rule> ::= "no-terminal" "assignment" <right_side> "new-line"
<right_side> ::= <right_side> "no-terminal"
<right_side> ::= <right_side> "terminal"
<right_side> ::= "no-terminal"
<right_side> ::= "terminal"
`;

const t = (name: string): GrammarSymbol => ({kind: "terminal", name});
const nt = (name: string): GrammarSymbol => ({kind: "no-terminal", name});

/**
 * BNF described in BNF — the grammar the bootstrap feeds through the LR(1)
 * engine to produce the tables that parse every other `.bnf` file.
 *
 * The terminal names are the token types emitted by the BNF tokenizer, not
 * source text: `"no-terminal"` is the token for `<something>`, `"terminal"` the
 * token for `"something"`, and `"assignment"` the token for `::=`.
 *
 * Kept in the same order as the nine productions of `bnfGrammarString`, so a
 * production's index here matches its line there.
 */
export const bnfGrammar: Grammar = {
    start: "goal",
    productions: [
        // 0
        {leftHand: "goal", rightHand: [nt("rules_list")]},
        // 1
        {leftHand: "rules_list", rightHand: [t("new-line"), nt("rules_list")]},
        // 2
        {leftHand: "rules_list", rightHand: [nt("rules_list"), nt("rule")]},
        // 3
        {leftHand: "rules_list", rightHand: [nt("rule")]},
        // 4
        {leftHand: "rule", rightHand: [t("no-terminal"), t("assignment"), nt("right_side"), t("new-line")]},
        // 5
        {leftHand: "right_side", rightHand: [nt("right_side"), t("no-terminal")]},
        // 6
        {leftHand: "right_side", rightHand: [nt("right_side"), t("terminal")]},
        // 7
        {leftHand: "right_side", rightHand: [t("no-terminal")]},
        // 8
        {leftHand: "right_side", rightHand: [t("terminal")]},
    ],
};
