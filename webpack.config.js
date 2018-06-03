const path = require('path')
const webpack = require('webpack')
const merge = require('webpack-merge')
const { VueLoaderPlugin } = require('vue-loader')

const basePath = path.resolve(__dirname)

const baseConfig = {
  context: path.join(basePath, 'src'),
  entry: './view/main.ts',
  output: {
    path: path.join(basePath, 'lib'),
    filename: 'vue-designer-view.js'
  },
  resolve: {
    alias: {
      '@': path.join(basePath, 'src'),
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
        test: /\.scss$/,
        use: [
          'vue-style-loader',
          'css-loader',
          {
            loader: 'sass-loader',
            options: {
              data: '@import "view/globals";',
              includePaths: [path.join(basePath, 'src')]
            }
          }
        ]
      },
      {
        test: /\.vue$/,
        loader: 'vue-loader'
      }
    ]
  },
  plugins: [new VueLoaderPlugin()],
  performance: {
    hints: false
  }
}

module.exports = function(_, argv) {
  if (argv.mode === 'production') {
    return baseConfig
  }

  return merge(baseConfig, {
    devtool: 'cheap-module-eval-source-map',
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
  })
}
