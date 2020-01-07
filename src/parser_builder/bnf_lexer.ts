/**
 * @file Implements a lexic parser for bnf grammars
 */

export interface Token {
    type: string;
    text: string;
}

const NO_TERMINAL = 5;
const TERMINAL = 6;
const ASSIGNMENT = 7;
const NEW_LINE = 8;
const EOF = 9;
const ERROR = 10;
const TOKEN_READY = 100;

interface StatesMatrix {
    [index: number]: { [index: string]: number }
}

const statesMatrix: StatesMatrix = {
    0: {
        ' ': 0,
        '<': 1,
        '"': 2,
        ':': 3,
        '%': 10,
    },
    1: {
        '>': NO_TERMINAL // Non terminal
    },
    2: {
        '"': TERMINAL
    },
    3: {
        ":": 4
    },
    4: {
        "=": ASSIGNMENT
    }
};

/**
 * Returns true if character is a new line
 * Also works for windows style new lines.
 * @param {string} character Single character
 * @returns {boolean} True if character is a new line
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
 * Returns true if character is a number from 0 to 9
 * @param {string} character Single character
 * @returns {boolean} True if character is a number
 */
const isNumeric = (character: string): boolean => {
    const numericValue: number = parseFloat(character);
    return !isNaN(numericValue) && isFinite(numericValue);
};

/**
 * Returns true if character is a alphabetic.
 * This also includes spanish characters like "ñ"
 * or "á".
 * @param {string} character Single character
 * @returns {boolean} Returns true if character is alphabetic
 */
const isAlphabetic = (character: string): boolean => {
    if (character.length !== 1)
        return false;

    let lower_char = character.toLowerCase();
    if ('a' <= lower_char && lower_char <= 'z')
        return true;

    if (lower_char in ['á', 'é', 'í', 'ó', 'ú', 'ñ'])
        return true;

    return false;
};

/**
 * Helper function that returns true if both
 * isNumeric and isAlphabetic functions return true
 * on the same character.
 * @param {string} character Single character
 * @returns {boolean} Return true if character is alphanumeric
 */
const isAlphanumeric = (character: string): boolean => {
    if (isAlphabetic(character))
        return true;

    if (isNumeric(character))
        return true;

    return false;
}

/**
 * Helper function which returns true if character
 * is a valid part of an identifier.
 * An identifier can include any alphanumeric character,
 * a "-" or "_".
 * @param {string} character Single character
 * @returns {boolean} Returns true if character is part of identifier
 */
const isIdentifierCharacter = (character: string): boolean => {
    if (isAlphanumeric(character))
        return true;

    if (['-', '_'].includes(character))
        return true;

    return false;
};

/**
 * @class State Machine for lexical analysis
 */
export class BNFLexer {
    private currentState: number;
    private currentToken: string;
    private sourceString: string;
    private currentStringPosition: number;

    constructor() {
        this.currentState = 0;
        this.currentToken = "";
        this.sourceString = "";
        this.currentStringPosition = 0;
    }

    /**
     * Loads the string into the machine
     * @param {string} sourceString The full string we want to analyze
     */
    setString(sourceString: string) {
        this.sourceString = sourceString;
    }


    /**
     * Returns true if we have finished analyzing the string
     * or the string is empty.
     * @returns {boolean} Returns true if current string is empty.
     */
    isEmpty(): boolean {
        if (!this.sourceString)
            return true;
        if (this.currentStringPosition >= this.sourceString.length)
            return true;
        return false;
    }

    /**
     * Once a string has been loaded, this function returns tokens
     * from the string.
     * @returns {Token}
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
            let nextState = BNFLexer._transition(this.currentState, nextChar);
            this.currentState = nextState;
            this.currentStringPosition++;
            this.currentToken = this.currentToken.concat(nextChar);
            if (nextState === 0)
                this.currentToken = "";
            if (nextState === ERROR) {
                console.log("Stop");
                throw "Stop";
            }
            if (this.isEmpty() && nextState === NEW_LINE) {
                this.currentState = 0;
                return {
                    type: "new-line",
                    text: ""
                };
            }
            if (nextState === TOKEN_READY) {
                this.currentState = 0;
                this.currentStringPosition--;
                return {
                    type: "new-line",
                    text: ""
                };
            }
            if (nextState === TERMINAL) {
                this.currentState = 0;
                return {
                    type: "terminal",
                    text: this.currentToken.substring(1, this.currentToken.length - 1)
                };
            }
            if (nextState === NO_TERMINAL) {
                this.currentState = 0;
                return {
                    type: "no-terminal",
                    text: this.currentToken.substring(1, this.currentToken.length - 1)
                };
            }
            if (nextState === ASSIGNMENT) {
                this.currentState = 0;
                return {
                    type: "assignment",
                    text: "::="
                };
            }
        }
        throw "Error";
    }


    /**
     * Helper method which updates the machine state based
     * on the current state and current character.
     * @param state
     * @param input
     * @returns {number}
     * @private
     */
    static _transition(state: number, input: string): number {
        let finalState = ERROR;
        // console.log("State: #{state}, Input: #{input}");
        switch (state) {
            case 0:
                if (isNewLine(input))
                    finalState = NEW_LINE;
                else {
                    let nextState = statesMatrix[state][input];
                    if (nextState === undefined) {
                        console.log(`Unkown input ${input}`);
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

            case NEW_LINE:
                if (isNewLine(input))
                    finalState = NEW_LINE;
                else
                    finalState = TOKEN_READY;
        }
        return finalState;
    }
}
