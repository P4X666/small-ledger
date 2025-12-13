import type { UserConfigExport } from "@tarojs/cli";
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';

// 加载环境变量
const envFile = `.env.production`;
const envPath = path.resolve(process.cwd(), envFile);

let result: dotenv.DotenvConfigOutput = {};
if (fs.existsSync(envPath)) {
  result = dotenv.config({ path: envPath });
  Object.keys(result.parsed || {}).forEach(key => {
    // @ts-ignore
    result.parsed[key] = JSON.stringify(result.parsed[key]);
  })
  if (result.error) {
    console.error(`❌ 加载 ${envFile} 文件失败:`, result.error.message);
  } else {
    console.log(`✅ 成功加载 ${envFile} 文件`);
  }
} else {
  console.warn(`⚠️  ${envFile} 文件不存在，将使用默认配置`);
}

export default {
  defineConstants: result.parsed || {},
  mini: {},
  h5: {
    /**
     * WebpackChain 插件配置
     * @docs https://github.com/neutrinojs/webpack-chain
     */
    // webpackChain (chain) {
    //   /**
    //    * 如果 h5 端编译后体积过大，可以使用 webpack-bundle-analyzer 插件对打包体积进行分析。
    //    * @docs https://github.com/webpack-contrib/webpack-bundle-analyzer
    //    */
    //   chain.plugin('analyzer')
    //     .use(require('webpack-bundle-analyzer').BundleAnalyzerPlugin, [])
    //   /**
    //    * 如果 h5 端首屏加载时间过长，可以使用 prerender-spa-plugin 插件预加载首页。
    //    * @docs https://github.com/chrisvfritz/prerender-spa-plugin
    //    */
    //   const path = require('path')
    //   const Prerender = require('prerender-spa-plugin')
    //   const staticDir = path.join(__dirname, '..', 'dist')
    //   chain
    //     .plugin('prerender')
    //     .use(new Prerender({
    //       staticDir,
    //       routes: [ '/pages/index/index' ],
    //       postProcess: (context) => ({ ...context, outputPath: path.join(staticDir, 'index.html') })
    //     }))
    // }
  }
} satisfies UserConfigExport<'vite'>
