// 由 colorTokens.js 生成 base.css 中的 :root 颜色块。
// 用法: npm run tokens:sync
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import { deriveCssVariables } from '../src/config/colorTokens.js'

const BEGIN =
  '/* == AUTO-GENERATED FROM src/config/colorTokens.js — 勿手改，改后跑 npm run tokens:sync == */'
const END = '/* == END AUTO-GENERATED == */'

export const renderBlock = () => {
  const lines = Object.entries(deriveCssVariables()).map(([name, value]) => `  ${name}: ${value};`)
  return [BEGIN, ':root {', ...lines, '}', END].join('\n')
}

export const syncCssTokens = () => {
  const cssPath = fileURLToPath(new URL('../src/assets/base.css', import.meta.url))
  const source = readFileSync(cssPath, 'utf-8')
  const begin = source.indexOf(BEGIN)
  const end = source.indexOf(END)

  if (begin === -1 || end === -1) {
    console.error('base.css 中找不到 AUTO-GENERATED 标记块，请先手动插入标记后重试。')
    process.exit(1)
  }

  writeFileSync(cssPath, source.slice(0, begin) + renderBlock() + source.slice(end + END.length))
  console.log('base.css 的 :root 颜色块已同步。')
}

// 只有被直接执行时才写文件。守卫测试会 import 本模块取 renderBlock()，
// 若在顶层写文件，跑一次测试就会改动源文件——那是自证成功的假测试。
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  syncCssTokens()
}
