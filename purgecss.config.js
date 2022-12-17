// TODO: 建立 PurgeCSS 來減少 CSS 檔案大小

// const PurgecssPlugin = require('purgecss-webpack-plugin')
// const glob = require('glob-all')
// const path = require('path')
// module.exports = {
//   configureWebpack () {
//     // Additional config to be merged
//     let additionalConfig = {}
//     // Production config
//     if (process.env.NODE_ENV === 'production') {
//       additionalConfig = {
//         plugins: [
//           new PurgecssPlugin({
//             paths: glob.sync([
//               path.join(__dirname, './public/index.html'),
//               path.join(__dirname, './src/**/*.vue'),
//               path.join(__dirname, './src/**/*.html')
//             ])
//           })
//         ]
//       }
//     }
//     return additionalConfig
//   }
// }
