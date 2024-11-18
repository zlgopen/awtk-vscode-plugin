# awtk vscode plugin

## 1. 介绍

### 1.1 AWTK XML UI 预览插件

![demo](demo.png)

AWTK XML UI 预览插件：在 vscode 中实时预览 AWTK XML UI 文件。主要特色：

* 真实的 UI 效果。
* 可以设置主题，方便查看在不同主题下界面的效果。
* 可以设置语言，方便查看在不同语言环境下界面的效果。
* 可以设置屏幕大小，方便查看在不同屏幕大小下界面的效果。

已知问题：

* 主题切换暂未实现。
* 暂不支持自定义控件。
* 不支持 include 指令。

### 1.2 自动补全插件

智能提示控件的名称、属性和属性的取值。主要特色：

* 输入'<'时自动提示控件的 tag 名。

 ![](docs/images/widget_completion.png)

* 输入空格时提示当前控件的属性名列表。

![](docs/images/prop_name_completion.png)

* 输入引号时提示当前控件当前属性的取值列表 (TODO)。
 
 ![](docs/images/prop_value_completion.png)

## 2. 编译插件

### 2.1 安装 vsce

```
npm install -g vsce
```

### 2.1 安装 typescript

```
npm install -g typescript
```

### 2.1 安装 types/vscode@1.47.0

在awtk-vscode-plugin目录下打开终端，执行以下命令：

```
npm install @types/vscode@1.47.0
```

### 2.2 编译

```
vsce package
```

> 生成文件 awtk-preview-completion-0.0.1.vsix，用 vscode 安装该文件即可。

![](docs/images/vscode_install_vsix.png)

## 3. 运行

### 3.1 运行服务

编译和运行 preview 服务，请参考 [awtk-previewer](https://github.com/zlgopen/awtk-previewer)

### 3.2 激活插件

* 通过 shift+ctrl+p 激活命令控制台

* 运行 `AWTK : Preview UI XML`

![](docs/images/activate_plugin.png)

### 3.2 调试运行

- Open this example in VS Code 1.47+
- `npm install`
- `npm run watch` or `npm run compile`
- `F5` to start debugging

In the new vscode instance:

* Press shortcut shift+ctrl+p to activable command console

* Run the `AWTK : Preview UI XML` to create the webview.

## 4. 常见问题

* [Windows 下如何查看 previewer 使用的 8000 端口是否被占用](https://github.com/zlgopen/awtk-vscode-plugin/wiki/Windows-%E4%B8%8B%E5%A6%82%E4%BD%95%E6%9F%A5%E7%9C%8B-previewer-%E4%BD%BF%E7%94%A8%E7%9A%84-8000-%E7%AB%AF%E5%8F%A3%E6%98%AF%E5%90%A6%E8%A2%AB%E5%8D%A0%E7%94%A8)

* [端口冲突如何处理](https://github.com/zlgopen/awtk-vscode-plugin/wiki/Previewer-%E7%9A%84%E7%AB%AF%E5%8F%A3%E5%86%B2%E7%AA%81%E5%A6%82%E4%BD%95%E5%A4%84%E7%90%86%EF%BC%9F)
