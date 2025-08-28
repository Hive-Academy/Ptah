---
applyTo: '**'
---

# Ptah VS Code Extension - AI Assistant Instructions

## Project Overview

Ptah is a comprehensive VS Code extension that provides visual interfaces for Claude Code CLI. Built with TypeScript (extension host) and Angular (webviews), it enables developers to interact with Claude AI through native VS Code UI components.

## Architecture Patterns

### Service Registry Pattern

- **Core Pattern**: All services are registered through `ServiceRegistry` in dependency order
- **File**: `src/core/service-registry.ts` - Initialize services before UI providers
- **Key Services**: `ClaudeCliService`, `SessionManager`, `ContextManager`, `WorkspaceManager`
- **UI Providers**: `AngularWebviewProvider` depends on all core services

### Registry-Based Component Management

- **Command Registry**: `src/registries/command-registry.ts` - Centralized command registration
- **Webview Registry**: `src/registries/webview-registry.ts` - Manages Angular webview providers
- **Event Registry**: `src/registries/event-registry.ts` - Handles VS Code event subscriptions

### Extension Lifecycle

1. `PtahExtension.initialize()` - Initialize services via registry
2. `PtahExtension.registerAll()` - Register commands, webviews, events
3. Services are disposed in reverse order on extension deactivation

## Critical Workflows

### Claude CLI Integration

- **Detection**: Use `ClaudeCliDetector` service to find CLI installation
- **Commands**: Spawn processes with proper stdio piping for streaming responses
- **Error Handling**: Always check `verifyInstallation()` before CLI operations
- **Pattern**: Async iterators for streaming chat responses from Claude

### Session Management

- **Storage**: Sessions persist in VS Code `globalState` with date serialization
- **Current Session**: Managed via `SessionManager.getCurrentSession()`
- **Message Flow**: User message → `SessionManager.sendMessage()` → Claude CLI → Stream response

### Angular Webview Communication

- **Message Protocol**: VS Code ↔ Angular communication via `postMessage`/`addEventListener`
- **Security**: All webviews use CSP with nonces and restricted sources
- **Data Flow**: Extension services → Webview providers → Angular components

## Development Conventions

### Angular Best Practices (MANDATORY)

- **Always use `mcp_angular-cli_get_best_practices` first** before any Angular work
- **Search documentation**: Use `mcp_angular-cli_search_documentation` for current APIs
- **Standalone Components**: Required pattern - no NgModules

```typescript
@Component({
  selector: 'ptah-chat',
  imports: [CommonModule, ReactiveFormsModule], // Direct imports
  template: `...`
})
```

### TypeScript & SOLID Principles

- **Single Responsibility**: One service, one purpose (`ClaudeCliService` only handles CLI)
- **Dependency Injection**: Use constructor injection, avoid static dependencies

```typescript
constructor(private sessionManager: SessionManager) {} // Good
// SessionManager.getInstance() // Avoid
```

- **Interface Segregation**: Small, focused interfaces in `src/types/`
- **DRY**: Extract common patterns to utilities, avoid code duplication
- **YAGNI**: Don't add features until needed - keep services minimal

### TypeScript Patterns

- **Interfaces**: All types defined in `src/types/` with clear separation (common, command-builder types)
- **Error Handling**: Use `ErrorHandler.withContext()` for contextual error reporting
- **Logging**: `Logger` service for consistent logging across all components
- **Disposal**: All services implement `vscode.Disposable` with proper cleanup

### Angular Integration

- **Build Target**: Angular builds to `../out/webview/` for extension consumption
- **VS Code API**: Access via `acquireVsCodeApi()` - never mock in development
- **Theme Support**: Components react to VS Code theme changes via message passing
- **Standalone Components**: Use Angular 17+ standalone component pattern

### File Organization

```
src/
├── core/           # Extension lifecycle, logging, registries
├── services/       # Business logic (Claude CLI, sessions, context)
├── providers/      # VS Code UI providers (webviews, trees)
├── handlers/       # Command and error handlers
├── registries/     # Component registration logic
└── types/          # TypeScript interfaces
```

## Build & Testing

### Development Commands

- `npm run watch` - TypeScript compilation in watch mode (required for development)
- `npm run build:webview` - Build Angular webviews for production
- `npm run dev:webview` - Angular development build with watch
- `F5` in VS Code - Launch Extension Development Host

### Testing Strategy

- **Standalone Tests**: `testing/test-detection-standalone.ts` for service testing outside VS Code
- **Unit Tests**: `src/test/` for VS Code extension components
- **Manual Testing**: Use Extension Development Host with real workspaces

### Claude CLI Dependencies

- **Required**: Claude Code CLI must be installed and detectable
- **Detection Order**: Global PATH → user local bin → system paths → Windows AppData
- **Validation**: Always verify CLI responds to `--version` before use

## Key Integration Points

### VS Code Extension API

- **Activation**: `onStartupFinished` - extension loads with VS Code
- **Views**: Activity bar container with webview and tree views
- **Commands**: All prefixed with `ptah.` - registered via command registry
- **Context**: File inclusion/exclusion via explorer context menus

### External Dependencies

- **Claude Code CLI**: Core dependency - detect installation paths dynamically
- **RxJS**: Used for reactive patterns in services
- **UUID**: Generate unique identifiers for sessions and messages

### Security Considerations

- **CSP**: Strict Content Security Policy for all webviews
- **File Access**: Validate file paths are within workspace boundaries
- **Input Sanitization**: Sanitize user input before Claude CLI commands

## Common Patterns to Follow

### Mandatory Angular Workflow

```typescript
// 1. ALWAYS start with best practices
const bestPractices = await mcp_angular_get_best_practices();
// 2. Search docs for current APIs
const docs = await mcp_angular_search_documentation('standalone components');
```

### Service Design (SOLID/DRY)

```typescript
// Single Responsibility - focused service
export class ClaudeCliService {
  async verifyInstallation(): Promise<boolean> {
    /* one job */
  }
}

// Dependency Injection - constructor pattern
export class SessionManager {
  constructor(private context: vscode.ExtensionContext) {}
}
```

### Service Initialization

```typescript
// Always check CLI availability before operations
const isAvailable = await this.claudeCliService.verifyInstallation();
if (!isAvailable) {
  throw new Error('Claude CLI not available');
}
```

### Message Streaming

```typescript
// Use async iterators for Claude response streaming
for await (const message of messageStream) {
  // Handle streaming message
}
```

### State Management

```typescript
// Use VS Code context for persistent state
await this.context.globalState.update('key', value);
const value = this.context.globalState.get('key', defaultValue);
```

When working with this codebase, always ensure Claude CLI availability first, use the registry pattern for new components, and maintain the Angular ↔ VS Code communication protocols.
