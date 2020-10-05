import * as vscode from 'vscode';
import * as awtk from './awtk.json'

function getWidgetInfo(name: string | null) {
  return awtk.widgets.find((iter) => {
    return iter.name === name;
  })
}

function getPropInfo(widgetInfo: any, name: string | null) {
  return widgetInfo.props.find((iter: any) => {
    return iter.name === name;
  })
}

function isAwtkUiFile(doc: vscode.TextDocument) {
  const filename = doc.uri.path;

  return filename.indexOf('/ui/') > 0 && filename.endsWith('.xml');
}

function getTagText(doc: vscode.TextDocument, position: vscode.Position) {
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

function isAlpha(ch: string) {
  return /^[A-Z]$/i.test(ch);
}

function isStartID(ch: string) {
  return isAlpha(ch) || ch === '_';
}

const STAT_START = 1;
const STAT_IN_TAG_NAME = 2;
const STAT_IN_PRE_TAG_NAME = 3;
const STAT_IN_PRE_PROP_NAME = 4;
const STAT_IN_PROP_NAME = 5;
const STAT_IN_PRE_PROP_VALUE = 6;
const STAT_IN_PROP_VALUE = 7;

function parseTag(tagText: string | null): any {
  let result: any = {
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
        } else {
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
        } else {
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
        } else {
          propValue += c;
        }
        break;
      }
    }
  }

  result.state = state;

  return result;
}

function getTagInfo(doc: vscode.TextDocument, position: vscode.Position) {
  return parseTag(getTagText(doc, position));
}

export const widgetTagsCompletionProvider = {
  provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
    let result: vscode.CompletionItem[] = [];

    if (!isAwtkUiFile(document)) {
      return result;
    }

    const tagInfo = getTagInfo(document, position);
    if (tagInfo.state === STAT_IN_PRE_TAG_NAME || tagInfo.lastPropName) {
      result = awtk.widgets.map((iter: any) => {
        let item = new vscode.CompletionItem(iter.name, vscode.CompletionItemKind.Keyword);
        item.detail = iter.desc;
        item.documentation = iter.desc;;
        return item;
      });
    }

    return result;
  }
};

export const widgetPropsCompletionProvider = {
  provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
    let result: vscode.CompletionItem[] = [];

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

export const widgetPropValuesCompletionProvider = {
  provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
    let result: vscode.CompletionItem[] = [];

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
