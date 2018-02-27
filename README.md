# Vue Designer

Vue component design tool.

## Development

Vue designer is separated by two modules - server and client.

The server is executed by the editor process and responsible with parsing/analyzing component code and handling client requests. The client is for rendering compnent preview and handling the users' interaction. The server and client communicate by WebSocket to synchronize component data.

The server code is written in TypeScript and compiled to CommonJS format while the client code is in TypeScript too but bundled by webpack.

The codes only for client should be in `src/view`.

All codes should be formatted by [Prettier](https://prettier.io/).

For typings of external packages that does not exist should be in `types/(package name)`.

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
