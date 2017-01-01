parser = require "../coffeescript/lr1_parser"

exports.test_is_new_line = (test) ->
  test.equal parser.is_new_line('\n'), true
  test.equal parser.is_new_line('\r'), true
  test.equal parser.is_new_line('\r\n'), true
  test.done()

exports.test_is_numeric = (test) ->
  test.equal parser.is_numeric('1'), true
  test.equal parser.is_numeric('0'), true
  test.equal parser.is_numeric('9'), true
  test.equal parser.is_numeric('a'), false
  test.equal parser.is_numeric('+'), false
  test.equal parser.is_numeric('f'), false
  test.done()

exports.test_is_alphabetic = (test) ->
  test.equal parser.is_alphabetic('a'), true
  test.equal parser.is_alphabetic('B'), true
  test.equal parser.is_alphabetic('z'), true
  test.equal parser.is_alphabetic('ó'), true
  test.equal parser.is_alphabetic('ñ'), true
  test.equal parser.is_alphabetic('1'), false
  test.equal parser.is_alphabetic('9'), false
  test.equal parser.is_alphabetic('+'), false
  test.done()

module.exports.test_state_machine =
  setUp: (callback) ->
    @stateMachine = new parser.StateMachine
    callback()

  tearDown: (callback) ->
    console.log "Tear down"
    callback()

  test_simple_no_terminal: (test) ->
    test_token = "<no-terminal>"
    expected =
      type: "no-terminal"
      text: "no-terminal"
    @stateMachine.set_string test_token
    test.deepEqual @stateMachine.get_next_token(), expected
    test.done()

  test_simple_terminal: (test) ->
    test_token = '"terminal"'
    expected =
      type: "terminal"
      text: "terminal"
    @stateMachine.set_string test_token
    test.deepEqual @stateMachine.get_next_token(), expected
    test.done()

  test_assignment_token: (test) ->
    test_token = "::="
    expected =
      type: "assignment"
      text: "::="
    @stateMachine.set_string test_token
    test.deepEqual @stateMachine.get_next_token(), expected
    test.done()