# Angular 20 Webview Setup for VS Code Extension

## Overview

This document outlines the implementation of a unified Angular 20 Single Page Application (SPA) within a VS Code extension webview. The solution provides a complete Angular application with routing for chat, command builder, and settings functionality.

## Key Features

### 1. Unified Angular SPA Architecture

- **Single Webview**: One webview provider serves the entire Angular application
- **Angular Routing**: Uses Angular Router with hash-based navigation for webview compatibility
- **Standalone Components**: Following Angular 20+ best practices with standalone components
- **Modern Control Flow**: Uses new Angular control flow syntax (`@if`, `@for`, `@switch`)

### 2. VS Code Integration

- **Message Passing**: Bidirectional communication between Angular and VS Code extension
- **Theme Adaptation**: Automatic adaptation to VS Code light/dark/high-contrast themes
- **State Persistence**: Webview state persisted across VS Code sessions
- **Security**: Proper Content Security Policy (CSP) implementation

### 3. Performance Optimizations

- **Hash Routing**: Prevents VS Code from intercepting navigation
- **Lazy Loading**: Components can be lazy-loaded for better performance
- **Build Optimization**: Optimized Angular build for webview consumption

## Architecture

### Directory Structure

```
src/providers/
├── angular-webview.provider.ts     # Unified webview provider
webview/ptah-webview/
├── src/
│   ├── app/
│   │   ├── app.ts                  # Main app component with routing
│   │   ├── app.config.ts           # Angular configuration
│   │   ├── app.routes.ts           # Route definitions
│   │   ├── components/
│   │   │   ├── chat/               # Chat component
│   │   │   ├── command-builder/    # Command builder component
│   │   │   ├── analytics-dashboard/ # Analytics component
│   │   │   └── navigation/         # Navigation component
│   │   └── services/
│   │       ├── vscode.service.ts   # VS Code integration
│   │       ├── app-state.service.ts # App state management
│   │       └── view-manager.service.ts # View management
│   ├── main.ts                     # Angular bootstrap
│   └── styles.scss                 # Global styles
├── angular.json                    # Angular CLI configuration
└── package.json                    # Dependencies and scripts
```

### Communication Flow

```
VS Code Extension ↔ Webview HTML ↔ Angular App
                 ↕                ↕
            postMessage()    vscode.service.ts
                 ↕                ↕
         Message Handlers    Components/Services
```

## Implementation Details

### 1. Webview Provider Setup

The `AngularWebviewProvider` creates a unified webview that serves the entire Angular application:

```typescript
// Key features:
- Single webview panel or view
- Proper CSP configuration
- Angular build integration
- Theme synchronization
- Message handling
```

### 2. Angular Configuration

**Hash-based Routing**: Essential for webview compatibility

```typescript
provideRouter(routes, 
  withHashLocation(),  // Prevents VS Code navigation interception
  withInMemoryScrolling()
)
```

**Standalone Components**: Following Angular 20+ best practices

```typescript
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavigationComponent], // Direct imports
  template: `<router-outlet></router-outlet>`
})
```

### 3. VS Code Integration

**Message Communication**:

```typescript
// From Angular to VS Code
vscode.postMessage({ type: 'chat:sendMessage', data: {...} });

// From VS Code to Angular
window.addEventListener('message', (event) => {
  const message = event.data;
  // Handle message
});
```

**Theme Integration**:

```css
:root {
  --vscode-font-family: var(--vscode-font-family);
  --vscode-foreground: var(--vscode-foreground);
  --vscode-background: var(--vscode-editor-background);
}
```

## Build Process

### Development Workflow

1. **Install Dependencies**:

   ```bash
   npm run install:webview
   ```

2. **Development Mode**:

   ```bash
   # Terminal 1: Watch TypeScript compilation
   npm run watch
   
   # Terminal 2: Watch Angular compilation
   npm run dev:webview
   ```

3. **Test in VS Code**:
   - Press `F5` to launch Extension Development Host
   - Open Ptah views in the activity bar

### Production Build

```bash
# Build everything for production
npm run build:all

# Or build separately
npm run compile        # TypeScript extension code
npm run build:webview  # Angular webview application
```

### Build Configuration

**Angular Build**: Configured in `angular.json`

```json
"webview": {
  "optimization": true,
  "outputHashing": "none",    // Important: no hashing for webview
  "sourceMap": false,
  "extractLicenses": true,
  "outputPath": "../../out/webview"  // Output to extension's out folder
}
```

## Best Practices

### 1. Security

- Always use CSP with specific nonces
- Validate all messages from VS Code
- Sanitize user input before displaying

### 2. Performance

- Use hash routing for webview compatibility
- Implement lazy loading for large components
- Optimize bundle size with tree shaking

### 3. User Experience

- Handle theme changes gracefully
- Provide loading states
- Maintain state across webview hide/show

### 4. Development

- Use Angular standalone components
- Follow Angular style guide
- Implement proper error handling

## Troubleshooting

### Common Issues

1. **Empty Webview Page**:
   - Check Angular build output path
   - Verify CSP configuration
   - Check browser console for errors

2. **Routing Issues**:
   - Ensure hash-based routing is configured
   - Check for console navigation errors
   - Verify base href configuration

3. **Theme Issues**:
   - Check CSS variable integration
   - Verify theme message handling
   - Test in all VS Code themes

4. **Message Passing Issues**:
   - Verify VS Code API acquisition
   - Check message type consistency
   - Validate message payload structure

### Debug Tools

**VS Code Developer Tools**:

- `Developer: Toggle Developer Tools` command
- `Developer: Reload Webview` command
- Check webview console for Angular errors

**Angular Debug**:

```typescript
// Add to main.ts for debugging
if (!environment.production) {
  console.log('Angular Debug Mode');
  // Add debug logging
}
```

## Migration Guide

### From Multiple Webviews to Unified SPA

1. **Update Provider Registration**:
   - Replace multiple providers with single `AngularWebviewProvider`
   - Update command registrations

2. **Implement Angular Routing**:
   - Define routes for each previous webview
   - Update navigation to use Angular Router

3. **Consolidate Message Handling**:
   - Merge message handlers into unified system
   - Update message types and payloads

4. **Update Build Process**:
   - Configure Angular build for webview output
   - Update extension build scripts

## Future Enhancements

### Planned Features

- Micro-frontend architecture for modularity
- Progressive Web App (PWA) capabilities
- Advanced state management with signals
- Enhanced accessibility features

### Performance Optimizations

- Bundle splitting for lazy loading
- Service worker for caching
- Virtual scrolling for large lists
- Code splitting at route level

## Conclusion

This unified Angular SPA approach provides a modern, maintainable solution for VS Code webview applications. It leverages Angular 20's latest features while ensuring compatibility with VS Code's webview constraints.

The architecture supports easy extension with new features while maintaining performance and user experience standards expected in VS Code extensions.
