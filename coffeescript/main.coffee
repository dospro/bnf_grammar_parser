fs = require "fs"
parser = require "./lr1_lexic_parser"

console.log "Grammar Parser v1"


load_bnf_file = (filename) ->
  fs.readFile filename, "utf-8", (error, data) ->
    if error?
      throw error
    tokenizer = new parser.StateMachine
    tokenizer.setString data
    while not tokenizer.isEmpty()
      console.log "Token: %o", tokenizer.getNextToken()

load_bnf_file "LGE.bnf"