# 🐛 Webview Debugging Guide

## How to Debug VS Code Webviews

### 1. **Open Webview Developer Tools**

```bash
# Method 1: Command Palette
Ctrl+Shift+P → "Developer: Open Webview Developer Tools"

# Method 2: Right-click in webview area
Right-click → "Inspect"
```

### 2. **Check Console Errors**

Look for these common issues in the browser console:

- **404 errors**: Asset files not found (main.js, styles.css, polyfills.js)
- **CSP violations**: Content Security Policy blocking resources
- **JavaScript errors**: Angular startup failures
- **Network errors**: Failed resource loading

### 3. **Common Issues & Solutions**

#### 🔴 **Assets Not Loading (404 Errors)**

```
Failed to load resource: main.js (404)
Failed to load resource: styles.css (404)
```

**Fix**: Check `WebviewHtmlGenerator.getAssetUris()` paths match build output

#### 🔴 **CSP Violations**

```
Refused to load script because it violates CSP directive
```

**Fix**: Update Content Security Policy in HTML generator

#### 🔴 **Angular Not Starting**

```
Error: Cannot find module '@angular/core'
```

**Fix**: Ensure Angular build completed successfully

#### 🔴 **VS Code API Issues**

```
acquireVsCodeApi is not a function
```

**Fix**: VS Code API only available in actual webview, not browser preview

### 4. **Extension Development Console**

```bash
# View extension host logs
Help → Toggle Developer Tools → Console
# Look for Ptah extension logs
```

### 5. **Build Verification**

```bash
# Verify Angular build output
ls -la out/webview/browser/
# Should contain: main.js, styles.css, polyfills.js, index.html

# Test TypeScript compilation
npm run compile
# Should complete without errors
```

### 6. **File Structure Verification**

```
out/
├── webview/
│   └── browser/          # ← Angular build output here
│       ├── main.js       # ← Main Angular bundle
│       ├── styles.css    # ← Compiled styles
│       ├── polyfills.js  # ← Angular polyfills
│       └── index.html    # ← Angular index.html
├── extension.js          # ← Extension entry point
└── ...                   # ← Other extension files
```

### 7. **Quick Debug Steps**

1. **F5** - Launch Extension Development Host
2. **Ctrl+Shift+P** → "Developer: Reload Window" (in Extension Development Host)
3. **Open Ptah activity bar** → Click on the webview
4. **Right-click webview** → "Inspect"
5. **Check Console tab** for errors
6. **Check Network tab** for failed resource loads

### 8. **Manual Testing**

```bash
# Test Angular build works
cd webview/ptah-webview
npm run build:webview

# Test extension compilation works  
npm run compile

# Test both together
npm run build:all
```

## Quick Reference

| Issue | What to Check | Fix Location |
|-------|---------------|--------------|
| Empty webview | Console for 404s | `webview-html-generator.ts` |
| No Angular app | Network tab for failed loads | Angular build process |
| No VS Code API | Extension logs | Extension registration |
| Theme not working | VS Code integration script | HTML generator |

Remember: Always check **both** the extension console AND the webview developer tools!
