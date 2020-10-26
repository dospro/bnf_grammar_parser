import {None, Option, Some} from "../common/option";

interface Token {
    type: string;
    text: string;
}


/**
 * Returns true if character is a number from 0 to 9
 * @param {string} character Single character
 * @returns {boolean} True if character is a number
 */
const isNumeric = (character: string): boolean => {
    const numericValue: number = parseFloat(character);
    return !isNaN(numericValue) && isFinite(numericValue);
};


function isEmptySpace(character: string): boolean {
    return (character === " " || character === "\t");
}

/**
 * Algorithm
 *
 * 1. Si estamos en el final de la cadena entonces c <- $
 * Sino, c <- obtenemos caracter
 *
 * 2. Obtenemos nuevo estado a partir del estado actual y el caracter ns <- obtener_estado
 * 3. Si ns contiene un nuevo estado, regresamos al paso 1
 * 4. ns contiene None, el estado actual no es estado final, parar y mostrar error
 * 5. Si estado actual es estado final, guardamos los caracteres leidos hasta el momento y los regresamos.
 * 6. Vuelta al paso 1
 * @param inputString
 */

export function* newLexer(inputString: string): IterableIterator<Token> {
    let currentStringPosition = 0;
    while (true) {
        let currentState = 0;
        let currentToken = "";

        let nextChar = "$"; // End of input
        let nextState: Option<number> = None();
        do {
            nextChar = "$";
            if (currentStringPosition < inputString.length) {
                nextChar = inputString[currentStringPosition];
            }
            nextState = getNextState(currentState, nextChar);
            nextState.match(
                value => {
                    currentState = value;
                    currentToken = currentToken.concat(nextChar);
                    currentStringPosition++;
                },
                () => {
                }
            );

        } while (nextState.is_some());

        // Tenemos un posible token
        switch (currentState) {
            case 0: // No es estado final
                if (nextChar === "$") {
                    console.log("Terminamos bien");
                    return;
                } else {
                    console.log("Error!");
                    return;
                }
                break;
            case 1: // Number
                yield {
                    type: "number",
                    text: currentToken,
                };
                break;
            case 2: // Operator
                yield {
                    type: "operator",
                    text: currentToken,
                };
                break;
            case 3: // Open parenthesis
                yield {
                    type: "open_parenthesis",
                    text: currentToken,
                };
                break;
            case 4: // Close parenthesis
                yield {
                    type: "close_parenthesis",
                    text: currentToken,
                };
                break;
            default:
                console.log("Error!!!!");
                return;
        }
    }
}

function getNextState(state: number, char: string): Option<number> {
    switch (state) {
        case 0:
            if (isEmptySpace(char)) {
                return Some(0);
            } else if (isNumeric(char)) {
                return Some(1);
            } else if ("+-*/".includes(char)) {
                return Some(2);
            } else if (char === "(") {
                return Some(3);
            } else if (char === ")") {
                return Some(4);
            }
            break;
        case 1:
            if (isNumeric(char)) {
                return Some(1);
            }
            break;
        default:
            break;

    }
    return None();
}
