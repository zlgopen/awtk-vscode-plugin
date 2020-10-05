"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UIPreviewPanel = exports.isAwtkUiFile = exports.getAppRoot = exports.basename = void 0;
const vscode = require("vscode");
function basename(path) {
    return path.substring(path.lastIndexOf('/') + 1);
}
exports.basename = basename;
function getAppRoot(fspath) {
    let appRoot = fspath.substring(0, fspath.lastIndexOf("/design"));
    if (appRoot.indexOf(':/') > 0 && appRoot[0] == '/') {
        appRoot = appRoot.substring(1);
    }
    return appRoot + "/res";
}
exports.getAppRoot = getAppRoot;
function isAwtkUiFile(editor) {
    if (!editor) {
        vscode.window.showErrorMessage("Please open an AWTK UI XML file first.");
        return false;
    }
    let uri = editor.document.uri;
    let filename = uri.path;
    if (filename.indexOf('/ui/') > 0 && filename.endsWith('.xml')) {
        return true;
    }
    else {
        vscode.window.showErrorMessage("May be it is not an AWTK UI XML file.");
        return false;
    }
}
exports.isAwtkUiFile = isAwtkUiFile;
class UIPreviewPanel {
    constructor(panel, extensionUri) {
        this._disposables = [];
        this.uri = '';
        this._panel = panel;
        this._extensionUri = extensionUri;
        this._update();
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    }
    static createOrShow(extensionUri) {
        const column = vscode.ViewColumn.Two;
        if (UIPreviewPanel.currentPanel) {
            UIPreviewPanel.currentPanel._panel.reveal(column);
            UIPreviewPanel.currentPanel.update();
            return;
        }
        else {
            const panel = vscode.window.createWebviewPanel(UIPreviewPanel.viewType, 'AWTK UI Previewer', column, {
                enableScripts: true,
            });
            UIPreviewPanel.currentPanel = new UIPreviewPanel(panel, extensionUri);
        }
    }
    dispose() {
        UIPreviewPanel.currentPanel = undefined;
        // Clean up our resources
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }
    updateAppRoot(app_root) {
        this._panel.webview.postMessage({ type: 'updateAppRoot', app_root: app_root });
    }
    updateSource(source) {
        this._panel.webview.postMessage({ type: 'updateSource', source: source });
    }
    update() {
        this._update();
    }
    _update() {
        const webview = this._panel.webview;
        let editor = vscode.window.activeTextEditor;
        if (editor != null && isAwtkUiFile(vscode.window.activeTextEditor)) {
            let uri = editor.document.uri;
            let appRoot = getAppRoot(uri.path);
            this.uri = uri.toString();
            vscode.workspace.openTextDocument(uri).then(doc => {
                let sourceCode = doc.getText();
                switch (this._panel.viewColumn) {
                    case vscode.ViewColumn.One:
                    default:
                        this._panel.title = 'Preview ' + basename(uri.path);
                        this._panel.webview.html = this._getHtmlForWebview(webview, sourceCode, appRoot);
                }
            });
        }
    }
    _getHtmlForWebview(webview, source, appRoot) {
        const scriptPathOnDisk = vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js');
        const scriptUri = webview.asWebviewUri(scriptPathOnDisk);
        const escapeSource = escape(source);
        const nonce = getNonce();
        return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>UI Preview</title>
			  <script nonce="${nonce}" src="${scriptUri}"></script>
			</head>
			<body>
			<image id="screenshot"/>
			<table style="width: 100%;">
				<tr><td>Width:</td><td><input type="text" id="width" value="320"></td></tr>
				<tr><td>Height:</td><td><input type="text" id="height" value="480"></td></tr>
				<tr><td>Language:</td><td><input type="text" id="language" value="en"></td></tr>
				<tr><td>Country:</td><td><input type="text" id="country" value="US"></td></tr>
				<tr><td>Theme:</td><td><input type="text" id="theme" value="default"></td></tr
				<tr><td>App Root:</td><td><input type="text" id="app_root" value="${appRoot}"></td></tr>
			</table>
      <input id="source" type="hidden" value="${escape(source)}" >
      <input id="apply" type="submit" value="Apply">
			</body>
			</html>`;
    }
}
exports.UIPreviewPanel = UIPreviewPanel;
UIPreviewPanel.viewType = 'uiPreivew';
function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
//# sourceMappingURL=preview.js.map