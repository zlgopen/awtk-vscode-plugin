"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.widgetPropValuesCompletionProvider = exports.widgetPropsCompletionProvider = exports.widgetTagsCompletionProvider = void 0;
const vscode = require("vscode");
const awtk = require("./awtk.json");
function getWidgetInfo(name) {
    return awtk.widgets.find((iter) => {
        return iter.name === name;
    });
}
function getPropInfo(widgetInfo, name) {
    return widgetInfo.props.find((iter) => {
        return iter.name === name;
    });
}
function isAwtkUiFile(doc) {
    const filename = doc.uri.path;
    return filename.indexOf('/ui/') > 0 && filename.endsWith('.xml');
}
function getTagText(doc, position) {
    let offset = doc.offsetAt(position);
    let start = offset;
    let text = doc.getText();
    while (start >= 0) {
        if (text[start] == '<') {
            break;
        }
        start--;
    }
    const tagText = text.substr(start, offset - start);
    return tagText[0] == '<' ? tagText : null;
}
function isAlpha(ch) {
    return /^[A-Z]$/i.test(ch);
}
function isStartID(ch) {
    return isAlpha(ch) || ch === '_';
}
const STAT_START = 1;
const STAT_IN_TAG_NAME = 2;
const STAT_IN_PRE_TAG_NAME = 3;
const STAT_IN_PRE_PROP_NAME = 4;
const STAT_IN_PROP_NAME = 5;
const STAT_IN_PRE_PROP_VALUE = 6;
const STAT_IN_PROP_VALUE = 7;
function parseTag(tagText) {
    let result = {
        name: '',
        state: STAT_START,
        props: [],
    };
    if (tagText == null) {
        return null;
    }
    if (tagText == '<') {
        result.state = STAT_IN_PRE_TAG_NAME;
        return result;
    }
    let propName = '';
    let propValue = '';
    let state = STAT_START;
    let quota = '"';
    for (let i = 0; i < tagText.length; i++) {
        let c = tagText[i];
        if (c == '>') {
            break;
        }
        switch (state) {
            case STAT_START: {
                if (c === '<') {
                    state = STAT_IN_PRE_TAG_NAME;
                }
                break;
            }
            case STAT_IN_PRE_TAG_NAME: {
                if (isStartID(c)) {
                    state = STAT_IN_TAG_NAME;
                    result.name = c;
                }
                break;
            }
            case STAT_IN_TAG_NAME: {
                if (c === ' ') {
                    state = STAT_IN_PRE_PROP_NAME;
                    break;
                }
                else {
                    result.name += c;
                }
                break;
            }
            case STAT_IN_PRE_PROP_NAME: {
                if (isStartID(c)) {
                    state = STAT_IN_PROP_NAME;
                    propName = c;
                }
                break;
            }
            case STAT_IN_PROP_NAME: {
                if (c === '=') {
                    state = STAT_IN_PRE_PROP_VALUE;
                    result.lastPropName = propName;
                }
                else {
                    propName += c;
                }
                break;
            }
            case STAT_IN_PRE_PROP_VALUE: {
                if (c === "'" || c === '"') {
                    quota = c;
                    state = STAT_IN_PROP_VALUE;
                }
                break;
            }
            case STAT_IN_PROP_VALUE: {
                if (c === quota) {
                    state = STAT_IN_PRE_PROP_NAME;
                    result.props[propName] = propValue;
                    propName = '';
                    propValue = '';
                }
                else {
                    propValue += c;
                }
                break;
            }
        }
    }
    result.state = state;
    return result;
}
function getTagInfo(doc, position) {
    return parseTag(getTagText(doc, position));
}
exports.widgetTagsCompletionProvider = {
    provideCompletionItems(document, position) {
        let result = [];
        if (!isAwtkUiFile(document)) {
            return result;
        }
        const tagInfo = getTagInfo(document, position);
        if (tagInfo.state === STAT_IN_PRE_TAG_NAME || tagInfo.lastPropName) {
            result = awtk.widgets.map((iter) => {
                let item = new vscode.CompletionItem(iter.name, vscode.CompletionItemKind.Keyword);
                item.detail = iter.desc;
                item.documentation = iter.desc;
                ;
                return item;
            });
        }
        return result;
    }
};
exports.widgetPropsCompletionProvider = {
    provideCompletionItems(document, position) {
        let result = [];
        if (!isAwtkUiFile(document)) {
            return result;
        }
        const tagInfo = getTagInfo(document, position);
        let widgetInfo = getWidgetInfo('widget');
        if (tagInfo.state !== STAT_IN_PRE_PROP_NAME) {
            return result;
        }
        if (widgetInfo) {
            widgetInfo.props.forEach((iter) => {
                let item = new vscode.CompletionItem(iter.name, vscode.CompletionItemKind.Keyword);
                item.detail = iter.desc;
                item.documentation = iter.desc;
                result.push(item);
            });
        }
        widgetInfo = getWidgetInfo(tagInfo.name);
        if (widgetInfo) {
            widgetInfo.props.forEach((iter) => {
                let item = new vscode.CompletionItem(iter.name, vscode.CompletionItemKind.Keyword);
                item.detail = iter.desc;
                item.documentation = iter.desc;
                result.push(item);
            });
        }
        return result;
    }
};
exports.widgetPropValuesCompletionProvider = {
    provideCompletionItems(document, position) {
        let result = [];
        if (!isAwtkUiFile(document)) {
            return result;
        }
        const tagInfo = getTagInfo(document, position);
        if (tagInfo.state === STAT_IN_PROP_VALUE) {
            const widgetInfo = getWidgetInfo(tagInfo.name);
            if (widgetInfo) {
                const propInfo = getPropInfo(widgetInfo, tagInfo.lastPropName);
                if (propInfo) {
                    if (propInfo.type === 'bool_t') {
                        result = ["true", "false"].map((iter) => {
                            return new vscode.CompletionItem(iter, vscode.CompletionItemKind.Keyword);
                        });
                    }
                }
            }
        }
        return result;
    }
};
//# sourceMappingURL=completion.js.map