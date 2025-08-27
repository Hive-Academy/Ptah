import * as vscode from 'vscode';
import * as path from 'path';
import { BaseWebviewMessageHandler } from './base-message-handler';
import { CommandBuilderService } from '../command-builder.service';

/**
 * CommandMessageHandler - Single Responsibility: Handle command builder related messages
 */
export class CommandMessageHandler extends BaseWebviewMessageHandler {
  readonly messageType = 'commands:';

  constructor(
    postMessage: (message: any) => void,
    private commandBuilderService: CommandBuilderService
  ) {
    super(postMessage);
  }

  async handle(messageType: string, payload: any): Promise<any> {
    const action = messageType.replace(this.messageType, '');
    
    switch (action) {
      case 'getTemplates':
        return await this.handleGetTemplates();
      case 'executeCommand':
        return await this.handleExecuteCommand(payload);
      case 'selectFile':
        return await this.handleSelectFile(payload);
      case 'saveTemplate':
        return await this.handleSaveTemplate(payload);
      default:
        throw new Error(`Unknown command action: ${action}`);
    }
  }

  private async handleGetTemplates(): Promise<void> {
    try {
      const templates = await this.commandBuilderService.getTemplates();
      this.sendSuccessResponse('commands:templates', { templates });
    } catch (error) {
      this.sendErrorResponse('commands:getTemplates', error instanceof Error ? error.message : 'Failed to get templates');
    }
  }

  private async handleExecuteCommand(data: any): Promise<void> {
    try {
      // Track usage for analytics
      await this.commandBuilderService.trackCommandUsage(data.templateId);
      
      const template = await this.commandBuilderService.getTemplate(data.templateId);
      if (!template) {
        throw new Error(`Template ${data.templateId} not found`);
      }

      // Build the command string by replacing template variables
      let command = template.template;
      for (const [key, value] of Object.entries(data.parameters)) {
        command = command.replace(`{{${key}}}`, String(value));
      }
      
      const result = {
        success: true,
        command,
        template,
        parameters: data.parameters,
        timestamp: new Date()
      };
      
      this.sendSuccessResponse('commands:executeResult', { result });
    } catch (error) {
      this.sendErrorResponse('commands:executeCommand', error instanceof Error ? error.message : 'Execution failed');
    }
  }

  private async handleSelectFile(data: { multiple?: boolean }): Promise<void> {
    try {
      const options: vscode.OpenDialogOptions = {
        canSelectMany: data.multiple || false,
        canSelectFiles: true,
        canSelectFolders: false,
        openLabel: 'Select File(s)'
      };

      const result = await vscode.window.showOpenDialog(options);
      if (result) {
        const files = result.map(uri => ({
          path: uri.fsPath,
          name: path.basename(uri.fsPath)
        }));
        
        this.sendSuccessResponse('commands:fileSelected', { files });
      }
    } catch (error) {
      this.sendErrorResponse('commands:selectFile', error instanceof Error ? error.message : 'Failed to select file');
    }
  }

  private async handleSaveTemplate(data: any): Promise<void> {
    try {
      await this.commandBuilderService.addCustomTemplate(data.template);
      this.sendSuccessResponse('commands:templateSaved', { success: true });
    } catch (error) {
      this.sendErrorResponse('commands:saveTemplate', error instanceof Error ? error.message : 'Failed to save template');
    }
  }
}
