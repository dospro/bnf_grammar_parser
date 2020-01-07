import {Grammar} from "../parser_builder/bnf_grammar";

export const parenthesisGrammarString = `
<goal> ::= <list>
<list> ::= <list><pair>
<list> ::= <pair>
<pair> ::= "(" <pair> ")"
<pair> ::= "(" ")"
`;

export const parenthesisTokens = [
    {type: "no-terminal", text: "list"},
    {type: "no-terminal", text: "pair"},
    {type: "terminal", text: "("},
    {type: "terminal", text: ")"}
];

export const parenthesisGrammar2: Grammar = {
    "goal": [{
        predicate: [
            {type: "no-terminal", text: "list"}
        ]
    }],
    "list": [
        {
            predicate: [
                {type: "no-terminal", text: "list"},
                {type: "no-terminal", text: "pair"}
            ]
        },
        {
            predicate: [
                {type: "no-terminal", text: "pair"}
            ]
        }
    ],
    "pair": [
        {
            predicate: [
                {type: "terminal", text: "("},
                {type: "no-terminal", text: "pair"},
                {type: "terminal", text: ")"}
            ]
        },
        {
            predicate: [
                {type: "terminal", text: "("},
                {type: "terminal", text: ")"}
            ]
        }]
};

export const parenthesisGrammar = {
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
