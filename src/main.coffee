fs = require "fs"
lexic = require "./lr1_lexic_parser"
syntax = require "./lr1_syntax_parser"

console.log "Grammar Parser v1"


load_bnf_file = (filename) ->
  fs.readFile filename, "utf-8", (error, data) ->
    if error?
      throw error
    tokenizer = new lexic.StateMachine
    tokenizer.setString data
    while not tokenizer.isEmpty()
      console.log "Token: %o", tokenizer.getNextToken()

#load_bnf_file "LGE.bnf"
syntax.printFormattedGrammar syntax.bnfGrammar

#result = syntax.closure syntax.sample_element, syntax.bnfGrammar
#for i in result
#  console.log "Result: %o", i

#token =
#  type: "terminal"
#  text: "no_terminal"
#moved = syntax.goto result, token

#console.log "Goto: %o", moved

#firsts = syntax.getFirstsSet "goal", syntax.bnfGrammar
#console.log firsts