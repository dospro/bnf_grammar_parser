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

bnfGrammar =
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

class LR1Item
  constructor: (params) ->
    if not params?
      params = {}
    @leftHand = params.leftHand or ""
    @rightHand = params.rightHand or []
    @pointPosition = params.pointposition or 0
    @lookAheads = params.lookAheads or []

printFormattedGrammar = (grammar) ->
  for left_side of grammar
    grammar[left_side].forEach (rule) ->
      process.stdout.write "<#{left_side}> ::= "
      rule.forEach (token) ->
        if token.type == "terminal"
          process.stdout.write "\"#{token.text}\" "
        else
          process.stdout.write "<#{token.text}> "
      process.stdout.write "\b\n"

sample_element =
  leftHand: "goal"
  rightHand: bnfGrammar["goal"][0]
  pointPosition: 0

closure = (item, grammar) ->
  queuedItems = [item]
  finalItemsSet = []

  while queuedItems.length > 0
    currentItem = queuedItems.pop()
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
    rules.forEach (rule) ->
      lookAheads = getLookAheads currentItem, grammar
      lookAheads.forEach (symbol) ->
        newItem = new LR1Item
          leftHand: leftHand
          rightHand: rule
          pointPosition: 0
          lookAheads: [symbol]

        #console.log "Created new item %o", newItem
        # If newItem is not in finalItemsSet
        wasNotProcessed = finalItemsSet.every (item) =>
          return not compareLR1Items(item, newItem)

        if wasNotProcessed
          queuedItems.push newItem
  return finalItemsSet

compareLR1Items = (item1, item2) ->
  return JSON.stringify(item1) == JSON.stringify(item2)

getLookAheads = (item, grammar) ->
  ###* Given an LR1, finds the set of look ahead symbols ###
  if item.pointPosition >= item.rightHand.length - 1
    return item.lookAheads

  nextItem = item.rightHand[item.pointPosition + 1]
  if nextItem.type is "terminal"
    return [nextItem.text]

  lookAheads = getFirstsSet(nextItem.text, grammar)
  return lookAheads


getFirstsSet = (noTerminal, grammar) ->
  firstsSet = new Set
  todoTokens = [noTerminal]
  doneTokens = []
  while todoTokens.length > 0
    nextNoTerminal = todoTokens.pop()
    doneTokens.push nextNoTerminal
    rules = grammar[nextNoTerminal]
    rules.forEach (rule) =>
      if rule[0].type == "no-terminal"
        text = rule[0].text
        if text not in doneTokens and text not in todoTokens
          todoTokens.push text
      else
        firstsSet.add rule[0].text
  return Array.from firstsSet


goto = (itemsSet, token) ->
  newItems = []
  for item in itemsSet
    if compareItems item.rightHand[item.pointPosition], token
      newItem =
        leftHand: item.leftHand
        rightHand: item.rightHand
        pointPosition: item.pointPosition + 1
      closureItems = closure newItem
      for i in closureItems
        newItems.push newItem
  return newItems


compareItems = (itemA, itemB) ->
  if itemA.type == itemB.type and itemA.text == itemB.text
    return true
  return false

exports.printFormattedGrammar = printFormattedGrammar
exports.closure = closure
exports.getLookAheads = getLookAheads
exports.getFirstsSet = getFirstsSet
exports.goto = goto
exports.compareItems = compareItems
exports.LR1Item = LR1Item
exports.compareLR1Items = compareLR1Items
exports.bnfGrammar = bnfGrammar