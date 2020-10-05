import * as vscode from 'vscode';

export const awtkCompletionProvider = {
	provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {

		// get all text until the `position` and check if it reads `console.`
		// and if so then complete if `log`, `warn`, and `error`
		const linePrefix = document.lineAt(position).text.substr(0, position.character);

		return [
			new vscode.CompletionItem('button', vscode.CompletionItemKind.Keyword),
			new vscode.CompletionItem('label', vscode.CompletionItemKind.Keyword),
			new vscode.CompletionItem('image', vscode.CompletionItemKind.Keyword),
			new vscode.CompletionItem('slider', vscode.CompletionItemKind.Keyword),
		];
	}
};
