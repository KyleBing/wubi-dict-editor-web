const FileManagerPlugin = require('filemanager-webpack-plugin')
const Moment = require('moment')

module.exports = {
  publicPath: './',
  productionSourceMap: false, // 不产出 .map 文件
  outputDir: '../diary',
  configureWebpack: config => {
    if (process.env.NODE_ENV === 'production'){
      let packTimeString = new Moment().format('YYYYMMDDHHmmss') // 打包时间
      let plugins = []
      plugins.push(
          new FileManagerPlugin({
            events: {
              onEnd: {
                // mkdir: ['./archive'], // 新建 ./archive 目录
                archive: [
                  // 打包 ./dist 到 ./archive/dist-datetime.zip 压缩文件中，压缩包中不带 dist 外壳
                  {source: '../diary/', destination: `../diary-${packTimeString}.zip`},
                ]
              }
            }
          })
      )
      config.plugins = config.plugins.concat(plugins) // 将新建的 plugin 添加到原 config 中的 plugin 中
    }
  }
}
