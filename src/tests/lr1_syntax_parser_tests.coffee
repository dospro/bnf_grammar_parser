syntax = require "../lr1_syntax_parser"

module.exports.testSyntaxParser =
  setUp: (callback) ->
    callback()

  tearDown: (callback) ->
    callback()

  testSomething: (test) ->
    test.equal 1, 1
    test.done()
