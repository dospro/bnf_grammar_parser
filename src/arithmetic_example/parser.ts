import {ActionTable, GotoTable, ReduceAction, ShiftAction} from "../common/parser_builder";
import {Token} from "../parser_builder/bnf_lexer";
import {take} from "../common/utils";
import {ArithmeticVisitor, TreeNode} from "./generators";

type Stack = Array<number | string>;

function getTop(collection: Stack): number | string {
    return collection[collection.length - 1];
}

export class TreeBuilder {
    private readonly stack: Stack;
    private readonly tree: TreeNode[];
    private currentState: number;

    constructor(private actionTable: ActionTable, private gotoTable: GotoTable) {
        this.stack = [];
        this.tree = [];

        this.stack.push('$');
        this.stack.push(0);
        this.currentState = 0;
    }

    public nextToken(token: Token) {
        while (true) {
            this.currentState = getTop(this.stack) as number;
            const keyToken = token.type === "number" ? "number" : token.text;
            const action = this.actionTable.data[this.currentState][keyToken];
            if (!action) {
                throw Error(`There is no action for state ${this.currentState} and token ${token.text}`);
            }

            switch (action.action) {
                case "shift":
                    this.shift(action as ShiftAction, token);
                    return;
                case "reduce":
                    this.reduce(action as ReduceAction);
                    this.gotoNextState(action as ReduceAction);
                    break
                case "accept":
                    this.reduce(action as ReduceAction);
                    return;
            }
        }
    }

    public finish() {
        this.nextToken({
            type: "$",
            text: "$",
        });
    }

    public getTree() {
        return this.tree;
    }

    private reduce(action: ReduceAction) {
        const treeNode: TreeNode = {
            text: action.leftHand,
            type: "no-terminal",
            children: [] as TreeNode[],
            accept(visitor: ArithmeticVisitor): void {
                visitor.visit(this);
            }
        }
        take(action.itemsToPull)
            .forEach(_ => {
                this.stack.pop();
                this.stack.pop();
                treeNode.children.unshift(this.tree.pop() as TreeNode);
            });
        this.tree.push(treeNode);
        this.currentState = getTop(this.stack) as number;
        this.stack.push(action.leftHand);
    }

    private shift(action: ShiftAction, token: Token) {
        this.stack.push(token.text);
        this.stack.push(action.index);

        const treeNode: TreeNode = {
            text: token.text,
            type: "terminal",
            tokenType: token.type,
            children: [] as TreeNode[],
            accept(visitor: ArithmeticVisitor): void {
                visitor.visit(this);
            }
        }
        this.tree.push(treeNode);
    }

    private gotoNextState(action: ReduceAction) {
        const nextState = this.gotoTable[this.currentState][(action as ReduceAction).leftHand];
        this.stack.push(nextState);
    }
}
