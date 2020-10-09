export interface Result<T, E> {
}

export class Ok<T> implements Result<T, never> {
    constructor(private value: T) {
    }
}

export class Err<E> implements Result<never, E> {
    constructor(private err: E) {
    }
}
