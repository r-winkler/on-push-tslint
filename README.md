# on-push-tslint

Verifiy that components use the OnPush change detection strategy.

## Usage

```bash
"rulesDirectory": [
    "../node_modules/on-push-tslint"
  ],
  "rules": {
    "on-push-change-detection": [
      true,
      ".*.spec.ts$",
      "app.component.ts"
    ]
  }
```
Files can be excluded from the check by a regex in the option list.
