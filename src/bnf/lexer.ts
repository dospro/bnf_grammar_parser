/**
 * @file Lexical analyzer (tokenizer) for BNF grammar files.
 * Converts BNF source text into a stream of tokens for parsing.
 */

export interface Token {
    type: "no-terminal" | "terminal" | "assignment" | "new-line" | "$" | "error" | "token-ready" | "eof";
    text: string;
}

enum TokenType {
    NO_TERMINAL = 5,
    TERMINAL = 6,
    ASSIGNMENT = 7,
    NEW_LINE = 8,
    EOF = 9,
    ERROR = 10,
    TOKEN_READY = 100,
}

type StateTransitions = Record<string, number>;
type StatesMatrix = Record<number, StateTransitions>;

const statesMatrix: StatesMatrix = {
    0: {
        ' ': 0,
        '<': 1,
        '"': 2,
        ':': 3,
        '%': 10,
    },
    1: {
        '>': TokenType.NO_TERMINAL
    },
    2: {
        '"': TokenType.TERMINAL
    },
    3: {
        ":": 4
    },
    4: {
        "=": TokenType.ASSIGNMENT
    }
};

/**
 * Checks if a character is a line terminator.
 * Recognizes Unix (\n), Mac (\r), and Windows (\r\n) line endings.
 * Note: For single character input, only \n and \r are detected.
 * @param character - The character to test
 * @returns True if the character is a line terminator
 */
const isNewLine = (character: string): boolean => {
    if (character === '\r\n')
        return true;
    if (character === '\r')
        return true;
    if (character === '\n')
        return true;
    return false;
};

/**
 * Checks if a character is a decimal digit (0-9).
 * Uses parseFloat to determine numeric validity.
 * @param character - The character to test
 * @returns True if the character represents a single digit
 */
const isNumeric = (character: string): boolean => {
    const numericValue: number = parseFloat(character);
    return !isNaN(numericValue) && isFinite(numericValue);
};

/**
 * Checks if a character is alphabetic (a-z, A-Z).
 * Also supports Spanish/Latin characters: á, é, í, ó, ú, ñ.
 * Performs case-insensitive comparison.
 * @param character - The character to test (must be exactly 1 character)
 * @returns True if the character is alphabetic
 */
const isAlphabetic = (character: string): boolean => {
    if (character.length !== 1)
        return false;

    let lower_char = character.toLowerCase();
    if ('a' <= lower_char && lower_char <= 'z')
        return true;

    if (['á', 'é', 'í', 'ó', 'ú', 'ñ'].includes(lower_char))
        return true;

    return false;
};

/**
 * Checks if a character is alphanumeric (letter OR digit).
 * Returns true if the character passes either isAlphabetic or isNumeric.
 * @param character - The character to test
 * @returns True if the character is a letter or digit
 */
const isAlphanumeric = (character: string): boolean => {
    return isNumeric(character) || isAlphabetic(character);
}

/**
 * Checks if a character is valid within a BNF identifier/non-terminal name.
 * Valid characters are: alphanumeric (a-z, A-Z, 0-9), hyphen (-), and underscore (_).
 * Used for parsing non-terminal symbols like <my-variable_1>.
 * @param character - The character to test
 * @returns True if the character can appear in an identifier
 */
const isIdentifierCharacter = (character: string): boolean => {
    if (isAlphanumeric(character))
        return true;

    if (['-', '_'].includes(character))
        return true;

    return false;
};

/**
 * Finite state machine lexical analyzer for BNF grammar syntax.
 *
 * Tokenizes BNF source code into:
 * - Non-terminals: `<identifier>`
 * - Terminals: `"string"`
 * - Assignments: `::=`
 * - New lines
 * - Comments (lines starting with %)
 *
 * The lexer maintains internal state and position as it scans through the source string.
 */
export class BNFTokenizer {
    private currentState: number;
    private currentToken: string;
    private readonly sourceString: string;
    private currentStringPosition: number;

    constructor(sourceString: string) {
        this.currentState = 0;
        this.currentToken = "";
        this.sourceString = sourceString;
        this.currentStringPosition = 0;
    }

    [Symbol.iterator](): IterableIterator<Token> {
        return this;
    }

    next(): IteratorResult<Token> {
        // if (this.isEmpty()) {
        //     return { done: true, value: undefined as any };
        // }
        const token = this.getNextToken();
        if (token.type === "$") {
            return { done: true, value: token };
        }
        return { done: false, value: token };
    }


