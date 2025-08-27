# Technical Architecture — Ptah

Scope

- VS Code extension (TypeScript) + Angular SPA for webviews
- Service Registry pattern; registry-based component management
- Claude Code CLI detection, verification, and streaming

Core Patterns and Files

- Service Registry: `src/core/service-registry.ts`
- Extension lifecycle: `src/core/ptah-extension.ts`, `src/extension.ts`
- Registries: `src/registries/{command-registry,webview-registry,event-registry}.ts`
- Services:
  - `src/services/claude-cli-detector.service.ts` — find CLI
  - `src/services/claude-cli.service.ts` — verify, spawn, stream
  - `src/services/session-manager.ts` — persist sessions, send/receive
  - `src/services/context-manager.ts` — file inclusion/exclusion
  - `src/services/workspace-manager.ts` — workspace awareness
  - `src/services/webview-html-generator.ts` — CSP + assets
  - `src/services/webview-diagnostic.ts` — diagnostics
  - `src/services/webview-message-handlers/*` — message routing
- Webview provider: `src/providers/angular-webview.provider.ts`
- Angular app: `webview/ptah-webview/src/app/*`

Lifecycle Overview

1) Activation: `activate()` in `src/extension.ts`
2) Initialize services via ServiceRegistry (detect/verify Claude CLI)
3) Register registries (commands, webviews, events)
4) Show webview; start message bridge; handle sessions
5) Deactivate: dispose services/providers in reverse order

Message Protocol (VS Code ↔ Angular)

- Channel: `webview.postMessage` / `window.addEventListener('message')`
- Bridge: `webview/ptah-webview/src/app/services/vscode.service.ts`
- Routing: `src/services/webview-message-handlers/message-router.ts` + handlers
- Types: use small payloads with type field; sanitize input

Claude CLI Streaming

- Verification: `ClaudeCliDetector.verifyInstallation()` and `ClaudeCliService.verifyInstallation()` must pass
- Streaming pattern: `ClaudeCliService.createMessageStream()` yields async messages line-by-line
- Token telemetry: parse token lines (e.g., TOKEN_COUNT)
- Error lines prefixed with ERROR: emit system message and log

Error Handling and Logging

- Central logging: `src/core/logger.ts`
- Error handler: `src/handlers/error-handler.ts` (wrap with context)
- Webview errors: post error messages to webview; show VS Code notifications when critical

Disposal and Resource Management

- All services implement `vscode.Disposable`
- Kill spawned CLI child processes on dispose
- Clear maps/streams; unregister event listeners

Security Considerations

- Webview CSP: nonces, restricted script/style/font/img/connect sources
- Input sanitization: strip scripts, validate file paths within workspace
- File access: ensure paths are under workspace root

Build Outputs

- Extension: `out/` (tsc)
- Webview: `out/webview/` (Angular build)

Tests

- VS Code tests: `src/test/` + `tsconfig.test.json`
- Standalone detection tests: `testing/test-detection*.ts` and compiled outputs

References

- `.github/instructions/project.instructions.md` — mandatory patterns
- `docs/angular-webview-setup.md` — Angular SPA guidance
- `docs/webview-debugging-guide.md` — debugging

TODOs

- Add sequence diagram for message routing and streaming
- Add disposal order diagram for services/providers
