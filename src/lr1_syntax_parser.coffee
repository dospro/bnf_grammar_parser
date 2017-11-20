bnfGrammarString = """
<goal> ::= <rules_list>
<rules_list> ::= <rules_list><rule>
<rules_list> ::= <rule>
<rule> ::= "no_terminal" "::=" <right_side>
<right_side> ::= <right_side> "no-terminal"
<right_side> ::= <right_side> "terminal"
<right_side> ::= "no-terminal"
<right_side> ::= "terminal"
"""

exports.bnfGrammar =
  "goal": [[
    type: "no-terminal"
    text: "rules_list"
  ]]
  "rules_list": [[
    type: "no-terminal"
    text: "rules_list"
  ,
    type: "no-terminal"
    text: "rule"
  ], [
    type: "no-terminal"
    text: "rule"
  ]]
  "rule": [[
    type: "terminal"
    text: "no_terminal"
  ,
    type: "terminal"
    text: "::="
  ,
    type: "no-terminal"
    text: "right_side"
  ]]
  "right_side": [[
    type: "no-terminal"
    text: "right_side"
  ,
    type: "terminal"
    text: "no_terminal"
  ], [
    type: "no-terminal"
    text: "right_side"
  ,
    type: "terminal"
    text: "terminal"

  ], [
    type: "terminal"
    text: "no_terminal"
  ], [
    type: "terminal"
    text: "terminal"
  ]]

exports.printFormattedGrammar = (grammar) ->
  for left_side of grammar
    for rule in grammar[left_side]
      process.stdout.write "<#{left_side}> ::= "
      for token in rule
        if token.type == "terminal"
          process.stdout.write "\"#{token.text}\" "
        else
          process.stdout.write "<#{token.text}> "
      process.stdout.write "\b\n"

exports.sample_element =
  leftHand: "goal"
  rightHand: exports.bnfGrammar["goal"][0]
  pointPosition: 0

exports.closure = (item, grammar) ->
  queuedItems = [item]
  finalItemsSet = []

  while queuedItems.length > 0
    currentItem = queuedItems.pop()
    console.log "Closure to %o", currentItem
    finalItemsSet.push currentItem

    # get token next to point
    point = currentItem.pointPosition
    if point >= currentItem.rightHand.length
      continue

    tokenNextToPoint = currentItem.rightHand[point]

    if tokenNextToPoint.type == "terminal"
      continue

    # We have a no terminal, add all the rules for that no-terminal
    leftHand = tokenNextToPoint.text
    rules = grammar[leftHand]
    for rule in rules
      newItem =
        leftHand: leftHand
        rightHand: rule
        pointPosition: 0

      # If newItem is not in finalItemsSet
      queuedItems.push newItem
  return finalItemsSet

exports.getFirstsSet = (noTerminal, grammar) ->
  firstsSet = new Set
  todoTokens = [noTerminal]
  while todoTokens.length > 0
    nextNoTerminal = todoTokens.pop()
    rules = grammar[nextNoTerminal]
    for rule in rules
      if rule[0].type == "no-terminal"
        todoTokens.push rule[0].text
      else
        console.log "Found %o", rule[0].text
        firstsSet.add rule[0].text
  return firstsSet


exports.goto = (itemsSet, token) ->
  newItems = []
  for item in itemsSet
    if exports.compareItems item.rightHand[item.pointPosition], token
      newItem =
        leftHand: item.leftHand
        rightHand: item.rightHand
        pointPosition: item.pointPosition + 1
      closureItems = exports.closure newItem
      for i in closureItems
        newItems.push newItem
  return newItems


exports.compareItems = (itemA, itemB) ->
  if itemA.type == itemB.type and itemA.text == itemB.text
    return true
  return false
