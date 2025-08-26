# 🛠️ VS Code Extension Debugging & Testing Guide

## 🚀 **Quick Start: F5 Debugging**

### **Method 1: Extension Development Host (Recommended)**

1. **Open VS Code**: Open the Ptah project in VS Code

   ```bash
   cd d:/projects/Ptah
   code .
   ```

2. **Compile TypeScript**: Ensure your code is compiled

   ```bash
   npm run compile
   # OR for watch mode
   npm run watch
   ```

3. **Launch Debugger**: Press `F5` or:
   - Go to `Run and Debug` panel (Ctrl+Shift+D)
   - Select "Run Extension"
   - Click the green play button

4. **Extension Development Host Opens**:
   - A new VS Code window opens with `[Extension Development Host]` in the title
   - Your extension is loaded and active in this window
   - You can set breakpoints in your original window

### **What Happens When F5 is Pressed:**

- VS Code compiles your TypeScript (if needed)
- Launches a new VS Code instance with your extension loaded
- Attaches debugger to the extension process
- Your extension's `activate()` function runs
- You can interact with your extension and debug in real-time

### **Current Debug Configuration** ✅

Our `.vscode/launch.json` is already configured:

```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Run Extension",
            "type": "extensionHost",
            "request": "launch",
            "args": [
                "--extensionDevelopmentPath=${workspaceFolder}"
            ],
            "outFiles": [
                "${workspaceFolder}/out/**/*.js"
            ],
            "preLaunchTask": "${workspaceFolder}/npm: compile"
        }
    ]
}
```

---

## 🧪 **Testing Our Extension Features**

### **Step 1: Basic Extension Activation**

1. Press `F5` to launch Extension Development Host
2. Look for Ptah icon in activity bar (left sidebar)
3. Check `View` → `Output` → Select "Ptah" from dropdown
4. Should see: `[INFO] Activating Ptah extension...`

### **Step 2: Test Chat Sidebar**

