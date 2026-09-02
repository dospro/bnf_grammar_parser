export type Action =
    | { readonly kind: "shift"; readonly nextState: number }
    | { readonly kind: "reduce"; readonly leftHand: string; readonly itemsToPull: number }
    | { readonly kind: "accept" };

export interface IActionTable {
    [state: number]: {
        [terminal: string]: Action
    }
}

/**
 * A cell that two different actions competed for — the grammar is not LR(1) at
 * this (state, terminal) pair.
 *
 * Whether this is a shift/reduce or a reduce/reduce conflict follows from the
 * two `kind` fields, so it is not stored separately.
 */
export interface Conflict {
    readonly state: number;
    readonly terminal: string;
    readonly existing: Action; // kept
    readonly incoming: Action; // discarded
}

/**
 * Structural equality for actions.
 *
 * Actions are built fresh at every call site, so identity comparison would
 * report two identical shifts as different. Two actions are the same when they
 * tell the parser to do the same thing.
 */
function sameAction(a: Action, b: Action): boolean {
    switch (a.kind) {
        case "shift":
            return b.kind === "shift" && a.nextState === b.nextState;
        case "reduce":
            return b.kind === "reduce"
                && a.leftHand === b.leftHand
                && a.itemsToPull === b.itemsToPull;
        case "accept":
            return b.kind === "accept";
    }
}

export class ActionTable {
    private readonly data: IActionTable = {};
    private readonly collisions: Conflict[] = [];

    /**
     * Records that on `terminal` the parser consumes the token and moves to
     * `nextState`.
     *
     * @param state - The state the parser is in
     * @param terminal - The lookahead token type that triggers the move
     * @param nextState - The state to move to
     */
    addShift(state: number, terminal: string, nextState: number): void {
        this.write(state, terminal, {kind: "shift", nextState});
    }

    /**
     * Records that on `terminal` the parser has recognized a complete right-hand
     * side and should reduce by a rule producing `leftHand`.
     *
     * At reduce time the parser pops `itemsToPull` entries off the stack, pushes
     * `leftHand`, and consults the goto table for the state to land in. The
     * lookahead token is *not* consumed — it is only inspected to decide that the
     * reduction applies.
     *
     * @param state - The state the parser is in
     * @param terminal - The lookahead token type that triggers the reduction
     * @param leftHand - The non-terminal the rule produces
     * @param itemsToPull - Stack entries to pop; the length of the rule's right-hand side
     */
    addReduce(state: number, terminal: string, leftHand: string, itemsToPull: number): void {
        this.write(state, terminal, {kind: "reduce", leftHand, itemsToPull});
    }

    /**
     * Records that on `terminal` the parse is complete and should succeed.
     *
     * Written for the item `goal -> ... .` — the start rule fully recognized — so
     * in practice `terminal` is the end-of-input marker `$`. Unlike a reduction,
     * accept carries no payload: nothing is popped and nothing is pushed, the
     * parser simply stops.
     *
     * @param state - The state the parser is in
     * @param terminal - The lookahead token type that completes the parse
     */
    addAccept(state: number, terminal: string): void {
        this.write(state, terminal, {kind: "accept"});
    }

    /**
     * Looks up what the parser should do in `state` when the lookahead is
     * `terminal`.
     *
     * `undefined` means no legal action exists — that is a syntax error, not a
     * missing entry. The table is sparse by design: most (state, terminal) pairs
     * are errors, so only the legal cells are stored.
     *
     * @param state - The state the parser is in
     * @param terminal - The lookahead token type
     * @returns The action to take, or `undefined` if the input is not valid here
     */
    getAction(state: number, terminal: string): Action | undefined {
        return this.data[state]?.[terminal];
    }

    /**
     * Every cell two different actions competed for, in the order they were
     * found.
     *
     * Empty means the grammar is LR(1). A non-empty list is a fact about the
     * grammar, not an error in the table: the table is still complete and still
     * usable, it just resolved each contested cell arbitrarily. Deciding whether
     * that is acceptable belongs to the caller.
     */
    get conflicts(): readonly Conflict[] {
        return this.collisions;
    }

    /**
     * Stores `action` at (`state`, `terminal`), the single point at which any
     * cell is assigned.
     *
     * Writing the same cell twice is normal and usually harmless: a state can
     * hold several items with the same symbol after the dot, and each one asks
     * for the identical shift. Those repeats are dropped silently.
     *
     * A second, *different* action is a genuine conflict. The first action is
     * kept and the second discarded, so the table does not depend on the order
     * states and items happen to be visited, and the collision is recorded for
     * `conflicts` rather than being lost to overwriting.
     *
     * @param state - The state the parser is in
     * @param terminal - The lookahead token type
     * @param action - What the parser should do
     */
    private write(state: number, terminal: string, action: Action): void {
        const row = this.getOrCreateRow(state);
        const existing = row[terminal];

        if (existing === undefined) {
            row[terminal] = action;
            return;
        }
        if (sameAction(existing, action)) {
            return;
        }
        this.collisions.push({state, terminal, existing, incoming: action});
    }

    /**
     * Returns the row of actions for `state`, creating an empty row if this is
     * the first action recorded for that state.
     *
     * Exists so `write` can reach a cell in a single expression. Assigning
     * to `this.data[state]` and then reading it back does not typecheck under
     * `noUncheckedIndexedAccess`: an index signature always yields
     * `T | undefined`, and neither the assignment nor an `in` check narrows it.
     * Returning the row directly hands callers a value the compiler knows is
     * present.
     *
     * @param state - Index of the parser state whose row is wanted
     * @returns The state's terminal-to-action map, mutable and safe to assign into
     */
    private getOrCreateRow(state: number): { [terminal: string]: Action } {
        const existing = this.data[state];
        if (existing !== undefined) {
            return existing;
        }
        const created: { [terminal: string]: Action } = {};
        this.data[state] = created;
        return created;
    }
}