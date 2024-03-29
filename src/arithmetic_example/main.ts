import {newLexer} from "./lexer";
import {TreeBuilder} from "./parser";
import fs from "fs";
import path from "path";
import {ArithmeticInterpreterVisitor} from "./generators";

function readPromise(filename: string): Promise<string> {
    return new Promise((resolve, reject) => {
        fs.readFile(path.join(__dirname, filename), (err, data) => {
            if (err) return reject(err);
            else return resolve(data.toString("utf-8"));
        });
    });
}

export async function main() {
    let tables: any = await readPromise("../../arithmetic.json");
    tables = JSON.parse(tables);
    const {tokens, actionTable, gotoTable} = tables;

    let l = newLexer("(3*5)-(9/2)+1");
    const parser = new TreeBuilder(actionTable, gotoTable);
    for (const c of l) {
        parser.nextToken(c);
    }
    parser.finish();
    const partialTree = parser.getTree();
    const visitor = new ArithmeticInterpreterVisitor();
    partialTree[0].accept(visitor);
    console.log(visitor.getResult());
    // console.log(JSON.stringify(partialTree, null, 2));
}



