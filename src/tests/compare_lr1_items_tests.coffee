###* lr1_syntax_parser_tests.coffee
  # Set of tests for the syntax parser
###
syntax = require "../lr1_syntax_parser"


testCompareLR1Items =
  setUp: (callback) ->
    @testItem = new syntax.LR1Item
      leftHand: 'testRule'
      rightHand: [
        {
          type: 'no-terminal'
          test: 'testNoTerminal'
        }
      ]
      pointPosition: 0
      lookAheads: ['t']
    callback()

  tearDown: (callback) ->
    callback()


  testEqualItems: (test) ->
    ###* Tests compareLR1Items ###
    equalItem = new syntax.LR1Item
      leftHand: 'testRule'
      rightHand: [
        {
          type: 'no-terminal'
          test: 'testNoTerminal'
        }
      ]
      pointPosition: 0
      lookAheads: ['t']
    result = syntax.compareLR1Items @testItem, equalItem
    test.equal result, true
    test.done()

  testDifferentLeftHand: (test) ->
    ###* Tests compareLR1Items ###
    equalItem = new syntax.LR1Item
      leftHand: 'testRule2'
      rightHand: [
        {
          type: 'no-terminal'
          test: 'testNoTerminal'
        }
      ]
      pointPosition: 0
      lookAheads: ['t']
    result = syntax.compareLR1Items @testItem, equalItem
    test.equal result, false
    test.done()

  testDifferentRightHandSize: (test) ->
    equalItem = new syntax.LR1Item
      leftHand: 'testRule'
      rightHand: [
        {
          type: 'no-terminal'
          test: 'testNoTerminal'
        }
        {
          type: 'no-terminal'
          test: 'testNoTerminal1'
        }
      ]
      pointPosition: 0
      lookAheads: ['t']
    result = syntax.compareLR1Items @testItem, equalItem
    test.equal result, false
    test.done()

  testSameSizeDifferentRightHand: (test) ->
    equalItem = new syntax.LR1Item
      leftHand: 'testRule'
      rightHand: [
        {
          type: 'no-terminal'
          test: 'testNoTerminal1'
        }
      ]
      pointPosition: 0
      lookAheads: ['t']
    result = syntax.compareLR1Items @testItem, equalItem
    test.equal result, false
    test.done()


exports.testCompareLR1Items = testCompareLR1Items