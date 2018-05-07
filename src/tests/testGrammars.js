const parenthesisGrammarString = `
<goal> ::= <list>
<list> ::= <list><pair>
<list> ::= <pair>
<pair> ::= "(" <pair> ")"
<pair> ::= "(" ")"`;

const parenthesisGrammar = {
    "goal": [[
        {type: "no-terminal", text: "list"}
    ]],
    "list": [[
        {type: "no-terminal", text: "list"},
        {type: "no-terminal", text: "pair"}
    ], [
        {type: "no-terminal", text: "pair"}
    ]],
    "pair": [[
        {type: "terminal", text: "("},
        {type: "no-terminal", text: "pair"},
        {type: "terminal", text: ")"}
    ], [
        {type: "terminal", text: "("},
        {type: "terminal", text: ")"}
    ]]
};

exports.parenthesisGrammarString = parenthesisGrammarString;
exports.parenthesisGrammar = parenthesisGrammar;