import {ActionTable} from "./action_table.js";
import {sameSymbol, type Grammar, type GrammarSymbol, type Production} from "./grammar.js";

/** Sparse mapping from a state and non-terminal name to its destination state. */
export interface GotoTable {
    [key: number]: {
        [key: string]: number
    }
}

/** An LR(1) item: a production, a position within it, and one lookahead terminal. */
export interface LR1Item {
    /** Index of the item's production in `Grammar.productions`. */
    readonly production: number;

    /** Position of the dot in the production's right-hand side. */
    readonly dot: number;

    /** Terminal on which a completed item may reduce. */
    readonly lookAhead: string;
}

/** Structural equality for LR(1) items. */
function sameItem(a: LR1Item, b: LR1Item): boolean {
    return a.production === b.production
        && a.dot === b.dot
        && a.lookAhead === b.lookAhead;
}

/**
 * Compares two item collections as sets, so their array order is irrelevant.
 *
 * Canonical collections contain no duplicate items; under that invariant,
 * equal lengths plus membership in both collections establishes equality.
 */
function sameCollection(a: readonly LR1Item[], b: readonly LR1Item[]): boolean {
    if (a.length !== b.length) {
        return false;
    }
    return a.every(item => b.some(other => sameItem(item, other)));
}

/**
 * Builds the canonical LR(1) automaton for a grammar, and its parse tables with it.
 *
 * Construction is eager and single-pass: the builder validates the grammar,
 * creates the initial `$` lookahead item, applies closure, and expands every
 * reachable state. A state is numbered the moment it is discovered, so each edge
 * can be written to its table as soon as it is found — a terminal edge becomes a
 * shift, a non-terminal edge a goto entry, and a completed item a reduction or an
 * accept. The tables are the automaton stored for lookup, not a second structure
 * derived from it.
 *
 * This class operates only on grammar data. It does not tokenize or parse source
 * text, and it keeps productions identified by their stable array indices.
 */
export class ParserBuilder {
    /** Ordered grammar rules; `LR1Item.production` indexes this array. */
    private readonly productions: readonly Production[];

    /** Distinct closed LR(1) item collections; each array index is a state number. */
    private readonly canonicalCollection: LR1Item[][];

    private readonly gotoTable: GotoTable = {};
    private readonly actionTable: ActionTable = new ActionTable();

    /**
     * Builds every reachable canonical LR(1) state for `grammar`, filling the
     * action and goto tables as the states are discovered.
     *
     * The grammar must already be augmented: `grammar.start` must name exactly
     * one production whose completion means that the input is accepted.
     *
     * A grammar that is not LR(1) is not an error. The contested cells are
     * recorded on the action table and read back through its `conflicts`.
     *
     * @param grammar - Immutable grammar whose automaton and tables are built
     * @throws If the grammar does not have exactly one start production
     * @throws If a production references an undefined non-terminal
     */
    constructor(private readonly grammar: Grammar) {
        this.productions = grammar.productions;
        this.canonicalCollection = [];

        const definedNonTerminals = new Set(
            this.productions.map(production => production.leftHand),
        );
        for (const production of this.productions) {
            for (const symbol of production.rightHand) {
                if (symbol.kind === "no-terminal" && !definedNonTerminals.has(symbol.name)) {
                    throw new Error(`Undefined non-terminal ${symbol.name} referenced by production ${production.leftHand}`);
                }
            }
        }

        const startProductions = this.productions
            .flatMap((production, index) =>
                production.leftHand === this.grammar.start ? [index] : []);

        if (startProductions.length !== 1) {
            throw new Error(
                `Expected exactly one production for start symbol ${this.grammar.start}`,
            );
        }

        const initialProduction = startProductions[0]!;

        // Canonical LR(1) construction starts from the augmented start rule
        // with the end-of-input marker as its lookahead.
        const initialItem: LR1Item = {
            production: initialProduction,
            dot: 0,
            lookAhead: "$",
        };

        const cc0 = this.closure([initialItem]);

        // Each entry is the index of a registered state still to be expanded
        const queuedStates: number[] = [this.registerCollection(cc0).index];

        let nextState: number | undefined;
        while ((nextState = queuedStates.shift()) !== undefined) {
            const stateIndex = nextState;
            const currentCollection = this.canonicalCollection[stateIndex];
            if (currentCollection === undefined) {
                throw new Error(`Unknown state ${stateIndex}`);
            }

            // Several items can have the same symbol after the dot. One goto
            // per distinct symbol is enough to discover every outgoing state.
            const seenSymbols: GrammarSymbol[] = [];
            for (const item of currentCollection) {
                const production = this.productions[item.production];
                if (production === undefined) {
                    throw new Error(`Unknown production ${item.production}`);
                }

                const symbol = production.rightHand[item.dot];
                if (symbol === undefined) {
                    // The dot ran off the end: this state has recognized a
                    // complete right-hand side. Completed items are not edges,
                    // and each carries its own lookahead, so unlike edges they
                    // are never collapsed by symbol
                    if (item.production === initialProduction) {
                        this.actionTable.addAccept(stateIndex, item.lookAhead);
                    } else {
                        this.actionTable.addReduce(
                            stateIndex,
                            item.lookAhead,
                            production.leftHand,
                            production.rightHand.length,
                        );
                    }
                    continue;
                }
                if (seenSymbols.some(other => sameSymbol(other, symbol))) {
                    continue;
                }

                seenSymbols.push(symbol);

                const destination = this.registerCollection(this.goto(currentCollection, symbol));
                if (destination.isNew) {
                    queuedStates.push(destination.index);
                }

                // The same edge, recorded in whichever table its symbol belongs to.
                if (symbol.kind === "terminal") {
                    this.actionTable.addShift(stateIndex, symbol.name, destination.index);
                } else {
                    const row = this.gotoTable[stateIndex] ?? (this.gotoTable[stateIndex] = {});
                    row[symbol.name] = destination.index;
                }
            }
        }
    }

