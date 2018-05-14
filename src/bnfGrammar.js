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
        ruleAction: (state, data) => {
            return state["rules_list"];
        }
    }],
    "rules_list": [{
        rightHand: [
            {type: "terminal", text: "new-line"},
            {type: "no-terminal", text: "rules_list"}
        ],
        ruleAction: (state, data) => {
            return state["rules_list"];
        }
    }, {
        rightHand: [
            {type: "no-terminal", text: "rules_list"},
            {type: "no-terminal", text: "rule"}
        ],
        ruleAction: (state, data) => {
            let result = state["rules_list"];
            let ruleLeftHand = Object.keys(state["rule"])[0];
            if (ruleLeftHand in state["rules_list"]) {
                result[ruleLeftHand] = result[ruleLeftHand].concat(state["rule"][ruleLeftHand]);
            }
            else {
                result[ruleLeftHand] = state["rule"][ruleLeftHand];
            }
            return result
        }
    }, {
        rightHand: [
            {type: "no-terminal", text: "rule"}
        ],
        ruleAction: (state, data) => {
            return state["rule"];
        }
    }],
    "rule": [{
        rightHand: [
            {type: "terminal", text: "no-terminal"},
            {type: "terminal", text: "assignment"},
            {type: "no-terminal", text: "right_side"},
            {type: "terminal", text: "new-line"}
        ],
        ruleAction: (state, data) => {
            let result = {};
            result[data[0]] = [state["right_side"]];
            return result;
        }
    }],
    "right_side": [{
        rightHand: [
            {type: "no-terminal", text: "right_side"},
            {type: "terminal", text: "no-terminal"}
        ],
        ruleAction: (state, data) => {
            let result = {
                type: "no-terminal",
                text: data[1]
            };
            return state["right_side"].concat(result);
        }
    }, {
        rightHand: [
            {type: "no-terminal", text: "right_side"},
            {type: "terminal", text: "terminal"}
        ],
        ruleAction: (state, data) => {
            let result = {
                type: "terminal",
                text: data[1]
            };
            return state["right_side"].concat(result);
        }
    }, {
        rightHand: [
            {type: "terminal", text: "no-terminal"}
        ], ruleAction: (state, data) => {
            let result = {
                type: "no-terminal",
                text: data[0]
            };
            return [result];
        }
    }, {
        rightHand: [
            {type: "terminal", text: "terminal"}
        ],
        ruleAction: (state, data) => {
            let result = {
                type: "terminal",
                text: data[0]
            };
            return [result];
        }
    }]
};

module.exports.bnfGrammarString = bnfGrammarString;
module.exports.bnfGrammar = bnfGrammar;
