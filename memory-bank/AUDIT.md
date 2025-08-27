# Memory Bank Source Audit

Date: 2025-08-27
Branch: docs/memory-bank

This audit lists authoritative sources in the Ptah repository to guide generation of ProjectOverview.md, TechnicalArchitecture.md, and DeveloperGuide.md.

## Key High-Signal Docs

- README.md — Top-level features and scripts
- docs/ptah-technical-design.md — Architecture and patterns (extension + webview)
- docs/ptah-requirements.md — Product/MVP requirements and success criteria
- docs/current-status.md — Current implementation status and next steps
- docs/angular-webview-setup.md — Angular 20 webview SPA setup and integration
- docs/webview-debugging-guide.md, docs/debugging-guide.md — Troubleshooting and debug flows

## Critical Source Files (by area)

### Core and Lifecycle

- src/extension.ts — Activation entry
- src/core/service-registry.ts — Service Registry initialization order (critical)
- src/core/ptah-extension.ts — Extension controller and lifecycle
- src/core/logger.ts — Logging service

### Registries

- src/registries/command-registry.ts — Centralized command registration
- src/registries/webview-registry.ts — Angular webview provider registration
- src/registries/event-registry.ts — VS Code event subscriptions

### Services

- src/services/claude-cli-detector.service.ts — Detection for Claude Code CLI
- src/services/claude-cli.service.ts — CLI integration + streaming
- src/services/session-manager.ts — Persistence and message flow
- src/services/context-manager.ts — Context inclusion/exclusion
- src/services/workspace-manager.ts — Workspace awareness
- src/services/webview-html-generator.ts — CSP and asset URIs
- src/services/webview-diagnostic.ts — Webview asset checks
- src/services/webview-message-handlers/* — Angular ↔ VS Code message handling (router + handlers)

### Providers (UI)

- src/providers/angular-webview.provider.ts — Unified Angular SPA webview provider

### Angular Webview (SPA)

- webview/ptah-webview/angular.json — Build outDir to ../out/webview
- webview/ptah-webview/src/app/** — Standalone components and services
- webview/ptah-webview/src/app/services/vscode.service.ts — acquireVsCodeApi bridge
- webview/ptah-webview/src/app/app.routes.ts — Routes for chat, command builder, analytics

## Build & Dev Commands (from package.json)

- npm run compile — TypeScript compile for extension
- npm run watch — TypeScript watch mode
- npm run compile:test — Compile tests
- npm run watch:test — Watch tests
- npm run test — Run VS Code tests
- npm run build:webview — Build Angular app (delegates into webview/ptah-webview)
- npm run dev:webview — Watch Angular app
- npm run install:webview — Install Angular deps
- npm run build:all — Compile extension + build webview

## Prerequisites

- VS Code >= 1.74.0
- Node.js LTS recommended
- Claude Code CLI installed and detectable (see claude-cli-detector.service.ts)

## Notes

- Follow .github/instructions/project.instructions.md for patterns and security
- Angular webviews must use CSP with nonce and restricted sources
- All links in generated docs should be relative and verify against actual files
