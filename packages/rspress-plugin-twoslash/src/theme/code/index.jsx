// @ts-check

import { usePageData } from '@rspress/runtime'
import IconWrap from '@theme-assets/wrap'
import IconWrapped from '@theme-assets/wrapped'
import { useRef, useState } from 'react'

import { SvgWrapper } from '../../components/svg-wrapper'
import { CopyCodeButton } from './copy-code-button'
import styles from './index.module.scss'
import { PrismSyntaxHighlighter } from './prism-syntax-highlighter'

/**
 * @param {import('./types').CodeProps} props
 */
export function Code(props) {
  const { siteData } = usePageData()
  const codeHighlighter = props.codeHighlighter ?? siteData.markdown.codeHighlighter
  const { defaultWrapCode } = siteData.markdown
  const [codeWrap, setCodeWrap] = useState(defaultWrapCode)

  /**
   * @type React.MutableRefObject< HTMLButtonElement | null >
   */
  const wrapButtonRef = useRef(null)

  /**
   * @type React.MutableRefObject<HTMLDivElement | null>
   */
  const codeBlockRef = useRef(null)

  const { className } = props
  const language = className?.replace(/language-/, '')

  if (!language) {
    return <code {...props}></code>
  }

  /**
   * @param {HTMLButtonElement | null} wrapButtonElement
   */
  const toggleCodeWrap = (wrapButtonElement) => {
    if (codeWrap) {
      wrapButtonElement?.classList.remove(styles.wrappedBtn)
    } else {
      wrapButtonElement?.classList.add(styles.wrappedBtn)
    }

    setCodeWrap(!codeWrap)
  }

  const getHighlighter = () => {
    switch (codeHighlighter) {
      case 'prism':
        return <PrismSyntaxHighlighter {...props} language={language} codeWrap={codeWrap} />
      case 'shiki':
      default:
        return <code style={{ whiteSpace: codeWrap ? 'pre-wrap' : undefined }} {...props}></code>
    }
  }

  return (
    <>
      {/* Use prism.js to highlight code by default */}
      <div ref={codeBlockRef}>{getHighlighter()}</div>
      <div className={styles.codeButtonGroup}>
        <button
          ref={wrapButtonRef}
          className={styles.codeWrapButton}
          onClick={() => toggleCodeWrap(wrapButtonRef.current)}
          title="Toggle code wrap"
        >
          <SvgWrapper icon={IconWrapped} className={styles.iconWrapped} />
          <SvgWrapper icon={IconWrap} className={styles.iconWrap} />
        </button>
        <CopyCodeButton codeBlockRef={codeBlockRef} />
      </div>
    </>
  )
}
