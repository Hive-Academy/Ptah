import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '../core/logger';
import { ContextInfo, OptimizationSuggestion } from '../types/common.types';

export class ContextManager implements vscode.Disposable {
  private includedFiles: Set<string> = new Set();
  private excludedFiles: Set<string> = new Set();
  private disposables: vscode.Disposable[] = [];
  private readonly MAX_TOKENS = 200000;
  private readonly CHARS_PER_TOKEN = 4; // Rough estimate

  constructor() {
    this.loadFromWorkspaceState();
    this.setupAutoInclude();
  }

  async includeFile(uri: vscode.Uri): Promise<void> {
    const filePath = uri.fsPath;

    if (this.includedFiles.has(filePath)) {
      return; // Already included
    }

    // Validate file path
    if (!filePath || filePath.trim() === '' || filePath === 'tasks') {
      Logger.warn(`Invalid file path provided: ${filePath}`);
      return;
    }

    // Check if file exists and is readable
    try {
      await fs.promises.access(filePath, fs.constants.R_OK);
    } catch (error) {
      Logger.warn(`Cannot include file (not readable): ${filePath}`);
      throw new Error(`File is not readable: ${filePath}`);
    }

    this.includedFiles.add(filePath);
    this.excludedFiles.delete(filePath); // Remove from excluded if it was there

    Logger.info(`Included file in context: ${filePath}`);

    await this.saveToWorkspaceState();
    await this.notifyContextChanged();
  }

  async excludeFile(uri: vscode.Uri): Promise<void> {
    const filePath = uri.fsPath;

    this.includedFiles.delete(filePath);
    this.excludedFiles.add(filePath);

    Logger.info(`Excluded file from context: ${filePath}`);

    await this.saveToWorkspaceState();
    await this.notifyContextChanged();
  }

  isFileIncluded(filePath: string): boolean {
    return this.includedFiles.has(filePath);
  }

  isFileExcluded(filePath: string): boolean {
    return this.excludedFiles.has(filePath);
  }

  getCurrentContext(): ContextInfo {
    const tokenEstimate = this.getTokenEstimate();
    const optimizations = this.getOptimizationSuggestions();

    return {
      includedFiles: Array.from(this.includedFiles),
      excludedFiles: Array.from(this.excludedFiles),
      tokenEstimate,
      optimizations,
    };
  }

