// TODO: 建立 PurgeCSS 來減少 CSS 檔案大小

// const { defineConfig } = require('@vue/cli-service')
// module.exports = defineConfig({
//   transpileDependencies: true
// })

// const PurgecssPlugin = require('purgecss-webpack-plugin').default
// const glob = require('glob-all')
// const path = require('path')

module.exports = {
  parallel: false,
  chainWebpack (config) {
    config.module.rule('md')
      .test(/\.md/)
      .use('vue-loader')
      .loader('vue-loader')
      .end()
      .use('vue-markdown-loader')
      .loader('vue-markdown-loader/lib/markdown-compiler')
      .options({
        raw: true
      })
  }
  // plugins: [
  //   new PurgecssPlugin({
  //     paths: glob.sync([
  //       path.join(__dirname, './public/index.html'),
  //       path.join(__dirname, './src/**/*.vue'),
  //       path.join(__dirname, './src/**/*.html')
  //     ])
  //   })
  // ]
}
