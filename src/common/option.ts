export interface Option<T> {
    unwrap(): T
    match<U>(f_ok: (value: T) => U, f_none: () => U): U
    is_some(): boolean
    is_none(): boolean
}

class CSome<T> implements Option<T> {
    constructor(private value: T) {
    }

    unwrap(): T {
        return this.value;
    }

    match<U>(f_ok: (value: T) => U, f_none: () => U): U {
        return f_ok(this.value);
    }

    is_none(): boolean {
        return false;
    }

    is_some(): boolean {
        return true;
    }
}

class CNone implements Option<never> {
    unwrap(): never {
        throw "Option has no value";
    }

    match<U>(f_ok: (value: never) => U, f_none: () => U): U {
        return f_none();
    }

    is_none(): boolean {
        return true;
    }

    is_some(): boolean {
        return false;
    }
}

export function Some<T>(value: T): CSome<T> {
    return new CSome<T>(value);
}

export function None(): CNone {
    return new CNone();
}

export function test() {
    let value = Some(5);
    let noneValue = None();
    console.log(`value is ${value.unwrap()}`);
    let result = noneValue.match(
        (value) => value,
        () => null

    );
    console.log(`${result}`);
}

