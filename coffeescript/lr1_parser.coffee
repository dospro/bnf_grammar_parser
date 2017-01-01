fs = require "fs"


states_matrix =
  0:
    '<': 1
    '"': 2
    ':': 3
  1:
    '>': 5 # Non terminal
  2:
    '"': 6 # Terminal
  3:
    ":": 4
  4:
    "=": 7 # Assignment

final_states = [5, 6, 7]

exports.is_new_line = (character) ->
  if character == '\r\n'
    return true
  if character == '\r'
    return true
  if character == '\n'
    return true
  return false

exports.is_numeric = (character) ->
  return not isNaN(parseFloat(character)) and isFinite character

exports.is_alphabetic = (character) ->
  unless character.length == 1
    return false

  lower_char = character.toLowerCase()
  if 'a' <= lower_char <= 'z'
    return true

  if lower_char in ['á', 'é', 'í', 'ó', 'ú', 'ñ']
    return true

  return false

exports.is_alphanumeric = (character) ->
  if @is_alphabetic character
    return true

  if @is_numeric character
    return true

  return false

exports.is_identifier_character = (character) ->
  if @is_alphanumeric character
    return true

  if character in ['-', '_']
    return true

  return false

class StateMachine
  constructor: ->
    @current_state = 0
    @current_token = ""
    @current_char = null
    @string = null
    @current_string_position = 0

  set_string: (string) ->
    @string = string

  get_next_token: ->
    unless @string?
      console.log "No string"
      return null

    @current_token = ""
    while @current_string_position < @string.length
      next_char = @string[@current_string_position]
      console.log "Character: #{next_char}"

      console.log "Using the matrix [#{@current_state}][#{next_char}]"
      next_state = states_matrix[@current_state][next_char]
      console.log "Next state #{next_state}"
      if next_state?
        @current_token = @current_token.concat next_char
        @current_state = next_state


        if next_state in final_states
          console.log "Reached a final state"
          @current_state = 0
          @current_string_position++
          switch next_state
            when 5
              token =
                type: "no-terminal"
                text: @current_token.substring(1, @current_token.length - 1)
              return token
            when 6
              token =
                type: "terminal"
                text: @current_token.substring(1, @current_token.length - 1)
              return token
            when 7
              token =
                type: "assignment"
                text: @current_token
              return token

      else
        switch @current_state
          when 1
            console.log "In state 1: Matching a no terminal"
            if exports.is_identifier_character next_char
              @current_token = @current_token.concat next_char
          when 2
            console.log "In state 2: Matching a terminal"
            if next_char != '"'
              @current_token = @current_token.concat next_char
          else
            console.log "Unkown state"
            return null
      @current_string_position++

exports.StateMachine = StateMachine

load_bnf_file = (filename) ->
  fs.readFile filename, "utf-8", (error, data) ->
    if error?
      throw error
