import type { Highlighter } from 'shiki'
import { codeToKeyedTokens } from 'shiki-magic-move/core'
import { MarkdownRenderer } from 'vitepress'
import type { PluginOption } from 'vite'

const MAGIC_MOVE_BLOCK_REGEX = /^:::magic-move(?:[ ]*(\{.*?\})?([^\n]*?))?\n([\s\S]+?)^:::$/gm

const CODE_BLOCK_REGEX =
  /^```([\w'-]+?)(?:\s*\[([^\]]*)\])?(?:\s*{([\d\w*,\|-]+)}\s*?({.*?})?(.*?))?\n([\s\S]+?)^```$/gm

export function normalizeRangeStr(rangeStr = '') {
  return !rangeStr.trim()
    ? []
    : rangeStr
        .trim()
        .split(/\|/g)
        .map((i) => i.trim())
}

export async function magicMove(md: MarkdownRenderer, shiki: Highlighter) {
  md.block.ruler.before('fence', 'magic-move', (state, startLine, _endLine, _silent) => {
    const start = state.bMarks[startLine] + state.tShift[startLine]

    const max = state.eMarks[startLine]

    if (state.src.slice(start, max).startsWith(':::magic-move')) {
      const [containerBlock = ''] = state.src.slice(start).match(MAGIC_MOVE_BLOCK_REGEX) || []

      const matches = Array.from(containerBlock.matchAll(CODE_BLOCK_REGEX))

      if (!matches.length) {
        throw new Error('Magic Move block must contain at least one code block')
      }

      const ranges = matches.map((i) => normalizeRangeStr(i[3]))

      const steps = matches.map((i) => {
        const code = i[6].trimEnd()

        const options = {
          lang: i[1] as any,
          themes: {
            light: 'github-light',
            dark: 'github-dark',
          },
        }

        const keyedTokenInfo = codeToKeyedTokens(shiki, code, options)

        const fileName = i[2] || i[1]

        return { ...keyedTokenInfo, fileName }
      })

      const token = state.push('magic-move_open', 'div', 1)

      token.meta = {
        stepsLz: encodeURIComponent(JSON.stringify(steps)),
        stepRanges: JSON.stringify(ranges),
      }

      state.push('magic-move_close', 'div', -1)
      state.line = startLine + containerBlock.split('\n').length

      return true
    }

    return false
  })

  function renderDefault(tokens: any[], idx: number) {
    if (tokens[idx].nesting === 1) {
      const { stepsLz, stepRanges } = tokens[idx].meta
      return `<MagicMove steps-lz="${stepsLz}" :step-ranges="${stepRanges}" />`
    }

    return ''
  }

  md.renderer.rules['magic-move_open'] = renderDefault
  md.renderer.rules['magic-move_close'] = renderDefault
}

export function MagicMovePlugin(): PluginOption {
  return {
    name: 'vite-plugin-magic-move',

    enforce: 'post',

    transform(src, id) {
      if (id.includes('vitepress/dist/client/app/index.js')) {
        src = `\nimport MagicMove from 'vitepress-plugin-magic-move/MagicMove.vue';\n${src}`

        const lines = src.split('\n')

        const targetLineIndex = lines.findIndex((line) => line.includes('app.component'))

        lines.splice(targetLineIndex, 0, '  app.component("MagicMove", MagicMove);')

        src = lines.join('\n')

        return { code: src, map: null }
      }
    },
  }
}
