# Project Overview — Ptah (Claude Code GUI for VS Code)

Purpose

- Provide a complete, native VS Code interface for Claude Code CLI: chat, visual command builder, intelligent context, sessions, and analytics.

What it is

- VS Code extension (TypeScript) + Angular 17+ webview app (standalone components) that exposes Claude Code functionality through familiar VS Code UX.

Why it matters

- Eliminates CLI friction, increases adoption, and standardizes Claude workflows inside VS Code.

Key Features

- Chat sidebar and full panel
- Visual command builder with templates
- Intelligent context management with token meter
- Workspace-aware sessions
- Real-time analytics

Architecture at a glance

- Extension host
  - Core services: `ClaudeCliService`, `SessionManager`, `ContextManager`, `WorkspaceManager`
  - Registries: `ServiceRegistry`, `CommandRegistry`, `WebviewRegistry`, `EventRegistry`
  - Provider: `AngularWebviewProvider` (unified SPA)
- Angular webview (webview/ptah-webview)
  - Standalone components and services
  - `vscode.service.ts` for message bridge

Primary Workflows

- Chat: User message → SessionManager → Claude CLI stream → Webview renders
- Command builder: Template → parameter form → CLI command → execute/preview
- Context: Include/exclude files → token estimate → suggestions
- Sessions: Create/switch → persisted in globalState

How to Run (dev)

- Install deps: `npm install` (root) and `npm run install:webview`
- Watch: `npm run watch` (TS) and `npm run dev:webview` (Angular)
- Launch: Press F5 (Extension Development Host)

Builds

- `npm run compile` — build extension
- `npm run build:webview` — build Angular webview
- `npm run build:all` — both

Key Files

- `src/core/service-registry.ts` — init services before UI
- `src/registries/*.ts` — register commands, webviews, events
- `src/services/*.ts` — business logic
- `src/services/webview-message-handlers/*` — message routing
- `src/providers/angular-webview.provider.ts` — unified webview provider
- `webview/ptah-webview/src/app/*` — Angular app

Security

- Strict CSP with nonces, restricted sources
- File access validated to workspace boundaries

Notes

- Follow `.github/instructions/project.instructions.md` (registry pattern, CLI detection, streaming, Angular standalone)
- Memory bank docs are concise, skimmable, and link to real files
