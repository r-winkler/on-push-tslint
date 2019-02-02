import * as Lint from 'tslint'
import * as path from 'path'
import { red } from 'kleur'

test(`test run`, () => {
    let log = '';
    console.log = jest.fn(message => (log += message)); // overwrite console.log

    const options = {
        fix: false,
        rulesDirectory: path.join(__dirname, '../src/rules')
    };

    const program = Lint.Linter.createProgram('./tests/fixtures/tsconfig.json', './');
    const linter = new Lint.Linter(options, program);

    const rules = new Map<string, Partial<Lint.IOptions>>([
        [
            'on-push-change-detection',
            {
                ruleName: 'on-push-change-detection',
                ruleArguments: [true, ".*.spec.ts$", "app.component.ts"]
            }
        ]
    ]);


    const lintConfiguration = {
        rules,
        jsRules: rules,
        rulesDirectory: [options.rulesDirectory],
        extends: ['']
    };

    const files = Lint.Linter.getFileNames(program);

    files.forEach(file => {
        const fileContents = program.getSourceFile(file).getFullText();
        linter.lint(file, fileContents, lintConfiguration);
    });

    const results = linter.getResult();

    console.log(red(`Failures: ${results.errorCount}`));

    results.failures.forEach(failure => {
        const fileName = failure.getFileName();
        const index = fileName.lastIndexOf('/');
        console.log(fileName.substring(index, fileName.length));
    });

    expect(log).toMatchSnapshot()

});
