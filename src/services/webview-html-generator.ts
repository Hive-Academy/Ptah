import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

/**
 * WebviewHtmlGenerator - Single Responsibility: Generate HTML content for Angular webviews
 * IMPROVED based on 4gray/vscode-webview-angular research findings
 * Follows SOLID principles by focusing only on HTML generation logic
 */
export class WebviewHtmlGenerator {
  constructor(private context: vscode.ExtensionContext) {}

  /**
   * Generate HTML content for Angular SPA application - IMPROVED METHOD
   * Based on research: Read actual index.html and modify it rather than recreating
   * Optimized for Angular 20+ with proper CSP and modern asset handling
   */
  generateAngularWebviewContent(webview: vscode.Webview, workspaceInfo?: any): string {
    try {
      const htmlContent = this._getHtmlForWebview(webview, workspaceInfo);
      return htmlContent;
    } catch (error) {
      console.error('Error generating webview content:', error);
      // Fallback to basic HTML
      return this.generateFallbackHtml(webview, workspaceInfo);
    }
  }

  /**
   * RESEARCH-BASED IMPLEMENTATION: Read and modify actual Angular index.html
   * This follows the proven pattern from 4gray/vscode-webview-angular
   */
  private _getHtmlForWebview(webview: vscode.Webview, workspaceInfo?: any): string {
    // Path to Angular dist folder (browser build output)
    const appDistPath = path.join(this.context.extensionPath, 'out', 'webview', 'browser');
    const appDistPathUri = vscode.Uri.file(appDistPath);

    // Create base URI for assets - CRITICAL for proper asset loading
    const baseUri = webview.asWebviewUri(appDistPathUri);

    // Read the actual Angular-generated index.html
    const indexPath = path.join(appDistPath, 'index.html');

    if (!fs.existsSync(indexPath)) {
      throw new Error(`Angular index.html not found at ${indexPath}`);
    }

    let indexHtml = fs.readFileSync(indexPath, { encoding: 'utf8' });

    // RESEARCH FINDING: Update base URI - this is the key fix for asset loading
    indexHtml = indexHtml.replace('<base href="/">', `<base href="${String(baseUri)}/">`);

    // IMPROVED CSP: Fix Google Fonts and add proper nonce support
    const nonce = this.generateNonce();
    const cspContent = this.getImprovedCSP(webview, nonce);

    // Add CSP meta tag after charset
    indexHtml = indexHtml.replace(
      '<meta charset="utf-8">',
      `<meta charset="utf-8">
        <meta http-equiv="Content-Security-Policy" content="${cspContent}">`
    );

    // Add VS Code integration and theme support
    const theme = vscode.window.activeColorTheme.kind;
    const integrationScript = this.getVSCodeIntegrationScript(theme, workspaceInfo);
    const themeStyles = this.getThemeStyles();

    // Inject theme styles in head
    indexHtml = indexHtml.replace(
      '</head>',
      `  <style nonce="${nonce}">
          ${themeStyles}
        </style>
      </head>`
    );

    // Add VS Code theme class to body
    indexHtml = indexHtml.replace(
      '<body>',
      `<body class="vscode-body ${this.getThemeClass(theme)}">`
    );

    // Inject VS Code integration script before closing body
    indexHtml = indexHtml.replace(
      '</body>',
      `  <script nonce="${nonce}">
          ${integrationScript}
        </script>
        <script nonce="${nonce}">
          ${this.getStartupScript()}
        </script>
      </body>`
    );

    // Update script tags to include nonce and handle ES modules
    indexHtml = indexHtml.replace(
      /<script([^>]*src="[^"]*"[^>]*)>/g,
      `<script$1 nonce="${nonce}">`
    );

    // Handle ES module scripts specifically
    indexHtml = indexHtml.replace(
      /<script([^>]*type="module"[^>]*)>/g,
      `<script$1 nonce="${nonce}">`
    );

    return indexHtml;
  }

  /**
   * IMPROVED CSP based on research findings - allows Google Fonts properly
   * FIXED: Allow base-uri to be set to webview resource URI and support ES modules
   * FIXED: Add hash support for Angular inline styles
   */
  private getImprovedCSP(webview: vscode.Webview, nonce: string): string {
    return `default-src 'none'; 
            img-src ${webview.cspSource} https: data: blob:; 
            script-src 'nonce-${nonce}' 'unsafe-eval'; 
            style-src ${webview.cspSource} 'nonce-${nonce}' https://fonts.googleapis.com 'sha256-dQd/GtLRWYfLliank9qmxLGQhSvkLcoQqPrBi23g11w=' 'sha256-Jf/E9C3dz9r4Nou2Og4ugQAa4djKPORUOXtnbwzkc04=' 'sha256-vtlA1C5740fkVABhSF8bRs5Rq+kS2texPphnuFMuze8=' 'sha256-WkoVQNtr3A8I4hZyE0S++sWJfE/v9ouy02Ne5tYBkG4='; 
            font-src ${webview.cspSource} https://fonts.gstatic.com https://fonts.googleapis.com data:;
            connect-src 'self' ${webview.cspSource};
            frame-src 'none';
            object-src 'none';
            base-uri 'self' ${webview.cspSource};`;
  }

