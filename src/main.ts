import {main} from "./arithmetic_example/main";
import {main as pmain} from "./parser_builder/main";

console.log("Grammar Parser v1");
pmain().then(() => main());


interface Visitor {
    visitNumberNode(element: NumberNode): void;

    visitOperatorNode(element: OperatorNode): void;

    getResult(): any
}

class InterpreterVisitor implements Visitor {
    private result: number;

    constructor() {
        this.result = 0;
    }

    visitNumberNode(element: NumberNode): void {
        this.result = parseFloat(element.value);
    }

    visitOperatorNode(element: OperatorNode): void {
        element.left?.accept(this);
        let a = this.result;
        element.right?.accept(this);
        if (element.value === "+") {
            this.result += a;
        } else if (element.value === "-") {
            this.result -= a;
        }
    }

    getResult(): any {
        return this.result;
    }
}

interface Node {
    left: Node | null;
    right: Node | null;
    value: string;

    accept(visitor: Visitor): void;
}

class NumberNode implements Node {
    left: Node | null;
    right: Node | null;

    constructor(public value: string) {
        this.left = null;
        this.right = null;
    }

    accept(visitor: Visitor): void {
        visitor.visitNumberNode(this);
    }


}

class OperatorNode implements Node {
    public left: Node | null = null;
    public right: Node | null = null;

    constructor(public value: string) {
    }

    accept(visitor: Visitor): void {
        visitor.visitOperatorNode(this);
    }
}

function test() {
    let tree = new OperatorNode("+");
    tree.left = new NumberNode("25");
    tree.right = new OperatorNode("-");
    tree.right.left = new NumberNode("10");
    tree.right.right = new NumberNode("5");

    let visitor = new InterpreterVisitor();
    tree.accept(visitor);
    console.log(`Result: ${visitor.getResult()}`);
}

test();