1. Click the Ptah icon in activity bar
2. Chat sidebar should open with HTML interface
3. Try typing a message (won't send to Claude without proper CLI setup)
4. Check for JavaScript console errors: `Help` → `Toggle Developer Tools`

### **Step 3: Test Commands**

1. Press `Ctrl+Shift+P` to open command palette
2. Type "Ptah" to see all our commands:
   - `Ptah: Quick Chat`
   - `Ptah: Review Current File`
   - `Ptah: Generate Tests`
   - `Ptah: Build Command`

### **Step 4: Test File Context Menus**

1. Right-click any file in Explorer
2. Should see "Review Current File" option
3. Click to test (will show warning if no Claude CLI)

---

## 🔍 **Advanced Debugging Techniques**

### **Setting Breakpoints**

1. **In TypeScript files**: Click in the gutter (left of line numbers) to set breakpoints
2. **Key places to debug**:
   - `src/extension.ts` → `activate()` function
   - `src/core/ptah-extension.ts` → `initialize()` method
   - `src/services/claude-cli.service.ts` → `verifyInstallation()` method
   - `src/providers/chat-sidebar.provider.ts` → `resolveWebviewView()` method

### **Debug Output Channels**

```typescript
// Add debug statements to our code
Logger.info('Debug: Extension activating...');
Logger.error('Debug: Error occurred', error);

// View output: View → Output → Select "Ptah"
```

### **Debugging Webview Communication**

1. **Open Developer Tools**: In Extension Development Host → `Help` → `Toggle Developer Tools`
2. **Check Console**: Look for JavaScript errors from webview
3. **Message Passing**: Set breakpoints in `postMessage` handlers

### **Debugging with Different VS Code Versions**

```json
// In launch.json, add version property
{
    "name": "Run Extension (Insiders)",
    "type": "extensionHost",
    "request": "launch",
    "args": [
        "--extensionDevelopmentPath=${workspaceFolder}"
    ],
    "outFiles": ["${workspaceFolder}/out/**/*.js"],
    "version": "insiders"  // or "stable"
}
```

---

## 🧪 **Extension Testing Setup**

### **Method 1: Manual Testing (Current)**

- Use F5 Extension Development Host
- Manually test each feature
- Check logs and console output

### **Method 2: Automated Testing (Future Enhancement)**

```bash
# Install test dependencies
npm install --save-dev @vscode/test-cli @vscode/test-electron

# Add to package.json scripts
"test": "vscode-test"

# Create test configuration
touch .vscode-test.js
```

### **Test Configuration Example**

```javascript
// .vscode-test.js
const { defineConfig } = require('@vscode/test-cli');

module.exports = defineConfig({
  files: 'out/test/**/*.test.js',
  workspaceFolder: './test-workspace',
  mocha: {
    ui: 'tdd',
    timeout: 20000
  }
});
```

---

## 🚨 **Common Debugging Issues & Solutions**

### **Issue 1: Extension Doesn't Activate**

- **Check**: `package.json` activation events
- **Solution**: Ensure `"onStartupFinished"` is in `activationEvents`
- **Debug**: Set breakpoint in `activate()` function

### **Issue 2: Commands Not Found**

- **Check**: Commands registered in `contributes.commands`
- **Solution**: Verify command IDs match exactly
- **Debug**: Check `registerCommands()` method

### **Issue 3: Webview Doesn't Load**

- **Check**: CSP (Content Security Policy) in webview HTML
- **Solution**: Ensure all resources use `vscode-resource:` scheme
- **Debug**: Check Developer Tools console

### **Issue 4: TypeScript Compilation Errors**

```bash
# Check compilation manually
npm run compile

# Watch for changes
npm run watch

# Clear output and recompile
rm -rf out/
npm run compile
```

### **Issue 5: Claude CLI Not Found**

- **Expected**: Extension should show warning dialog
- **Debug**: Set breakpoint in `handleClaudeNotFound()` method
- **Test**: Temporarily rename Claude CLI to test error handling

---

## 📊 **Performance Debugging**

### **Extension Activation Time**

```typescript
// Add timing to extension.ts
const startTime = Date.now();
await ptahExtension.initialize();
const endTime = Date.now();
Logger.info(`Extension activated in ${endTime - startTime}ms`);
```

### **Memory Usage Monitoring**

```typescript
// Monitor memory in services
const memUsage = process.memoryUsage();
Logger.info(`Memory usage: ${JSON.stringify(memUsage)}`);
```

### **VS Code Performance**

- `Help` → `Show Performance` - Check extension impact
- Extension should activate in <500ms
- UI responses should be <100ms

---

## 🔄 **Development Workflow**

### **Recommended Flow**

1. **Make changes** to TypeScript files
2. **Compile**: `npm run compile` (or watch mode)
3. **Test**: Press `F5` to test in Extension Development Host
4. **Debug**: Set breakpoints and investigate issues
5. **Reload**: `Ctrl+R` in Extension Development Host to reload
6. **Repeat**: Iterate until feature works

### **Quick Reload**

- In Extension Development Host: `Ctrl+R` or `Developer: Reload Window`
- Reloads extension without restarting debugger

### **Clean Restart**

- Stop debugging (`Shift+F5`)
- `npm run compile`
- Start debugging (`F5`)

---

## 🎯 **Testing Checklist**

### **Basic Functionality**

- [ ] Extension activates without errors
- [ ] Ptah icon appears in activity bar
- [ ] Chat sidebar opens and loads
- [ ] Commands appear in command palette
- [ ] Context menus show Ptah options
- [ ] Settings panel works

### **Error Handling**

- [ ] Claude CLI not found - shows proper warning
- [ ] Network errors handled gracefully
- [ ] File system errors don't crash extension
- [ ] Invalid user input handled properly

### **Performance**

- [ ] Extension activates quickly (<500ms)
- [ ] UI remains responsive
- [ ] No memory leaks during extended use
- [ ] Large files don't freeze interface

This debugging setup ensures we can thoroughly test and debug our Ptah extension during development! 🚀
