import * as ts from 'typescript'
import * as Lint from 'tslint'
import { isPropertyAssignment } from 'typescript';


export class Rule extends Lint.Rules.AbstractRule {

    public static FAILURE_STRING = "Component must use OnPush change detection.";

    public apply(sourceFile: ts.SourceFile): Lint.RuleFailure[] {

        // Whitelist with regular expressions to use when determining which files to lint.
        const whitelist = this.getOptions().ruleArguments;

        // Whether the file should be checked at all.
        const disabled = !whitelist.length || whitelist.some(p => new RegExp(p).test(sourceFile.fileName));
        if(disabled) return;

        return this.applyWithWalker(new OnPushChangeDetectionStrategyWalker(sourceFile, this.getOptions()));
    }
}


class OnPushChangeDetectionStrategyWalker extends Lint.RuleWalker {

    visitClassDeclaration(node: ts.ClassDeclaration) {

        if(!node.decorators) return;

        node.decorators
        .map(decorator => decorator.expression as ts.CallExpression)
        .filter(expression => expression.expression && expression.expression.getText() === 'Component')
        .filter(expression => expression.arguments.length && (expression.arguments[0] as ts.ObjectLiteralExpression).properties)
        .forEach(expression => {
            const hasOnPushChangeDetection = (expression.arguments[0] as ts.ObjectLiteralExpression).properties
            .filter(isPropertyAssignment).some(prop => {
                const value = prop.initializer.getText();
                return prop.name.getText() === 'changeDetection' && value.endsWith('.OnPush');
            });

            if (!hasOnPushChangeDetection) {
                this.addFailureAtNode(expression.parent, Rule.FAILURE_STRING);
            }
        });
    }
}




