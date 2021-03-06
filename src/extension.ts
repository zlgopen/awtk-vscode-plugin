import * as vscode from 'vscode';
import { UIPreviewPanel, isAwtkUiFile } from './preview'
import { widgetTagsCompletionProvider, widgetPropsCompletionProvider, widgetPropValuesCompletionProvider } from './completion';

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(vscode.languages.registerCompletionItemProvider('xml', widgetTagsCompletionProvider, '<'));
	context.subscriptions.push(vscode.languages.registerCompletionItemProvider('xml', widgetPropsCompletionProvider, ' '));
	context.subscriptions.push(vscode.languages.registerCompletionItemProvider('xml', widgetPropValuesCompletionProvider, '"'));
	context.subscriptions.push(vscode.languages.registerCompletionItemProvider('xml', widgetPropValuesCompletionProvider, "'"));

	context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(e => {
		let uri = e.document.uri.toString();
		if (UIPreviewPanel.currentPanel) {
			const doc = e.document;
			let source = doc.getText();

			if (UIPreviewPanel.currentPanel.uri == uri) {
				UIPreviewPanel.currentPanel.updateSource(source);
			}
		}
	})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('awtk.preview', () => {
			if (isAwtkUiFile(vscode.window.activeTextEditor)) {
				UIPreviewPanel.createOrShow(context.extensionUri);
			}
		})
	);
}
