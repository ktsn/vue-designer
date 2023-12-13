const path = require('path')

module.exports = {
  outputDir: 'lib',
  filenameHashing: false,
  productionSourceMap: false,

  lintOnSave: process.env.NODE_ENV !== 'production',

  css: {
    extract: false
  },

  chainWebpack: config => {
    // prettier-ignore
    config.module
      .rule('ts')
      .use('ts-loader')
        .loader('ts-loader')
        .tap(options => {
          options.configFile = 'tsconfig.view.json'
          return options
        })

    // prettier-ignore
    config
      .plugin('fork-ts-checker')
      .tap(args => {
        args[0].typescript.configFile = path.resolve(__dirname, 'tsconfig.view.json')
        return args
      })

    // Disable to generate html
    config.plugins.delete('html')
    config.plugins.delete('preload')
    config.plugins.delete('prefetch')
  },

  configureWebpack: {
    entry: {
      app: './src/view/main.ts'
    },
    output: {
      filename: 'vue-designer-view.js'
    },
    optimization: {
      splitChunks: false
    },
    performance: {
      hints: false
    }
  },

  devServer: {
    port: 50000,

    setupMiddlewares: (middlewares, devServer) => {
      devServer.app.get((req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*')
        next()
      })
      return middlewares
    },

    proxy: {
      '/': {
        target: 'http://localhost:50001',
        ws: false
      },
      '/api': {
        target: 'http://localhost:50001',
        ws: true
      }
    }
  }
}