  /**
   * Fallback HTML generation if reading index.html fails
   * FIXED: Remove polyfills.js reference as Angular 20+ doesn't generate it
   */
  private generateFallbackHtml(webview: vscode.Webview, workspaceInfo?: any): string {
    const { scriptUri, stylesUri } = this.getAssetUris(webview);
    const nonce = this.generateNonce();
    const theme = vscode.window.activeColorTheme.kind;

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <title>Ptah - Claude Code Assistant</title>
        <base href="${webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'out', 'webview', 'browser'))}/">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta http-equiv="Content-Security-Policy" content="${this.getImprovedCSP(webview, nonce)}">
        
        <!-- Angular Styles -->
        <link rel="stylesheet" href="${stylesUri}" nonce="${nonce}">
        
        <!-- VS Code Theme Integration -->
        <style nonce="${nonce}">
          ${this.getThemeStyles()}
        </style>
      </head>
      <body class="vscode-body ${this.getThemeClass(theme)}">
        <!-- Angular App Root -->
        <app-root></app-root>
        
        <!-- VS Code Integration Script -->
        <script nonce="${nonce}">
          ${this.getVSCodeIntegrationScript(theme, workspaceInfo)}
        </script>
        
        <!-- Angular Main Bundle (ES Module) -->
        <script src="${scriptUri}" type="module" nonce="${nonce}" onerror="console.error('Failed to load main Angular bundle')"></script>
        
        <!-- Startup Script -->
        <script nonce="${nonce}">
          ${this.getStartupScript()}
        </script>
      </body>
      </html>
    `;
  }

  private getAssetUris(webview: vscode.Webview) {
    const angularDistPath = vscode.Uri.joinPath(
      this.context.extensionUri,
      'out',
      'webview',
      'browser'
    );

    return {
      scriptUri: webview.asWebviewUri(vscode.Uri.joinPath(angularDistPath, 'main.js')),
      stylesUri: webview.asWebviewUri(vscode.Uri.joinPath(angularDistPath, 'styles.css')),
    };
  }

  private getThemeStyles(): string {
    return `
      :root {
        --vscode-font-family: var(--vscode-font-family, 'Segoe WPC', 'Segoe UI', sans-serif);
        --vscode-font-size: var(--vscode-font-size, 13px);
        --vscode-foreground: var(--vscode-foreground);
        --vscode-background: var(--vscode-editor-background);
        --vscode-sidebar-background: var(--vscode-sideBar-background);
        --vscode-button-background: var(--vscode-button-background);
        --vscode-button-foreground: var(--vscode-button-foreground);
        --vscode-input-background: var(--vscode-input-background);
        --vscode-input-foreground: var(--vscode-input-foreground);
        --vscode-input-border: var(--vscode-input-border);
      }
      
      body {
        font-family: var(--vscode-font-family);
        font-size: var(--vscode-font-size);
        color: var(--vscode-foreground);
        background-color: var(--vscode-background);
        margin: 0;
        padding: 0;
        overflow: hidden;
      }

      body.vscode-dark { color-scheme: dark; }
      body.vscode-light { color-scheme: light; }
      body.vscode-high-contrast { color-scheme: dark; }
    `;
  }

  private getVSCodeIntegrationScript(theme: vscode.ColorThemeKind, workspaceInfo?: any): string {
    return `
      // Acquire VS Code API
      const vscode = acquireVsCodeApi();
      
      // Global configuration for Angular app
      window.vscode = vscode;
      window.ptahConfig = {
        isVSCode: true,
        theme: '${this.getThemeString(theme)}',
        workspaceRoot: '${workspaceInfo?.path || ''}',
        workspaceName: '${workspaceInfo?.name || ''}',
        extensionUri: '${this.context.extensionUri.toString()}'
      };
      
      // Restore previous state
      const previousState = vscode.getState();
      if (previousState) {
        window.ptahPreviousState = previousState;
      }

      // Handle theme changes
      window.addEventListener('message', (event) => {
        const message = event.data;
        if (message.type === 'themeChanged') {
          document.body.className = 'vscode-body ' + message.themeClass;
          window.ptahConfig.theme = message.theme;
          
          // Notify Angular about theme change
          window.dispatchEvent(new CustomEvent('vscode-theme-changed', { 
            detail: { theme: message.theme, themeClass: message.themeClass } 
          }));
        }
      });

      console.log('Ptah WebView: VS Code API initialized', window.ptahConfig);
    `;
  }

  private getStartupScript(): string {
    return `
      // Notify extension that webview is ready
      setTimeout(() => {
        if (window.vscode) {
          window.vscode.postMessage({ type: 'webview-ready' });
        }
      }, 100);
    `;
  }

  private getThemeClass(theme: vscode.ColorThemeKind): string {
    switch (theme) {
      case vscode.ColorThemeKind.Light:
        return 'vscode-light';
      case vscode.ColorThemeKind.HighContrast:
        return 'vscode-high-contrast';
      case vscode.ColorThemeKind.Dark:
      default:
        return 'vscode-dark';
    }
  }

  private getThemeString(theme: vscode.ColorThemeKind): string {
    switch (theme) {
      case vscode.ColorThemeKind.Light:
        return 'light';
      case vscode.ColorThemeKind.HighContrast:
        return 'high-contrast';
      case vscode.ColorThemeKind.Dark:
      default:
        return 'dark';
    }
  }

  private generateNonce(): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }
}