  getTokenEstimate(): number {
    let totalChars = 0;

    for (const filePath of this.includedFiles) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        totalChars += content.length;
      } catch (error) {
        Logger.warn(`Failed to read file for token estimation: ${filePath}`, error);
      }
    }

    return Math.ceil(totalChars / this.CHARS_PER_TOKEN);
  }

  getOptimizationSuggestions(): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];
    const currentTokens = this.getTokenEstimate();

    if (currentTokens > this.MAX_TOKENS * 0.8) {
      // Suggest excluding large files
      const largeFiles = this.findLargeFiles();
      if (largeFiles.length > 0) {
        suggestions.push({
          type: 'exclude_pattern',
          description: `Exclude ${largeFiles.length} large files to reduce token usage`,
          estimatedSavings: this.estimateTokenSavings(largeFiles),
          autoApplicable: true,
          files: largeFiles,
        });
      }

      // Suggest excluding test files
      const testFiles = this.findTestFiles();
      if (testFiles.length > 0) {
        suggestions.push({
          type: 'exclude_pattern',
          description: `Exclude ${testFiles.length} test files`,
          estimatedSavings: this.estimateTokenSavings(testFiles),
          autoApplicable: true,
          files: testFiles,
        });
      }

      // Suggest excluding build artifacts
      const buildFiles = this.findBuildFiles();
      if (buildFiles.length > 0) {
        suggestions.push({
          type: 'exclude_pattern',
          description: `Exclude ${buildFiles.length} build/generated files`,
          estimatedSavings: this.estimateTokenSavings(buildFiles),
          autoApplicable: true,
          files: buildFiles,
        });
      }
    }

    return suggestions;
  }

  async applyOptimization(suggestion: OptimizationSuggestion): Promise<void> {
    if (suggestion.files) {
      for (const filePath of suggestion.files) {
        await this.excludeFile(vscode.Uri.file(filePath));
      }
    }

    Logger.info(`Applied optimization: ${suggestion.description}`);
  }

  async refreshContext(): Promise<void> {
    // Remove files that no longer exist
    const filesToRemove: string[] = [];

    for (const filePath of this.includedFiles) {
      try {
        await fs.promises.access(filePath, fs.constants.R_OK);
      } catch (error) {
        filesToRemove.push(filePath);
      }
    }

    for (const filePath of filesToRemove) {
      this.includedFiles.delete(filePath);
      Logger.info(`Removed non-existent file from context: ${filePath}`);
    }

    if (filesToRemove.length > 0) {
      await this.saveToWorkspaceState();
      await this.notifyContextChanged();
    }
  }

  async updateFileContent(filePath: string, content: string): Promise<void> {
    // This method is called when a file's content changes
    // For now, we just log it. In the future, we might want to
    // update token estimates or trigger re-analysis
    Logger.info(`File content updated: ${filePath}`);
  }

  async applyProjectTemplate(projectType: string): Promise<void> {
    const templates: Record<string, { include: string[]; exclude: string[] }> = {
      react: {
        include: ['src/**/*.{ts,tsx,js,jsx}', 'package.json', 'README.md'],
        exclude: ['node_modules/**', 'build/**', 'dist/**', '**/*.test.*', '**/*.spec.*'],
      },
      python: {
        include: ['**/*.py', 'requirements.txt', 'README.md', 'setup.py'],
        exclude: ['__pycache__/**', 'venv/**', '.venv/**', '**/*test*.py', '**/*spec*.py'],
      },
      node: {
        include: ['src/**/*.{ts,js}', 'package.json', 'README.md'],
        exclude: ['node_modules/**', 'dist/**', 'build/**', '**/*.test.*', '**/*.spec.*'],
      },
      java: {
        include: ['src/**/*.java', 'pom.xml', 'build.gradle', 'README.md'],
        exclude: ['target/**', 'build/**', '**/test/**', '**/*Test.java', '**/*Tests.java'],
      },
    };

    const template = templates[projectType];
    if (!template) {
      Logger.warn(`Unknown project template: ${projectType}`);
      return;
    }

    // Clear current context
    this.includedFiles.clear();
    this.excludedFiles.clear();

    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspaceRoot) {
      return;
    }

    // Apply include patterns
    for (const pattern of template.include) {
      const files = await vscode.workspace.findFiles(pattern);
      for (const file of files) {
        this.includedFiles.add(file.fsPath);
      }
    }

    // Apply exclude patterns
    for (const pattern of template.exclude) {
      const files = await vscode.workspace.findFiles(pattern);
      for (const file of files) {
        this.excludedFiles.add(file.fsPath);
        this.includedFiles.delete(file.fsPath); // Remove from included if it was there
      }
    }

    Logger.info(
      `Applied ${projectType} project template: ${this.includedFiles.size} files included`
    );

    await this.saveToWorkspaceState();
    await this.notifyContextChanged();
  }

  private setupAutoInclude(): void {
    const config = vscode.workspace.getConfiguration('ptah');
    const autoInclude = config.get<boolean>('autoIncludeOpenFiles', true);

    if (autoInclude) {
      // Include currently open files
      this.disposables.push(
        vscode.window.onDidChangeActiveTextEditor(async (editor) => {
          if (editor) {
            await this.includeFile(editor.document.uri);
          }
        })
      );

      // Include files when they are opened
      this.disposables.push(
        vscode.workspace.onDidOpenTextDocument(async (document) => {
          if (document.uri.scheme === 'file') {
            await this.includeFile(document.uri);
          }
        })
      );
    }
  }

  private findLargeFiles(): string[] {
    const largeFiles: string[] = [];
    const threshold = 50000; // 50KB threshold

    for (const filePath of this.includedFiles) {
      try {
        const stats = fs.statSync(filePath);
        if (stats.size > threshold) {
          largeFiles.push(filePath);
        }
      } catch (error) {
        // Ignore errors for files that can't be read
      }
    }

    return largeFiles;
  }

  private findTestFiles(): string[] {
    const testFiles: string[] = [];
    const testPatterns = [/\.test\./i, /\.spec\./i, /\/test\//i, /\/tests\//i, /__tests__/i];

    for (const filePath of this.includedFiles) {
      if (testPatterns.some((pattern) => pattern.test(filePath))) {
        testFiles.push(filePath);
      }
    }

    return testFiles;
  }

  private findBuildFiles(): string[] {
    const buildFiles: string[] = [];
    const buildPatterns = [
      /\/dist\//i,
      /\/build\//i,
      /\/out\//i,
      /\/target\//i,
      /\.min\./i,
      /\.bundle\./i,
      /\.compiled\./i,
    ];

    for (const filePath of this.includedFiles) {
      if (buildPatterns.some((pattern) => pattern.test(filePath))) {
        buildFiles.push(filePath);
      }
    }

    return buildFiles;
  }

  private estimateTokenSavings(files: string[]): number {
    let totalChars = 0;

    for (const filePath of files) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        totalChars += content.length;
      } catch (error) {
        // Ignore errors
      }
    }

    return Math.ceil(totalChars / this.CHARS_PER_TOKEN);
  }

  private async loadFromWorkspaceState(): Promise<void> {
    try {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      if (!workspaceFolder) {
        return;
      }

      const state = vscode.workspace.getConfiguration('ptah', workspaceFolder.uri);
      const includedFiles = state.get<string[]>('context.includedFiles', []);
      const excludedFiles = state.get<string[]>('context.excludedFiles', []);

      this.includedFiles = new Set(includedFiles);
      this.excludedFiles = new Set(excludedFiles);

      Logger.info(
        `Loaded context state: ${includedFiles.length} included, ${excludedFiles.length} excluded`
      );
    } catch (error) {
      Logger.error('Failed to load context state', error);
    }
  }

  private async saveToWorkspaceState(): Promise<void> {
    try {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      if (!workspaceFolder) {
        return;
      }

      const config = vscode.workspace.getConfiguration('ptah', workspaceFolder.uri);
      await config.update(
        'context.includedFiles',
        Array.from(this.includedFiles),
        vscode.ConfigurationTarget.Workspace
      );
      await config.update(
        'context.excludedFiles',
        Array.from(this.excludedFiles),
        vscode.ConfigurationTarget.Workspace
      );

      Logger.info('Saved context state to workspace settings');
    } catch (error) {
      Logger.error('Failed to save context state', error);
    }
  }

  private async notifyContextChanged(): Promise<void> {
    // This would trigger UI updates in providers
    // For now, we'll just update the context for when we set the context value
    await vscode.commands.executeCommand(
      'setContext',
      'ptah.contextFilesCount',
      this.includedFiles.size
    );
  }

  dispose(): void {
    Logger.info('Disposing Context Manager...');
    this.disposables.forEach((d) => d.dispose());
    this.disposables = [];
  }
}
