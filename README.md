# Grammar Parser

BNF Grammar Parser is an application written in typescript that can read grammar files
in BNF format and produce LR1 syntax parsers.

# How it works

This application has two parts:

* Grammar tables builder
* Parser Generator

## Grammar Tables Builder

This part of the application will build LR1 tables (Action table, Goto table) for actually parsing a grammar.
The output is a json which can be easily loaded by other applications, so you can parse a BNF grammar from its tokens.

## Parser Generator

The parser generator will read a BNF grammar, use the tables produced by Grammar Tables Builder and produce code to 
parse the language in the grammar. 

# Sample Parser

The code includes some sample parsers produced with this application and shows 
how to use them.

Basically, you have a bnf grammar for arithmetic expressions. You pass the grammar to the Parser Generator, 
which will produce the tables for parsing expressions.

Pieces for parsing:
* Lexer: Transform the stream of characters into "tokens"
* Syntax parser: You already have the tables, so you only need to build the syntax tree.
* Generator: Here you need to implement one of the different techniques. In this example, I implement the Visitor pattern.

Some notes on the generator.

Parsing the tokens using the tables won't produce any result by itself. The only thing it can tell you is 
if an expression is syntactically correct.

The simple solution is to build the tree on every reduce action.
Once you have a tree you can apply the visitor pattern based on the grammar rules.
You need to build your own lexer, then using the tables you created, build the AST. Once you get the AST,
you can do pretty much whatever you want. 
