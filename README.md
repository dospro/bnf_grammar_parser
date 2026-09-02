# BNF Grammar Parser

A command-line tool for building canonical LR(1) parsers from grammars written in
BNF. The intended output is a standalone TypeScript parser that applications can
use with their own lexer.

> [!IMPORTANT]
> This project is under active development. The LR(1) table-building engine is
> working and tested, but the `bootstrap`, `build`, and `parse` CLI commands are
> not wired yet. Currently, the CLI supports help and version output.

## Tech stack

- **Node.js** — runtime and CLI platform; currently developed with Node 26
- **TypeScript 7** — strict TypeScript compiled as native ESM targeting ES2023
- **`node:test`** — built-in test runner, with `node:assert/strict` assertions
- **npm** — dependency and script management
- **No runtime dependencies** — the project currently depends only on Node APIs

## How it works

The project separates grammar processing into three stages:

1. A hardcoded grammar describing BNF itself is passed to the LR(1) engine to
   produce the bootstrap parsing tables.
2. Those tables parse a `.bnf` file into grammar data, which is passed back to
   the LR(1) engine to build tables for the described language.
3. A consumer supplies a lexer for that language and uses the generated parser
   to parse its own source text.

Grammar files describe syntax only. Lexing and application-specific semantics
remain the responsibility of the generated parser's consumer.

## Requirements

- Node.js 22 or newer; Node.js 26 is the currently tested development version
- npm

## Install for development

```sh
git clone https://github.com/dospro/bnf_grammar_parser.git
cd bnf_grammar_parser
npm install
```

There are no production dependencies. `npm install` installs TypeScript and the
Node.js type definitions used to build the project.

## Build and run

Compile the supported production sources into `dist/`:

```sh
npm run build
```

Run the compiled CLI directly:

```sh
node dist/main.js --help
node dist/main.js --version
```

To expose the local executable as `lr1` while developing:

```sh
npm link
lr1 --help
```

The CLI currently advertises its intended command shape:

```text
lr1 bootstrap
lr1 build <grammar.bnf>
lr1 parse <source>
```

These three commands are still under development. Until they are wired, passing
one of them produces an unknown-command error.

## Tests

Run the complete test workflow:

```sh
npm test
```

This command:

1. builds the production sources into `dist/`;
2. compiles the TypeScript tests from `src/test/` into `dist/test/`;
3. runs the compiled tests with `node:test`.

The current suite exercises `ParserBuilder` through its public action and goto
tables. It covers grammar validation, table construction, LR(1) lookahead and
FIRST behavior, and shift/reduce and reduce/reduce conflict reporting.

The individual npm scripts are:

| Command | Purpose |
|---|---|
| `npm run build` | Compile the supported production sources into `dist/` |
| `npm run build:test` | Compile test sources and their LR(1) dependencies into `dist/` |
| `npm test` | Build everything and run the compiled test suite |

## Project structure

```text
bnf_grammar_parser/
├── src/
│   ├── main.ts             CLI entry point
│   ├── lr1/                Canonical LR(1) engine, grammar model, and tables
│   ├── bnf/                BNF lexer, meta-grammar, and grammar front end
│   ├── commands/           CLI command handlers under development
│   ├── common/             Shared utilities and result types
│   ├── examples/           Legacy arithmetic example being migrated
│   └── test/               TypeScript behavioral tests
├── grammars/
│   ├── bnf.bnf             BNF language grammar
│   └── examples/           Example input grammars
├── harness/                Design decisions, current state, and refactor notes
├── dist/                   Generated JavaScript, source maps, and compiled tests
├── package.json            npm scripts and development dependencies
├── tsconfig.json           Production TypeScript configuration
└── tsconfig.test.json      Test compilation configuration
```

The `harness/` directory is development documentation, not part of the shipped
tool. It records the current refactor state, design decisions, LR(1) algorithm
notes, and known engine issues.

## Project status

Completed foundations include:

- strict ESM TypeScript configuration;
- a flat, serializable grammar model;
- eager canonical LR(1) state construction;
- action and goto table construction;
- shift/reduce and reduce/reduce conflict detection;
- behavioral coverage for the `ParserBuilder` public interface.

The next milestone is wiring the bootstrap table generator into the CLI. After
that, the `build` command will connect BNF input to parser generation.
