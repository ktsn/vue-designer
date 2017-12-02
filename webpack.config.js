const path = require('path')
const webpack = require('webpack')

const base = path.resolve(__dirname)

module.exports = {
  context: path.join(base, 'src'),
  entry: './view/main.ts',
  output: {
    path: path.join(base, 'lib'),
    filename: 'vue-designer-view.js'
  },
  resolve: {
    extensions: ['.js', '.json', '.ts']
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: 'ts-loader',
        options: {
          appendTsSuffixTo: [/\.vue$/]
        }
      },
      {
        test: /\.vue$/,
        loader: 'vue-loader'
      }
    ]
  },
  plugins: [
    new webpack.optimize.ModuleConcatenationPlugin()
  ],
  devtool: 'source-map',
}
