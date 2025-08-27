# Developer Guide — Ptah

Prerequisites

- VS Code 1.74+
- Node.js LTS
- Claude Code CLI installed and detectable

Install & Build

- Root install: `npm install`
- Webview deps: `npm run install:webview`
- Compile extension: `npm run compile`
- Build webview: `npm run build:webview`
- Build all: `npm run build:all`
- Watch (ext): `npm run watch`
- Watch (webview): `npm run dev:webview`

Run & Debug

- Press F5 to launch Extension Development Host
- Open Ptah activity bar icon to load webview
- Debug logs: View → Output → (select Ptah)
- Webview dev tools: Developer: Open Webview Developer Tools

Angular Best Practices (required)

- Standalone components; no NgModules
- Hash-based routing in webview
- CSP with nonce; no inline scripts without nonce
- Use `vscode.service.ts` bridge for messaging

Add a Command (example)

- Register in `src/registries/command-registry.ts`
- Implement handler in `src/handlers/command-handlers.ts`
- Contribute command in `package.json` if needed

Add a Webview Route (Angular)

- Define route in `webview/ptah-webview/src/app/app.routes.ts`
- Implement component under `webview/ptah-webview/src/app/components/...`
- Export in standalone component imports of `app.ts`
- Use `vscode.service.ts` to communicate

Add a Service (extension)

- Create service in `src/services/<name>.ts`
- Register in `src/core/service-registry.ts` (after dependencies)
- Inject into providers that need it via constructor

Testing

- VS Code tests: `npm run test`
- Standalone CLI detection: see `testing/test-detection*.ts`
- Lint: `npm run lint`

Troubleshooting

- Empty webview → check Angular build output and CSP
- CLI not detected → see `claude-cli-detector.service.ts`
- Asset 404s → `webview-html-generator.ts` paths
- Message issues → `webview-message-handlers/*` and `vscode.service.ts`

Links

- `src/core/service-registry.ts`
- `src/registries/*.ts`
- `src/services/*.ts`
- `src/providers/angular-webview.provider.ts`
- `webview/ptah-webview/src/app/*`
- `docs/angular-webview-setup.md`
