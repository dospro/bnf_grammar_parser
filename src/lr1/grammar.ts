/**
 * One symbol in a production's right-hand side.
 *
 * A terminal's `name` is a token type, not source text. A non-terminal's
 * `name` is the left-hand side of the productions that define it.
 *
 * This is deliberately not a lexer's `Token`: a grammar has only terminals
 * and non-terminals, while a lexer has source text and its own implementation
 * states as well.
 */
export type GrammarSymbol =
    | { readonly kind: "terminal"; readonly name: string }
    | { readonly kind: "no-terminal"; readonly name: string };

export function sameSymbol(a: GrammarSymbol, b: GrammarSymbol): boolean {
    return a.kind === b.kind && a.name === b.name;
}

/**
 * A single rule: `leftHand ::= rightHand`.
 *
 * Productions are identified by their index in `Grammar.productions`, so their
 * order is meaningful and must stay stable. This BNF dialect does not express
 * epsilon, therefore `rightHand` is never empty.
 */
export interface Production {
    readonly leftHand: string;
    readonly rightHand: readonly GrammarSymbol[];
}

/**
 * A complete, serializable grammar and the non-terminal where parsing starts.
 *
 * Grammars are pure data: semantic actions belong to consumers that walk the
 * parse tree, not to the grammar representation.
 */
export interface Grammar {
    readonly start: string;
    readonly productions: readonly Production[];
}
