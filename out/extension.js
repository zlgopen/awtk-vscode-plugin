"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = void 0;
const vscode = require("vscode");
const preview_1 = require("./preview");
const completion_1 = require("./completion");
function activate(context) {
    context.subscriptions.push(vscode.languages.registerCompletionItemProvider('plaintext', completion_1.awtkCompletionProvider, '<'));
    context.subscriptions.push(vscode.languages.registerCompletionItemProvider('plaintext', completion_1.awtkCompletionProvider, '='));
    context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(e => {
        let uri = e.document.uri.toString();
        if (preview_1.UIPreviewPanel.currentPanel) {
            const doc = e.document;
            let source = doc.getText();
            if (preview_1.UIPreviewPanel.currentPanel.uri == uri) {
                preview_1.UIPreviewPanel.currentPanel.updateSource(source);
            }
        }
    }));
    context.subscriptions.push(vscode.commands.registerCommand('awtk.preview', () => {
        if (preview_1.isAwtkUiFile(vscode.window.activeTextEditor)) {
            preview_1.UIPreviewPanel.createOrShow(context.extensionUri);
        }
    }));
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map