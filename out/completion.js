"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.widgetPropValuesCompletionProvider = exports.widgetPropsCompletionProvider = exports.widgetTagsCompletionProvider = void 0;
const vscode = require("vscode");
const awtkUI = require("./awtk_ui.json");
const awtkStyle = require("./awtk_style.json");
function getWidgetInfo(name) {
    return awtkUI.widgets.find((iter) => {
        return iter.name === name;
    });
}
function getPropInfo(widgetInfo, name) {
    let propInfo = widgetInfo.props.find((iter) => {
        return iter.name === name;
    });
    if (!propInfo) {
        widgetInfo = getWidgetInfo('widget');
        propInfo = widgetInfo.props.find((iter) => {
            return iter.name === name;
        });
    }
    return propInfo;
}
function isAwtkStyleFile(doc) {
    const filename = doc.uri.path;
    return filename.indexOf('/styles/') > 0 && filename.endsWith('.xml');
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
const STAT_END = 8;
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
                if (c === '/') {
                    state = STAT_END;
                }
                else if (isStartID(c)) {
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
            case STAT_END: {
                result.isEndTag = true;
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
function completionsFromArray(arr) {
    return arr.map((iter) => {
        let item = new vscode.CompletionItem(iter.name, vscode.CompletionItemKind.Keyword);
        item.detail = iter.desc;
        item.documentation = iter.desc;
        ;
        return item;
    });
}
exports.widgetTagsCompletionProvider = {
    provideCompletionItems(document, position) {
        let result = [];
        if (!isAwtkUiFile(document) && !isAwtkStyleFile(document)) {
            return result;
        }
        const tagInfo = getTagInfo(document, position);
        if (tagInfo.state === STAT_IN_PRE_TAG_NAME) {
            result = result.concat(completionsFromArray(awtkUI.widgets));
            if (isAwtkStyleFile(document)) {
                result = result.concat(completionsFromArray(awtkStyle.widgetStates));
            }
        }
        return result;
    }
};
exports.widgetPropsCompletionProvider = {
    provideCompletionItems(document, position) {
        let result = [];
        if (!isAwtkUiFile(document) && !isAwtkStyleFile(document)) {
            return result;
        }
        const tagInfo = getTagInfo(document, position);
        if (isAwtkUiFile(document)) {
            if (tagInfo.state !== STAT_IN_PRE_PROP_NAME) {
                return result;
            }
            let widgetInfo = getWidgetInfo(tagInfo.name);
            while (widgetInfo) {
                result = result.concat(completionsFromArray(widgetInfo.props));
                if (widgetInfo.parent) {
                    widgetInfo = getWidgetInfo(widgetInfo.parent);
                }
                else {
                    break;
                }
            }
        }
        else if (isAwtkStyleFile(document)) {
            result = result.concat(completionsFromArray(awtkStyle.styleIDs));
        }
        result = result.filter(iter => {
            let found = tagInfo.props[iter.label];
            return !found;
        });
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
                    /*TODO*/
                }
            }
        }
        return result;
    }
};
//# sourceMappingURL=completion.js.map