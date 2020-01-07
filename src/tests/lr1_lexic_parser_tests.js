const rewire = require('rewire');
const expect = require('chai').expect;
const parser = rewire("../parser_builder/lexic_parser");

describe("Lexic Parser", () => {
    describe("isNewLine", () => {
      const isNewLine = parser.__get__('isNewLine');
        it("returns true for new line", () => {
            expect(isNewLine('\n')).to.be.equal(true);
        });
        it("returns true for carriage return", () => {
            expect(isNewLine('\r')).to.be.equal(true);
        });
        it("returns true for combined new line", () => {
            expect(isNewLine('\r\n')).to.be.equal(true);
        });
    });
});
/*
exports.testIsNewLine = (test) ->
  test.equal parser.isNewLine('\n'), true
  test.equal parser.isNewLine('\r'), true
  test.equal parser.isNewLine('\r\n'), true
  test.done()

exports.testIsNumeric = (test) ->
  test.equal parser.isNumeric('1'), true
  test.equal parser.isNumeric('0'), true
  test.equal parser.isNumeric('9'), true
  test.equal parser.isNumeric('a'), false
  test.equal parser.isNumeric('+'), false
  test.equal parser.isNumeric('f'), false
  test.done()

exports.testIsAlphabetic = (test) ->
  test.equal parser.isAlphabetic('a'), true
  test.equal parser.isAlphabetic('B'), true
  test.equal parser.isAlphabetic('z'), true
  test.equal parser.isAlphabetic('ó'), true
  test.equal parser.isAlphabetic('ñ'), true
  test.equal parser.isAlphabetic('1'), false
  test.equal parser.isAlphabetic('9'), false
  test.equal parser.isAlphabetic('+'), false
  test.done()

module.exports.testStateMachine =
  setUp: (callback) ->
    @stateMachine = new parser.BNFLexer
    callback()

  tearDown: (callback) ->
    callback()

  testSimpleNoTerminal: (test) ->
    testToken = "<no-terminal>"
    expected =
      type: "no-terminal"
      text: "no-terminal"
    @stateMachine.setString testToken
    test.deepEqual @stateMachine.getNextToken(), expected
    test.done()

  testSimpleTerminal: (test) ->
    testToken = '"terminal"'
    expected =
      type: "terminal"
      text: "terminal"
    @stateMachine.setString testToken
    test.deepEqual @stateMachine.getNextToken(), expected
    test.done()

  testAssignmentToken: (test) ->
    testToken = "::="
    expected =
      type: "assignment"
      text: "::="
    @stateMachine.setString testToken
    test.deepEqual @stateMachine.getNextToken(), expected
    test.done()

  testBadToken: (test) ->
    @stateMachine.setString "a"
    test.equal @stateMachine.getNextToken(), null
    test.done()

  testTwoTokens: (test) ->
    testString = '<E>"F"'
    expected = [
      type: "no-terminal"
      text: "E"
    ,
      type: "terminal"
      text: "F"
    ]
    @stateMachine.setString testString
    test.deepEqual @stateMachine.getNextToken(), expected[0]
    test.deepEqual @stateMachine.getNextToken(), expected[1]
    test.done()

  testRule: (test) ->
    testString = '<Goal> ::= <First>"Second"<Third>'
    expected = [
      type: "no-terminal"
      text: "Goal"
    ,
      type: "assignment"
      text: "::="
    ,
      type: "no-terminal"
      text: "First"
    ,
      type: "terminal"
      text: "Second"
    ,
      type: "no-terminal"
      text: "Third"
    ]
    @stateMachine.setString testString
    test.deepEqual @stateMachine.getNextToken(), expected[0]
    test.deepEqual @stateMachine.getNextToken(), expected[1]
    test.deepEqual @stateMachine.getNextToken(), expected[2]
    test.deepEqual @stateMachine.getNextToken(), expected[3]
    test.deepEqual @stateMachine.getNextToken(), expected[4]
    test.done()

  testGrammar: (test) ->
    testString =
      """<Goal> ::= <A>

         <A> ::= "B"

         <A> ::= <C>
      """
    expected = [
      type: "no-terminal"
      text: "Goal"
    ,
      type: "assignment"
      text: "::="
    ,
      type: "no-terminal"
      text: "A"
    ,
      type: "new-line"
      text: ""
    ,
      type: "no-terminal"
      text: "A"
    ,
      type: "assignment"
      text: "::="
    ,
      type: "terminal"
      text: "B"
    ,
      type: "new-line"
      text: ""
    ,
      type: "no-terminal"
      text: "A"
    ,
      type: "assignment"
      text: "::="
    ,
      type: "no-terminal"
      text: "C"
    ]
    @stateMachine.setString testString
    i = 0
    while not @stateMachine.isEmpty()
      result = @stateMachine.getNextToken()
      unless result
        break
      test.deepEqual result, expected[i]
      i++
    test.done()


 */
