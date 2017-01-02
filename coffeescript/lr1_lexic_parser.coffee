exports = module.exports = {}

NO_TERMINAL = 5
TERMINAL = 6
ASSIGNMENT = 7
NEW_LINE = 8
ERROR = 9
TOKEN_READY = 100

statesMatrix =
  0:
    ' ': 0
    '<': 1
    '"': 2
    ':': 3
    '%': 10
  1:
    '>': NO_TERMINAL # Non terminal
  2:
    '"': TERMINAL # Terminal
  3:
    ":": 4
  4:
    "=": ASSIGNMENT # Assignment


exports.isNewLine = (character) ->
  if character == '\r\n'
    return true
  if character == '\r'
    return true
  if character == '\n'
    return true
  return false

exports.isNumeric = (character) ->
  return not isNaN(parseFloat(character)) and isFinite character

exports.isAlphabetic = (character) ->
  unless character.length == 1
    return false

  lower_char = character.toLowerCase()
  if 'a' <= lower_char <= 'z'
    return true

  if lower_char in ['á', 'é', 'í', 'ó', 'ú', 'ñ']
    return true

  return false

exports.isAlphanumeric = (character) ->
  if @isAlphabetic character
    return true

  if @isNumeric character
    return true

  return false

exports.isIdentifierCharacter = (character) ->
  if @isAlphanumeric character
    return true

  if character in ['-', '_']
    return true

  return false

class StateMachine
  constructor: ->
    @currentState = 0
    @currentToken = ""
    @currentChar = null
    @string = null
    @currentStringPosition = 0
    @tokenReady = false
    @tokenType = null

  setString: (string) ->
    @string = string

  isEmpty: ->
    unless @string
      return true
    if @currentStringPosition >= @string.length
      return true
    return false

  getNextToken: ->
    if @isEmpty()
      console.log "ERROR: There is no more input"
      return null

    @currentToken = ""
    while @currentStringPosition < @string.length
      nextChar = @string[@currentStringPosition]
      nextState = @_transition(@currentState, nextChar)
      @currentState = nextState
      @currentStringPosition++
      @currentToken = @currentToken.concat nextChar
      if nextState == 0
        @currentToken = ""
      if nextState == ERROR
        console.log "Stop"
        return null
      if @isEmpty() and nextState == NEW_LINE
        @currentState = 0
        token =
          type: "new-line"
          text: ""
        return token
      if nextState == TOKEN_READY
        @currentState = 0
        @currentStringPosition--
        token =
          type: "new-line"
          text: ""
        return token
      if nextState == TERMINAL
        @currentState = 0
        token =
          type: "terminal"
          text: @currentToken.substring 1, @currentToken.length - 1
        return token
      if nextState == NO_TERMINAL
        @currentState = 0
        token =
          type: "no-terminal"
          text: @currentToken.substring 1, @currentToken.length - 1
        return token
      if nextState == ASSIGNMENT
        @currentState = 0
        token =
          type: "assignment"
          text: "::="
        return token


  _transition: (state, input) ->
    finalState = 9 # ERROR
    # console.log "State: #{state}, Input: #{input}"
    switch state
      when 0
        if exports.isNewLine input
          finalState = NEW_LINE
        else
          nextState = statesMatrix[state][input]
          unless nextState?
            console.log "Unkown input #{input}"
            break
          finalState = nextState
      when 1
        if exports.isIdentifierCharacter input
          finalState = state
        else
          nextState = statesMatrix[state][input]
          unless nextState
            console.log "Unkown input #{input}"
            break
          finalState = nextState
      when 2
        if input != '"'
          finalState = state
        else
          nextState = statesMatrix[state][input]
          unless nextState
            console.log "Unkown input #{input}"
            break
          finalState = nextState
      when 3, 4 # identifiers and assignment
        nextState = statesMatrix[state][input]
        unless nextState
          console.log "Unkown input #{input}"
          break
        finalState = nextState
      when 10
        if exports.isNewLine input
          finalState = 0
        else
          finalState = 10

      when NEW_LINE
        if exports.isNewLine input
          finalState = NEW_LINE
        else
          finalState = TOKEN_READY
    return finalState


exports.StateMachine = StateMachine


