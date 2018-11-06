# Vue Designer

Vue component design tool.

## Usage

Open the command pallete and select `Open Vue Designer`. Then you can see a preview pane of currently opened single file component (`.vue`).

This extension is still work in progress. If you have some feedbacks for this extension, it would be really helpful!

## Settings

### `vueDesigner.sharedStyles`

An array of CSS paths which will be loaded in the preview. It is useful when your application has global CSS such as reset CSS.

```json
{
  "vueDesigner.sharedStyles": ["reset.css"]
}
```

Note that it does not support `@import` in the loaded CSS yet. You need to specify all depending CSS files.

## Supported Preprocessors

Vue Designer currently does not actively support preprocessors on `<template>`, `<script>` and `<style>` blocks. Languages not included in the following list may not work on Vue Designer.

- HTML (`<template>`)
- JavaScript (`<script>`)
- TypeScript (`<script lang="ts">`)
- CSS (`<style>`)

## Development

Vue designer is separated by two modules - server and client.

The server is executed by the editor process and responsible with parsing/analyzing component code and handling client requests. The client is for rendering compnent preview and handling the users' interaction. The server and client communicate by WebSocket to synchronize component data.

The server code is written in TypeScript and compiled to CommonJS format while the client code is in TypeScript too but bundled by webpack.

The codes only for client should be in `src/view`.

All codes should be formatted by [Prettier](https://prettier.io/).

For typings of external packages that does not exist should be in `types/(package name)`.

### Visual Studio Code Extension

To debug on VSCode, follow the below steps:

1.  Run `yarn watch` to start dev server.
2.  Open VSCode and show debug pane on the left side of the editor.
3.  Run `Launch Extension` so that it opens a new window with enabling local Vue Designer.
4.  Select `Open Vue Designer` on command pallete.

If you want to use dev tools for client code, add the following configuration in your `keybindings.json`.

```js
{
  "key": "shift+cmd+i",
  "command": "workbench.action.webview.openDeveloperTools"
}
```

### Commands

```sh
# build sources
$ yarn build

# build and watch sources
$ yarn watch

# run test
$ yarn test

# run test with watching
$ yarn test:watch

# run test with coverage report
$ yarn test:coverage

# format sources with prettier
$ yarn lint:fix
```

### Release

```sh
$ npm version XXX # -> update version & generate changelog

# after edit changelog if needed
$ git add CHANGELOG.md
$ git commit -m "docs: changelog vXXX"

$ vsce publish
```
