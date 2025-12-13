import type { UserConfigExport } from "@tarojs/cli";
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';

// 加载环境变量
const envFile = `.env.development`;
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
  mini: {
    enableSourceMap: true,
    sourceMapType: 'source-map',
  },
  h5: {}
} satisfies UserConfigExport<'vite'>
