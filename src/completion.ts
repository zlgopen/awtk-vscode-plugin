import * as vscode from 'vscode';
import * as awtkUI from './awtk_ui.json'
import * as awtkStyle from './awtk_style.json'

function getWidgetInfo(name: string | null) {
  return awtkUI.widgets.find((iter) => {
    return iter.name === name;
  })
}

function getPropInfo(widgetInfo: any, name: string | null) {
  let propInfo = widgetInfo.props.find((iter: any) => {
    return iter.name === name;
  })

  if (!propInfo) {
    widgetInfo = getWidgetInfo('widget');
    propInfo = widgetInfo.props.find((iter: any) => {
      return iter.name === name;
    })
  }

  return propInfo;
}

function isAwtkStyleFile(doc: vscode.TextDocument) {
  const filename = doc.uri.path;

  return filename.indexOf('/styles/') > 0 && filename.endsWith('.xml');
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
const STAT_END = 8;

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
        if (c === '/') {
          state = STAT_END;
        } else if (isStartID(c)) {
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
      case STAT_END: {
        result.isEndTag = true;
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

function completionsFromArray(arr: Array<any>): Array<vscode.CompletionItem> {
  return arr.map((iter: any) => {
    let item = new vscode.CompletionItem(iter.name, vscode.CompletionItemKind.Keyword);
    item.detail = iter.desc;
    item.documentation = iter.desc;;
    return item;
  })
}


export const widgetTagsCompletionProvider = {
  provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
    let result: vscode.CompletionItem[] = [];

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

export const widgetPropsCompletionProvider = {
  provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
    let result: vscode.CompletionItem[] = [];

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
        } else {
          break;
        }
      }
    } else if (isAwtkStyleFile(document)) {
      result = result.concat(completionsFromArray(awtkStyle.styleIDs));
    }

    result = result.filter(iter => {
      let found = tagInfo.props[iter.label];

      return !found;
    });

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
          /*TODO*/
        }
      }
    }

    return result;
  }
};