    /**
     * Checks if the lexer has consumed all input.
     * Returns true if the source string is empty/unset or if the current
     * position has reached or exceeded the end of the source string.
     * @returns True if no more characters remain to be tokenized
     */
    isEmpty(): boolean {
        if (!this.sourceString)
            return true;
        if (this.currentStringPosition >= this.sourceString.length)
            return true;
        return false;
    }

    /**
     * Extracts and returns the next token from the source string.
     * Advances the internal position as characters are consumed.
     * Returns an EOF token (type: "$") when the input is exhausted.
     *
     * @returns The next token from the input stream
     * @throws Error if an unexpected character is encountered or unexpected end of input
     */
    getNextToken(): Token {
        if (this.isEmpty()) {
            return {
                type: "$",
                text: "$"
            };
        }

        this.currentToken = "";
        while (this.currentStringPosition < this.sourceString.length) {
            let nextChar = this.sourceString[this.currentStringPosition];
            let nextState = BNFTokenizer._transition(this.currentState, nextChar);
            this.currentState = nextState;
            this.currentStringPosition++;
            this.currentToken += nextChar;
            if (nextState === 0)
                this.currentToken = "";
            if (nextState === TokenType.ERROR) {
                throw new Error("Lexical analysis error: Unexpected character " + nextChar + ".");
            }
            if (this.isEmpty() && nextState === TokenType.NEW_LINE) {
                this.currentState = 0;
                return {
                    type: "new-line",
                    text: ""
                };
            }
            if (nextState === TokenType.TOKEN_READY) {
                this.currentState = 0;
                this.currentStringPosition--;
                return {
                    type: "new-line",
                    text: ""
                };
            }
            if (nextState === TokenType.TERMINAL) {
                this.currentState = 0;
                return {
                    type: "terminal",
                    text: this.currentToken.substring(1, this.currentToken.length - 1)
                };
            }
            if (nextState === TokenType.NO_TERMINAL) {
                this.currentState = 0;
                return {
                    type: "no-terminal",
                    text: this.currentToken.substring(1, this.currentToken.length - 1)
                };
            }
            if (nextState === TokenType.ASSIGNMENT) {
                this.currentState = 0;
                return {
                    type: "assignment",
                    text: "::="
                };
            }
        }
        throw new Error("Unexpected end of string.");
    }


    /**
     * State transition function for the finite state machine.
     * Determines the next state based on the current state and input character.
     *
     * State descriptions:
     * - 0: Initial/reset state (whitespace, start of tokens)
     * - 1: Inside non-terminal (after '<', accumulating identifier)
     * - 2: Inside terminal string (after '"', accumulating until closing '"')
     * - 3: First colon seen (looking for '::=')
     * - 4: Second colon seen (looking for '=')
     * - 10: Inside comment (after '%', skip until newline)
     * - NEW_LINE: Newline character(s) detected
     * - TOKEN_READY: Signal that previous token is complete
     *
     * @param state - Current state of the FSM
     * @param input - The character being processed
     * @returns The next state, or ERROR if input is invalid for current state
     */
    static _transition(state: number, input: string): number {
        let finalState: number = TokenType.ERROR;
        // console.log("State: #{state}, Input: #{input}");
        switch (state) {
            case 0:
                if (isNewLine(input))
                    finalState = TokenType.NEW_LINE;
                else {
                    let nextState = statesMatrix[state][input];
                    if (nextState === undefined) {
                        console.log(`Unknown input ${input}`);
                        break;
                    }
                    finalState = nextState;
                }
                break;
            case 1:
                if (isIdentifierCharacter(input))
                    finalState = state;
                else {
                    let nextState = statesMatrix[state][input];
                    if (nextState === undefined) {
                        console.log(`Unknown input ${input}`);
                        break;
                    }
                    finalState = nextState;
                }
                break;
            case 2:
                if (input !== '"')
                    finalState = state;
                else {
                    let nextState = statesMatrix[state][input];
                    if (nextState === undefined) {
                        console.log(`Unknown input ${input}`);
                        break;
                    }
                    finalState = nextState;
                }
                break;
            case 3: //# identifiers and assignment
            case 4:
                let nextState = statesMatrix[state][input];
                if (nextState === undefined) {
                    console.log(`Unknown input ${input}`);
                    break;
                }
                finalState = nextState;
                break;

            case 10:
                if (isNewLine(input))
                    finalState = 0;
                else
                    finalState = 10;

                break;

            case TokenType.NEW_LINE:
                if (isNewLine(input))
                    finalState = TokenType.NEW_LINE;
                else
                    finalState = TokenType.TOKEN_READY;
        }
        return finalState;
    }
}
