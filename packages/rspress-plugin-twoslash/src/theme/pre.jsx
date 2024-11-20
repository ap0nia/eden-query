// @ts-check

import { cn } from '../utils/tailwind'

const DEFAULT_LANGUAGE_CLASS = 'language-bash'

/**
 * @see https://github.com/web-infra-dev/rspress/blob/a02feff8135fb82ee9864bc0d8cc524b9b9eac2c/packages/theme-default/src/layout/DocLayout/docComponents/pre.tsx#L5
 *
 * @param {string} meta
 * @returns string
 */
function parseTitleFromMeta(meta) {
  if (!meta) {
    return ''
  }

  let result = meta
  const highlightReg = /{[\d,-]*}/i
  const highlightMeta = highlightReg.exec(meta)?.[0]

  if (highlightMeta) {
    result = meta.replace(highlightReg, '').trim()
  }

  result = result.split('=')[1] ?? ''

  return result?.replace(/["'`]/g, '')
}

/**
 * @param {import('.').PreChildrenProps} props
 */
function PreChildren(props) {
  const codeTitle = parseTitleFromMeta(props.meta)

  return (
    <div className={cn(DEFAULT_LANGUAGE_CLASS, props.parentClassName)}>
      {codeTitle && <div className="rspress-code-title">{codeTitle}</div>}
      <div className={cn('rspress-code-content rspress-scrollbar', props.className)}>
        {props.children}
      </div>
    </div>
  )
}

/**
 * @param {import('.').PreChildrenProps} props
 *
 * @see https://github.com/web-infra-dev/rspress/blob/a02feff8135fb82ee9864bc0d8cc524b9b9eac2c/packages/theme-default/src/layout/DocLayout/docComponents/pre.tsx#L19
 */
export function Pre(props) {
  const parentClassName = props.className

  if (Array.isArray(props.children)) {
    return (
      <div>
        {props.children.map((child) => (
          <PreChildren {...props} parentClassName={parentClassName}>
            {child}
          </PreChildren>
        ))}
      </div>
    )
  }

  return (
    <PreChildren {...props} parentClassName={parentClassName}>
      {props.children}
    </PreChildren>
  )
}
