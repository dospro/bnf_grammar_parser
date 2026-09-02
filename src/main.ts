#!/usr/bin/env node
/**
 * CLI entry point for the LR(1) parser generator
 */

import {realpathSync} from "node:fs";
import {parseArgs} from "node:util";

const VERSION = "1.0.0";
const USAGE = `lr1 — LR(1) parser generator

Usage:
  lr1 <command> [options]

Commands:
  bootstrap            Generate the root BNF tables (tables.json)
  build <grammar.bnf>  Generate parser tables for a grammar
  parse <source>       Parse a source file using generated tables

Options:
  -h, --help           Show this help
  -V, --version        Show version

Run 'lr1 <command> --help' for command-specific options.
`;

export async function main(argv: string[]): Promise<number> {
    const command = argv[0];

    if (command === undefined || command === "-h" || command === "--help") {
        console.log(USAGE);
        return 0;
    }

    if (command === "-V" || command === "--version") {
        console.log(VERSION);
        return 0;
    }

    console.error(`error: unknown command '${command}'`);
    console.error("Run 'lr1 --help' for a list of commands.");
    return 1;
}

const entryPoint = process.argv[1];
if (entryPoint !== undefined && realpathSync(entryPoint) === import.meta.filename) {
    main(process.argv.slice(2))
        .then(code => {
            process.exitCode = code;
        })
        .catch(err => {
            console.error(`error: ${err instanceof Error ? err.message : String(err)}`);
            process.exitCode = 1;
        });
}