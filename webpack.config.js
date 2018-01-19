const path = require('path')
const webpack = require('webpack')

const base = path.resolve(__dirname)

const plugins = []
if (!process.env.DEV) {
  plugins.push(new webpack.optimize.ModuleConcatenationPlugin())
}

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
          configFile: 'tsconfig.view.json',
          appendTsSuffixTo: [/\.vue$/]
        }
      },
      {
        test: /\.vue$/,
        loader: 'vue-loader'
      }
    ]
  },
  plugins,
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
