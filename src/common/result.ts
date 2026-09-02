/**
 * @file A `Result` type for operations that can fail.
 *
 * Failures that are *expected outcomes* of a domain operation — a syntax error in a
 * grammar file, a shift/reduce conflict, an undefined non-terminal — are returned as
 * values instead of thrown. Two reasons this suits a parser generator: a caller can
 * collect and report every problem in one pass rather than stopping at the first, and
 * the failure path becomes visible in the function signature.
 *
 * Exceptions remain the right tool for *unexpected* failures — an unreadable file, a
 * broken internal invariant. `Result` is for the failures you intend to explain to a
 * user.
 */

/**
 * The outcome of an operation that may fail: either a success carrying a `T` or a
 * failure carrying an `E`.
 *
 * This is a discriminated union keyed on `ok`. Testing that field narrows the type, so
 * the compiler will not let a payload be read before the case has been checked:
 *
 * ```ts
 * const result = parseGrammar(source);
 * if (!result.ok) {
 *     for (const d of result.error) {
 *         console.error(`${path}:${d.line}:${d.column}: ${d.message}`);
 *     }
 *     return 1;
 * }
 * const grammar = result.value; // narrowed to Grammar; no cast required
 * ```
 *
 * `ok` is typed as the literals `true` and `false` rather than `boolean`. That is what
 * makes the narrowing work — a shared `boolean` field would tell the compiler nothing.
 *
 * @typeParam T - The value carried on success.
 * @typeParam E - The value carried on failure. Frequently a list, so that one call can
 *                report every problem it found instead of only the first.
 */
export type Result<T, E> =
    | { readonly ok: true; readonly value: T }
    | { readonly ok: false; readonly error: E };

/**
 * Builds a successful `Result`.
 *
 * The `never` error parameter lets the returned value satisfy a `Result` with any error
 * type, so `E` never has to be named at a construction site:
 *
 * ```ts
 * function build(): Result<Tables, Diagnostic[]> {
 *     return Ok(tables); // Result<Tables, never> fits Result<Tables, Diagnostic[]>
 * }
 * ```
 *
 * @param value - The success payload.
 * @returns A `Result` in the success case.
 *
 * @remarks The explicit return type is required. Without it TypeScript widens `ok: true`
 * to `boolean`, and the object stops matching `Result`.
 */
export const Ok = <T>(value: T): Result<T, never> => ({ok: true, value});

/**
 * Builds a failed `Result`.
 *
 * The `never` value parameter lets the returned value satisfy a `Result` with any
 * success type, so `T` never has to be named at a construction site:
 *
 * ```ts
 * function build(): Result<Tables, Diagnostic[]> {
 *     return Err(diagnostics); // Result<never, Diagnostic[]> fits the return type
 * }
 * ```
 *
 * @param error - The failure payload.
 * @returns A `Result` in the failure case.
 *
 * @remarks The explicit return type is required. Without it TypeScript widens
 * `ok: false` to `boolean`, and the object stops matching `Result`.
 */
export const Err = <E>(error: E): Result<never, E> => ({ok: false, error});