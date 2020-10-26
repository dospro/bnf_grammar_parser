import {BNFVisitor} from "../parser_builder/parser_generator";

export interface TreeNode {
    text: string;
    type: "terminal" | "no-terminal"; // terminal/no-terminal used by the parser
    tokenType?: string; // The actual token type. Only terminals are tokens
    children: TreeNode[];

    accept(visitor: ArithmeticVisitor): void;
}

export abstract class ArithmeticVisitor {
    visit(element: TreeNode) {
        const name = element.text;
        switch (name) {
            case "factor":
                return this.visitFactorNode(element);
            case "term" :
                return this.visitTermNode(element);
            case "exp":
                return this.visitExpNode(element);
            case "goal":
                return this.visitGoalNode(element);
            default:
                console.log(`Unprocessed node type:${element.type}, text: ${element.text}`);
                break
        }
        return null;
    }

    abstract visitFactorNode(element: TreeNode): any;

    abstract visitTermNode(element: TreeNode): any;

    abstract visitExpNode(element: TreeNode): any;

    abstract visitGoalNode(element: TreeNode): any;
}

export class ArithmeticInterpreterVisitor extends ArithmeticVisitor {
    private result = 0;

    visitExpNode(element: TreeNode): any {
        if (element.children.length === 3 && element.children[1].text === "+") {
            const a = this.visit(element.children[0]);
            const b = this.visit(element.children[2]);
            console.log(`Return ${a}+${b}: ${a+b}`);
            return a + b;
        } else if (element.children.length === 3 && element.children[1].text === "-") {
            const a = this.visit(element.children[0]);
            const b = this.visit(element.children[2]);
            console.log(`Return ${a}-${b}: ${a-b}`);
            return a - b;
        } else {
            return this.visit(element.children[0]);
        }
    }

    visitFactorNode(element: TreeNode): any {
        if (element.children[0].tokenType === "number") {
            return parseInt(element.children[0].text, 10);
        } else {
            return this.visit(element.children[1]);
        }
    }

    visitGoalNode(element: TreeNode): any {
        this.result = this.visit(element.children[0]);
    }

    visitTermNode(element: TreeNode): any {
        if (element.children.length === 3 && element.children[1].text === "*") {
            const a = this.visit(element.children[0]);
            const b = this.visit(element.children[2]);
            console.log(`Return ${a}*${b}`);
            return a * b;
        } else if (element.children.length === 3 && element.children[1].text === "/") {
            const a = this.visit(element.children[0]);
            const b = this.visit(element.children[2]);
            console.log(`Return ${a}/${b}: ${a/b}`);
            return a / b;
        } else {
            return this.visit(element.children[0]);
        }
    }

    getResult() {
        return this.result;
    }

}
