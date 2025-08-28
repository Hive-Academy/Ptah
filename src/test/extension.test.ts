import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Test Suite', () => {
  vscode.window.showInformationMessage('Start all tests.');

  test('Extension should be present', () => {
    assert.ok(vscode.extensions.getExtension('ptah-extensions.ptah-claude-code'));
  });

  test('Should activate extension', async () => {
    const extension = vscode.extensions.getExtension('ptah-extensions.ptah-claude-code')!;
    await extension.activate();
    assert.strictEqual(extension.isActive, true);
  });

  test('Should register commands', async () => {
    const commands = await vscode.commands.getCommands();

    const ptahCommands = [
      'ptah.quickChat',
      'ptah.reviewCurrentFile',
      'ptah.generateTests',
      'ptah.buildCommand',
      'ptah.newSession',
    ];

    for (const command of ptahCommands) {
      assert.ok(commands.includes(command), `Command ${command} should be registered`);
    }
  });
});
