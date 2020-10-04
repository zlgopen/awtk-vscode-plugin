import * as vscode from 'vscode';

function basename(path: string) {
	return path.substring(path.lastIndexOf('/') + 1);
}

function getAppRoot(fspath: string) {
	let appRoot = fspath.substring(0, fspath.lastIndexOf("/design"));

	if (appRoot.indexOf(':/') > 0 && appRoot[0] == '/') {
		appRoot = appRoot.substring(1);
	}

	return appRoot + "/res";
}

function isAwtkUiFile(editor: vscode.TextEditor | undefined) {
	if (!editor) {
		vscode.window.showErrorMessage("Please open an AWTK UI XML file first.");
		return false;
	}

	let uri = editor.document.uri;
	let filename = uri.path;

	if (filename.indexOf('/ui/') > 0 && filename.endsWith('.xml')) {
		return true;
	} else {
		vscode.window.showErrorMessage("May be it is not an AWTK UI XML file.");
		return false;
	}
}

export function activate(context: vscode.ExtensionContext) {
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

class UIPreviewPanel {
	public static currentPanel: UIPreviewPanel | undefined;
	public static readonly viewType = 'uiPreivew';

	public uri: string;
	private readonly _panel: vscode.WebviewPanel;
	private readonly _extensionUri: vscode.Uri;
	private _disposables: vscode.Disposable[] = [];

	public static createOrShow(extensionUri: vscode.Uri) {
		const column = vscode.ViewColumn.Two;

		if (UIPreviewPanel.currentPanel) {
			UIPreviewPanel.currentPanel._panel.reveal(column);
			UIPreviewPanel.currentPanel.update();
			return;
		}

		// Otherwise, create a new panel.
		const panel = vscode.window.createWebviewPanel(
			UIPreviewPanel.viewType, 'AWTK UI Previewer',column,
			{
				enableScripts: true,
			}
		);

		UIPreviewPanel.currentPanel = new UIPreviewPanel(panel, extensionUri);
	}

	private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
		this.uri = '';
		this._panel = panel;
		this._extensionUri = extensionUri;

		this._update();
		this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
	}

	public dispose() {
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

	public updateAppRoot(app_root: string) {
		this._panel.webview.postMessage({ type: 'updateAppRoot', app_root: app_root });
	}

	public updateSource(source: string) {
		this._panel.webview.postMessage({ type: 'updateSource', source: source });
	}

	public update(): void {
		this._update();
	}

	private _update() {
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

	private _getHtmlForWebview(webview: vscode.Webview, source: string, appRoot: string) {
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

function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}
