###* lr1_syntax_parser_tests.coffee
  # Set of tests for the syntax parser
###
syntax = require "../lr1_syntax_parser"

parenthesisGrammar =
  "goal": [[
    type: "no-terminal"
    text: "list"
  ]]
  "list": [[
    type: "no-terminal"
    text: "list"
  ,
    type: "no-terminal"
    text: "pair"
  ], [
    type: "no-terminal"
    text: "pair"
  ]]
  "pair": [[
    type: "terminal"
    text: "("
  ,
    type: "no-terminal"
    text: "pair"
  ,
    type: "terminal"
    text: ")"
  ], [
    type: "terminal"
    text: "("
  ,
    type: "terminal"
    text: ")"
  ]]

testSyntaxParser =
  setUp: (callback) ->
    callback()

  tearDown: (callback) ->
    callback()

  testGetFirstsSetFromGoal: (test) ->
    ###*
    # Tests getFirstsSet method returns the correct terminal
    # from parenthesis grammar.
    ###
    result = syntax.getFirstsSet "goal", parenthesisGrammar
    test.deepEqual result, ["("]
    test.done()

  testGetFirstsSetFromMidRule: (test) ->
    result = syntax.getFirstsSet "pair", parenthesisGrammar
    test.deepEqual result, ["("]
    test.done()

  testGetFirstsSetOnBiggerGrammar: (test) ->
    result = syntax.getFirstsSet "goal", syntax.bnfGrammar
    test.deepEqual result, ["no_terminal"]
    test.done()

  testGetFirstsSetMultipleElements: (test) ->
    result = syntax.getFirstsSet "right_side", syntax.bnfGrammar
    test.deepEqual result, ["no_terminal", "terminal"]
    test.done()

  testGetLookAheadsEmpty: (test) ->
    ###* Tests getLookAhead method returns empty set ###
    testItem =
      leftHand: "goal"
      rightHand: parenthesisGrammar["goal"][0]
      pointPosition: 0
      lookAheads: []
    result = syntax.getLookAheads testItem, parenthesisGrammar
    test.ok result.length == 0
    test.done()

  testGetLookAheads: (test) ->
    ###* Tests getLookAhead method returns a correct set of look ahead symbols ###
    testItem =
      leftHand: "list"
      rightHand: parenthesisGrammar["list"][0]
      pointPosition: 0
      lookAheads: []
    result = syntax.getLookAheads testItem, parenthesisGrammar
    test.deepEqual result, ["("]
    test.done()

  testClosure: (test) ->
    testItem =
      leftHand: "goal"
      rightHand: parenthesisGrammar["goal"][0]
      pointPosition: 0
      lookAheads: ["$"]

    cc0 = syntax.closure(testItem, parenthesisGrammar)
    test.equal cc0.length, 9
    #console.log "cc0: %o", cc0
    test.done()

exports.testSyntaxParser = testSyntaxParser