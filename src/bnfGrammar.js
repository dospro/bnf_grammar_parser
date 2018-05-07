bnfGrammarString = `
<goal> ::= <rules_list>
<rules_list> ::= <rules_list><rule>
<rules_list> ::= <rule>
<rule> ::= "no-terminal" "::=" <right_side>
<right_side> ::= <right_side> "no-terminal"
<right_side> ::= <right_side> "terminal"
<right_side> ::= "no-terminal"
<right_side> ::= "terminal"
`;

bnfGrammar = {
    "goal": [[
        {type: "no-terminal", text: "rules_list"}
    ]],
    "rules_list": [[
        {type: "no-terminal", text: "rules_list"},
        {type: "no-terminal", text: "rule"}
    ], [
        {type: "no-terminal", text: "rule"}
    ]],
    "rule": [[
        {type: "terminal", text: "no-terminal"},
        {type: "terminal", text: "::="},
        {type: "no-terminal", text: "right_side"}
    ]],
    "right_side": [[
        {type: "no-terminal", text: "right_side"},
        {type: "terminal", text: "no-terminal"}
    ], [
        {type: "no-terminal", text: "right_side"},
        {type: "terminal", text: "terminal"}

    ], [
        {type: "terminal", text: "no-terminal"}
    ], [
        {type: "terminal", text: "terminal"}
    ]]
};