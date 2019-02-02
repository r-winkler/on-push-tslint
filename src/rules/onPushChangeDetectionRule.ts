import * as ts from 'typescript'
import { isImportDeclaration, isImportSpecifier, isPropertyAssignment, ObjectLiteralElementLike } from 'typescript'
import * as Lint from 'tslint'


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
            let changeDetectionPropertyAssignment = null;
            let selectorPropertyAssigment = null; // used for formatting
            const hasOnPushChangeDetection = (expression.arguments[0] as ts.ObjectLiteralExpression).properties
            .filter(isPropertyAssignment).some(prop => {

                if(prop.name.getText() === 'selector') {
                    selectorPropertyAssigment = prop;
                }

                const value = prop.initializer.getText();
                if(prop.name.getText() === 'changeDetection') {
                    changeDetectionPropertyAssignment = prop;
                    return value.endsWith('.OnPush');
                }
            });

            if(!hasOnPushChangeDetection) {
                const importFix = this.createImportFix(node);
                const changeDefaultToOnPushFix = this.createChangeDefaultToOnPushFix(changeDetectionPropertyAssignment);
                const addOnPushFix = !changeDetectionPropertyAssignment ? this.createAddOnPushFix((expression.arguments[0] as ts.ObjectLiteralExpression).properties, ...this.getIndendationAndCarriageReturn(selectorPropertyAssigment)) : null;
                this.addFailureAtNode(expression.parent, Rule.FAILURE_STRING, [importFix, changeDefaultToOnPushFix, addOnPushFix].filter(el => el));
            }

        });
    }

    private createImportFix(node: ts.ClassDeclaration) {
        if(ts.isSourceFile(node.parent)) {
             return node.parent.statements
            .filter(isImportDeclaration) // type casting
            .filter(declaration => declaration.moduleSpecifier && declaration.moduleSpecifier.getText() && declaration.importClause && declaration.importClause.namedBindings && (declaration.importClause.namedBindings as ts.NamedImports).elements) // null safety
            .filter(declaration => declaration.moduleSpecifier.getText().includes('@angular/core')) // what we are looking for
            .map(declaration => {
                const elements = (declaration.importClause.namedBindings as ts.NamedImports).elements;
                if(!elements.filter(isImportSpecifier).filter(specifiier => specifiier.name).some(specifiier => specifiier.name.text === 'ChangeDetectionStrategy')) {
                    return Lint.Replacement.appendText(elements[elements.length - 1].end, ', ChangeDetectionStrategy');
                }
            })
             .find( type => !!type); // find first
        }
        return null;
    }

    private createChangeDefaultToOnPushFix(assignment: ts.PropertyAssignment) {
        return assignment ? new Lint.Replacement(assignment.initializer.getStart(), assignment.initializer.getWidth(), "ChangeDetectionStrategy.OnPush") : null;
    }

    private createAddOnPushFix(properties: ts.NodeArray<ObjectLiteralElementLike>, indentation = '', maybeCarriageReturn = '') {
        if(properties) {
            const last = properties[properties.length - 1];
            return Lint.Replacement.appendText(last.end, `,${maybeCarriageReturn}\n${indentation}changeDetection: ChangeDetectionStrategy.OnPush`);
        }
        return null;
    }

    private getIndendationAndCarriageReturn(assignment: ts.PropertyAssignment) {
        if (assignment) {
            const match = /\n([\t ])/.exec(assignment.getFullText(this.getSourceFile())); // determine which character to use (tab or space)
            const indentation = match === null ? "" :
                match[1].repeat( // indentation should match start of statement
                    ts.getLineAndCharacterOfPosition(
                        this.getSourceFile(),
                        assignment.getStart(this.getSourceFile()),
                    ).character,
                );

            const maybeCarriageReturn = this.getSourceFile().text[this.getSourceFile().getLineEndOfPosition(assignment.pos) - 1] === "\r" ? "\r" : "";

            return [indentation, maybeCarriageReturn]
        }
        return ['', ''];
    }
}
