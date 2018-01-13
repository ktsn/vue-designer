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
    alias: {
      '@': path.join(base, 'src'),
      vue$: 'vue/dist/vue.runtime.esm.js'
    },
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
  plugins: [new webpack.optimize.ModuleConcatenationPlugin()],
  devtool: 'inline-source-map',
  devServer: {
    port: 50000,
    proxy: {
      '*': {
        target: {
          port: 50001
        }
      },
      '/api': {
        target: {
          port: 50001
        },
        ws: true
      }
    }
  }
}
