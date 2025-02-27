// @ts-check

import { usePageData } from '@rspress/runtime'
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter'
import { aliases, languages } from 'virtual-prism-languages'

import prisimThemeStyle from '../prism-theme'

let registered = false

function registerLanguages() {
  Object.keys(languages).forEach((name) => {
    SyntaxHighlighter.registerLanguage(name, languages[name])
  })

  SyntaxHighlighter.alias(aliases)

  registered = true
}

/**
 * @param {import('./types').CodeProps & { language: string; codeWrap: boolean }} props
 */
export function PrismSyntaxHighlighter(props) {
  const { siteData } = usePageData()
  const { meta, language, codeWrap } = props
  const { showLineNumbers } = siteData.markdown

  let highlightMeta = ''

  /**
   * @type number[]
   */
  let highlightLines = []

  if (meta) {
    const highlightReg = /{[\d,-]*}/i
    highlightMeta = highlightReg.exec(meta)?.[0] || ''
    if (highlightMeta) {
      highlightLines = highlightMeta
        .replace(/[{}]/g, '')
        .split(',')
        .map((item) => {
          const [start, end] = item.split('-')
          if (end) {
            return Array.from(
              { length: Number(end) - Number(start) + 1 },
              (_, i) => i + Number(start),
            )
          }
          return Number(start)
        })
        .flat()
    }
  }

  if (!registered) {
    registerLanguages()
  }

  return (
    <SyntaxHighlighter
      language={language}
      style={prisimThemeStyle}
      wrapLines={true}
      className="code"
      wrapLongLines={codeWrap}
      customStyle={{ backgroundColor: 'inherit' }}
      // Notice: if the highlight line is specified, the line number must be displayed
      showLineNumbers={showLineNumbers || highlightLines.length > 0}
      lineProps={(lineNumber) => {
        const isHighlighted = highlightLines.includes(lineNumber)
        return {
          style: {
            ...(isHighlighted ? { backgroundColor: 'var(--rp-code-line-highlight-color)' } : {}),
            display: 'block',
            padding: '0 1.25rem',
          },
        }
      }}
    >
      {String(props.children).trim()}
    </SyntaxHighlighter>
  )
}