    /**
     * Assigns `collection` a state index, reusing the existing one when an equal
     * collection has already been registered
     *
     * A state's index must exist before any edge pointing at it can be written,
     * so collections are numbered the moment they are discovered rather than
     * when they are later expanded. `isNew` reports whether this call created
     * the state: it is the signal that the state still needs to be expanded, and
     * the only thing preventing a state from being queued twice.
     *
     * @param collection - A closed LR(1) item collection
     * @returns The collection's state index, and whether this call created it
     */
    private registerCollection(collection: LR1Item[]): { index: number, isNew: boolean } {
        const existing = this.canonicalCollection.findIndex(
            other => sameCollection(other, collection),
        );
        if (existing !== -1) {
            return {index: existing, isNew: false};
        }
        const index = this.canonicalCollection.length;
        this.canonicalCollection.push(collection);
        return {index, isNew: true};
    }

    /**
     * Expands a kernel into a closed LR(1) item collection.
     *
     * When an item's dot precedes a non-terminal, every production for that
     * non-terminal is added at dot position zero with each valid lookahead.
     * Newly discovered items are expanded in turn until no unseen item remains.
     * The input kernel is copied and never mutated.
     *
     * @param kernel - Items that directly define the state
     * @returns The kernel and every item recursively implied by it
     * @throws If an item references a production that does not exist
     */
    private closure(kernel: readonly LR1Item[]): LR1Item[] {
        // closureItems is both the result and the record of items already seen;
        // pendingItems contains the subset that still needs to be expanded.
        const closureItems: LR1Item[] = [...kernel];
        const pendingItems: LR1Item[] = [...kernel];

        let nextItem: LR1Item | undefined;
        while ((nextItem = pendingItems.pop()) !== undefined) {
            const currentItem = nextItem;
            const production = this.productions[currentItem.production];

            if (production === undefined) {
                throw new Error(`Unknown production ${currentItem.production}`);
            }

            const nextSymbol = production.rightHand[currentItem.dot];
            if (nextSymbol === undefined || nextSymbol.kind === "terminal") {
                continue;
            }

            const lookAheads = this.getLookAheads(currentItem);
            // [A → α · B β, a] implies [B → · γ, b] for every production
            // B → γ and every lookahead b calculated from the current item.
            const newItems = this.productions
                .map((production, productionIndex) => ({
                    production,
                    productionIndex,
                }))
                .filter(({production}) =>
                    production.leftHand === nextSymbol.name
                )
                .flatMap(({productionIndex}) =>
                    lookAheads.map(lookAhead => ({
                        production: productionIndex,
                        dot: 0,
                        lookAhead,
                    }))
                )
                .filter(impliedItem =>
                    closureItems.every(
                        existingItem => !sameItem(existingItem, impliedItem),
                    )
                );

            // Mark items as seen before queueing them, preventing later
            // expansions from scheduling the same work again.
            closureItems.push(...newItems);
            pendingItems.push(...newItems);
        }
        return closureItems;
    }

