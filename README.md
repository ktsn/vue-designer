# Vue Designer

Vue component design tool.

## Usage

Open the command pallete and select `Open Vue Designer`. Then you can see a preview pane of currently opened single file component (`.vue`).

This extension is still work in progress. If you have some feedbacks for this extension, it would be really helpful!

## Development

Vue designer is separated by two modules - server and client.

The server is executed by the editor process and responsible with parsing/analyzing component code and handling client requests. The client is for rendering compnent preview and handling the users' interaction. The server and client communicate by WebSocket to synchronize component data.

The server code is written in TypeScript and compiled to CommonJS format while the client code is in TypeScript too but bundled by webpack.

The codes only for client should be in `src/view`.

All codes should be formatted by [Prettier](https://prettier.io/).

For typings of external packages that does not exist should be in `types/(package name)`.

### Visual Studio Code Extension

To debug on VSCode, follow the below steps:

1. Run `npm run watch` to start dev server.
2. Open VSCode and show debug pane on the left side of the editor.
3. Run `Launch Extension` so that it opens a new window with enabling local Vue Designer.
4. Select `Open Vue Designer` on command pallete.

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
$ npm run build

# build and watch sources
$ npm run watch

# run test
$ npm run test

# run test with watching
$ npm run test:watch

# run test with coverage report
$ npm run test:coverage

# format sources with prettier
$ npm run format
```
