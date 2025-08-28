import * as vscode from 'vscode';
import { BaseWebviewMessageHandler } from './base-message-handler';
import { ContextManager } from '../context-manager';

/**
 * ContextMessageHandler - Single Responsibility: Handle context management messages
 */
export class ContextMessageHandler extends BaseWebviewMessageHandler {
  readonly messageType = 'context:';

  constructor(
    postMessage: (message: any) => void,
    private contextManager: ContextManager
  ) {
    super(postMessage);
  }

  async handle(messageType: string, payload: any): Promise<any> {
    const action = messageType.replace(this.messageType, '');
    
    switch (action) {
      case 'getFiles':
        return await this.handleGetContextFiles();
      case 'includeFile':
        return await this.handleIncludeFile(payload);
      case 'excludeFile':
        return await this.handleExcludeFile(payload);
      default:
        throw new Error(`Unknown context action: ${action}`);
    }
  }

  private async handleGetContextFiles(): Promise<void> {
    try {
      const context = this.contextManager.getCurrentContext();
      const workspaceFiles = await this.getWorkspaceFiles();
      
      this.postMessage({
        type: 'context:filesLoaded',
        data: { 
          files: workspaceFiles,
          context: context 
        }
      });
    } catch (error) {
      this.postMessage({
        type: 'context:error',
        data: { message: error instanceof Error ? error.message : 'Failed to get context files' }
      });
    }
  }

  private async handleIncludeFile(data: { filePath: string }): Promise<void> {
    try {
      await this.contextManager.includeFile(vscode.Uri.file(data.filePath));
      
      this.postMessage({
        type: 'context:fileIncluded',
        data: { filePath: data.filePath }
      });
    } catch (error) {
      this.postMessage({
        type: 'context:error',
        data: { message: error instanceof Error ? error.message : 'Failed to include file' }
      });
    }
  }

  private async handleExcludeFile(data: { filePath: string }): Promise<void> {
    try {
      await this.contextManager.excludeFile(vscode.Uri.file(data.filePath));
      
      this.postMessage({
        type: 'context:fileExcluded',
        data: { filePath: data.filePath }
      });
    } catch (error) {
      this.postMessage({
        type: 'context:error',
        data: { message: error instanceof Error ? error.message : 'Failed to exclude file' }
      });
    }
  }

  /**
   * Get all workspace files for the file tree
   */
  private async getWorkspaceFiles(): Promise<any[]> {
    try {
      const workspaceRoot = vscode.workspace.workspaceFolders?.[0];
      if (!workspaceRoot) {
        return [];
      }

      // Get all files in workspace (excluding common ignore patterns)
      const filePattern = new vscode.RelativePattern(workspaceRoot, '**/*');
      const excludePattern = '{**/node_modules/**,**/.git/**,**/dist/**,**/build/**,**/.vscode/**}';
      
      const files = await vscode.workspace.findFiles(filePattern, excludePattern, 10000);
      
      const fileList = await Promise.all(files.map(async (uri) => {
        try {
          const relativePath = vscode.workspace.asRelativePath(uri);
          const stat = await vscode.workspace.fs.stat(uri);
          
          // Estimate tokens (rough approximation: 1 token per 4 characters)
          let tokenEstimate = 0;
          if (stat.type === vscode.FileType.File) {
            try {
              const content = await vscode.workspace.fs.readFile(uri);
              tokenEstimate = Math.ceil(content.length / 4);
            } catch {
              // If we can't read the file, estimate based on size
              tokenEstimate = Math.ceil(stat.size / 4);
            }
          }

          return {
            path: relativePath,
            name: uri.path.split('/').pop() || 'unknown',
            type: stat.type === vscode.FileType.File ? 'file' : 'directory',
            size: stat.size,
            tokenEstimate: stat.type === vscode.FileType.File ? tokenEstimate : undefined
          };
        } catch (error) {
          // If we can't get file info, return basic info
          const relativePath = vscode.workspace.asRelativePath(uri);
          return {
            path: relativePath,
            name: uri.path.split('/').pop() || 'unknown',
            type: 'file',
            size: 0,
            tokenEstimate: 0
          };
        }
      }));

      // Sort files by path for consistent tree building
      return fileList.sort((a, b) => a.path.localeCompare(b.path));
      
    } catch (error) {
      console.error('Error getting workspace files:', error);
      return [];
    }
  }
}
