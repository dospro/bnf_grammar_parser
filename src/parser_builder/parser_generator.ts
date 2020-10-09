
export interface TreeNode {
    text: string;
    type: "terminal" | "no-terminal"; // terminal/no-terminal used by the parser
    tokenType?: string; // The actual token type. Only terminals are tokens
    children: TreeNode[];

    accept(visitor: BNFVisitor): void;
}

export abstract class BNFVisitor {
    visit(element: TreeNode) {
        if (element.type === "terminal") {
            return element.text;
        }
        const name = element.text;
        switch (name) {
            case "right_side":
                return this.visitRightSideNode(element);
            case "rule" :
                return this.visitRuleNode(element);
            case "rules_list":
                return this.visitRulesListNode(element);
            case "goal":
                return this.visitGoalNode(element);
            default:
                console.log(`Unprocessed node type:${element.type}, text: ${element.text}`);
                break
        }
        return null;
    }

    abstract visitRightSideNode(element: TreeNode): any;

    abstract visitRuleNode(element: TreeNode): any;

    abstract visitRulesListNode(element: TreeNode): any;

    abstract visitGoalNode(element: TreeNode): any;
}

export class SimpleTextBNFVisitor extends BNFVisitor {

    visitRightSideNode(element: TreeNode): string {
        let text = "";
        for (const n of element.children) {
            if (n.type === "terminal") {
                text += n.text;
            } else if (n.type === "no-terminal") {
                text += this.visit(n);
            } else {
                console.log(`Uhh? ${n.type}`);
            }
        }
        return text;
    }

    visitRuleNode(element: TreeNode): string {
        let text = "";
        for (const n of element.children) {
            if (n.type === "terminal") {
                text += n.text;
            } else if (n.type === "no-terminal") {
                text += this.visit(n);
            } else {
                console.log(`Uhh? ${n.type}`);
            }
        }
        console.log(`Rule: ${text}`);
        return text + "\n";
    }


    visitRulesListNode(element: TreeNode): string {
        let text = "";
        for (const n of element.children) {
            if (n.type === "no-terminal") {
                text += this.visit(n);
            }
        }
        return text;
    }

    visitGoalNode(element: TreeNode): string {
        for (const n of element.children) {
            if (n.type === "no-terminal") {
                const r = this.visit(n);
                console.log("Reached goal " + r);
            } else {
                console.log(`Uhh? ${n.type}`);
            }
        }
        return "";
    }
}

export class JSONBuilderBNFVisitor extends BNFVisitor {
    private result: any;

    visitRightSideNode(element: TreeNode): any {
        let tokenStream = [];
        for (const n of element.children) {
            if (n.type === "terminal") {
                tokenStream.push({
                    type: "terminal",
                    text: n.text,
                });
            } else if (n.type === "no-terminal") {
                tokenStream.push(...this.visit(n));
            } else {
                console.log(`Uhh? ${n.type}`);
            }
        }
        return tokenStream;
    }

    visitRuleNode(element: TreeNode): any {
        let rule = {};
        let tokenList = [];
        let ruleName = "";
        for (const n of element.children) {
            if (n.type === "terminal") {
                if (n.tokenType === "no-terminal") {
                    ruleName = n.text;
                }
            } else if (n.type === "no-terminal") {
                tokenList.push(...this.visit(n));
            } else {
                console.log(`Uhh? ${n.type}`);
            }
        }

        return {
            [ruleName]: [{
                predicate: [...tokenList]
            }]
        };
    }


    visitRulesListNode(element: TreeNode): any {
        let rulesList: any = {};
        for (const n of element.children) {
            if (n.type === "no-terminal") {
                switch (n.text){
                    case "rules_list":
                        rulesList = this.visit(n);
                        break;
                    case "rule":
                        const r = this.visit(n);
                        const key = Object.keys(r)[0];
                        if(Object.keys(rulesList).includes(key)) {
                            rulesList[key].push(r[key]);
                        } else {
                            rulesList[key] = r[key];
                        }
                        break;
                    default:
                        break;
                }
            }
        }
        return rulesList;
    }

    visitGoalNode(element: TreeNode): any {
        for (const n of element.children) {
            if (n.text === "rules_list") {
                this.result = this.visit(n);
            }
        }
    }

    getResult() {
        return this.result;
    }
}