    /**
     * Computes FIRST(βa) for an LR(1) item [A → α · B β, a].
     *
     * Because the grammar does not support epsilon productions, only the first
     * symbol of β is relevant. When β is empty, the item's lookahead is
     * inherited.
     */
    private getLookAheads(item: LR1Item): readonly string[] {
        const production = this.productions[item.production];
        if (production === undefined) {
            throw new Error(`Unknown production ${item.production}`);
        }

        const followingSymbol = production.rightHand[item.dot + 1];
        if (followingSymbol === undefined) {
            return [item.lookAhead];
        }
        if (followingSymbol.kind === "terminal") {
            return [followingSymbol.name];
        }

        return this.getFirstsSet(followingSymbol.name);
    }

    /**
     * Computes FIRST for a non-terminal.
     *
     * Each reachable production contributes either its first terminal or the
     * FIRST set of its first non-terminal. Because epsilon productions are not
     * supported, symbols after the first one cannot contribute. A discovered
     * set prevents cycles and ensures each non-terminal is expanded once.
     *
     * @param noTerminal - Non-terminal whose possible first terminals are wanted
     * @returns The distinct terminals that can begin a derivation of the non-terminal
     * @throws If a production has an empty right-hand side
     */
    private getFirstsSet(noTerminal: string): readonly string[] {
        const firstTerminals = new Set<string>();
        const pendingNonTerminals = [noTerminal];
        const discoveredNonTerminals = new Set<string>([noTerminal]);

        let currentNonTerminal: string | undefined;

        while ((currentNonTerminal = pendingNonTerminals.pop()) !== undefined) {
            const productions = this.productions
                .filter(production => production.leftHand === currentNonTerminal
                );

            for (const production of productions) {
                const firstSymbol = production.rightHand[0];

                if (firstSymbol === undefined) {
                    throw new Error(`Production ${production.leftHand} has an empty right-hand side.`);
                }

                if (firstSymbol.kind === "terminal") {
                    firstTerminals.add(firstSymbol.name);
                } else if (!discoveredNonTerminals.has(firstSymbol.name)) {
                    discoveredNonTerminals.add(firstSymbol.name);
                    pendingNonTerminals.push(firstSymbol.name);
                }
            }
        }
        return [...firstTerminals];
    }

    /**
     * Computes GOTO(collection, symbol).
     *
     * Items whose dot precedes `symbol` form the transition kernel after their
     * dots advance one position. Applying closure to that complete kernel
     * produces the destination state.
     *
     * @param collection - Closed LR(1) state from which the transition starts
     * @param symbol - Terminal or non-terminal crossed by the transition
     * @returns The closed LR(1) destination collection
     * @throws If an item references a production that does not exist
     */
    private goto(collection: LR1Item[], symbol: GrammarSymbol): LR1Item[] {
        const kernel = collection
            .filter(item => {
                const production = this.productions[item.production];

                if (production === undefined) {
                    throw new Error(`Unknown production ${item.production}`);
                }
                const nextSymbol = production.rightHand[item.dot];

                return nextSymbol !== undefined
                    && sameSymbol(nextSymbol, symbol);
            })
            .map(item => ({
                production: item.production,
                dot: item.dot + 1,
                lookAhead: item.lookAhead,
            }));

        return this.closure(kernel);
    }

    /**
     * The action table, populated during construction.
     *
     * Terminal edges were written as shifts, completed items as reductions on
     * their own lookahead, and the completed start production as accept. Cells
     * that two different actions competed for are read back through the table's
     * own `conflicts`; a non-empty list means the grammar is not LR(1).
     *
     * @returns The stored table — callers share it with the builder
     */
    getActionTable(): ActionTable {
        return this.actionTable;
    }

    /**
     * The non-terminal transition table, populated during construction.
     *
     * One entry per non-terminal edge of the automaton: after reducing to
     * `leftHand`, the parser looks here for the state to land in. Sparse by
     * design — only edges that exist were written, and a correct parse never
     * consults a missing cell.
     *
     * @returns The stored table — callers share it with the builder
     */
    getGotoTable(): GotoTable {
        return this.gotoTable;
    }
}
