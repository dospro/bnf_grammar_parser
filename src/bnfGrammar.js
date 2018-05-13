bnfGrammarString = `
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

bnfGrammar = {
    "goal": [{
        rightHand: [
            {type: "no-terminal", text: "rules_list"}
        ],
        ruleAction: () => {
            console.log("Goal action rule!!");
        }
    }],
    "rules_list": [{
        rightHand: [
            {type: "terminal", text: "new-line"},
            {type: "no-terminal", text: "rules_list"}
        ],
        ruleAction: undefined
    }, {
        rightHand: [
            {type: "no-terminal", text: "rules_list"},
            {type: "no-terminal", text: "rule"}
        ],
        ruleAction: undefined
    }, {
        rightHand: [
            {type: "no-terminal", text: "rule"}
        ],
        ruleAction: undefined
    }],
    "rule": [{
        rightHand: [
            {type: "terminal", text: "no-terminal"},
            {type: "terminal", text: "assignment"},
            {type: "no-terminal", text: "right_side"},
            {type: "terminal", text: "new-line"}
        ],
        ruleAction: (data) => {
            console.log("Reducing rule: %o", data);
        }
    }],
    "right_side": [{
        rightHand: [
            {type: "no-terminal", text: "right_side"},
            {type: "terminal", text: "no-terminal"}
        ],
        ruleAction: undefined
    }, {
        rightHand: [
            {type: "no-terminal", text: "right_side"},
            {type: "terminal", text: "terminal"}

        ],
        ruleAction: undefined
    }, {
        rightHand: [
            {type: "terminal", text: "no-terminal"}
        ], ruleAction: undefined
    }, {
        rightHand: [
            {type: "terminal", text: "terminal"}
        ],
        ruleAction: undefined
    }]
};

module.exports.bnfGrammarString = bnfGrammarString;
module.exports.bnfGrammar = bnfGrammar;
