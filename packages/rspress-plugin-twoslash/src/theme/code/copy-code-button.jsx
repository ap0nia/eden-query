// @ts-check

import IconCopy from '@theme-assets/copy'
import IconSuccess from '@theme-assets/success'
import copy from 'copy-to-clipboard'
import { useRef } from 'react'

import { SvgWrapper } from '../../components/svg-wrapper'
import styles from './index.module.scss'

/**
 * @type Map<HTMLElement, NodeJS.Timeout>
 */
const timeoutIdMap = new Map()

/**
 * @param {HTMLDivElement | null} codeBlockElement
 * @param {HTMLButtonElement | null} copyButtonElement
 */
function copyCode(codeBlockElement, copyButtonElement) {
  if (codeBlockElement == null) return

  let text = ''

  const walk = document.createTreeWalker(codeBlockElement, NodeFilter.SHOW_TEXT, null)

  let node = walk.nextNode()

  while (node) {
    if (!node.parentElement?.classList.contains('linenumber')) {
      text += node.nodeValue
    }
    node = walk.nextNode()
  }

  const isCopied = copy(text)

  if (isCopied && copyButtonElement) {
    copyButtonElement.classList.add(styles.codeCopied)

    clearTimeout(timeoutIdMap.get(copyButtonElement))

    const timeoutId = setTimeout(() => {
      copyButtonElement.classList.remove(styles.codeCopied)
      copyButtonElement.blur()
      timeoutIdMap.delete(copyButtonElement)
    }, 2000)

    timeoutIdMap.set(copyButtonElement, timeoutId)
  }
}

/**
 * @param {{codeBlockRef: React.MutableRefObject<HTMLDivElement | null> }} param
 */
export function CopyCodeButton({ codeBlockRef }) {
  /**
   * @type React.MutableRefObject<null | HTMLButtonElement>
   */
  const copyButtonRef = useRef(null)

  return (
    <button
      className={styles.codeCopyButton}
      onClick={() => copyCode(codeBlockRef.current, copyButtonRef.current)}
      ref={copyButtonRef}
      title="Copy code"
    >
      <SvgWrapper icon={IconCopy} className={styles.iconCopy} />
      <SvgWrapper icon={IconSuccess} className={styles.iconSuccess} />
    </button>
  )
}
