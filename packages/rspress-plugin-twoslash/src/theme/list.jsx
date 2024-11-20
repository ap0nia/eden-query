import { cn } from '../utils/tailwind'

/**
 * @param { React.ComponentProps<'ul'>} props
 *
 * @see https://github.com/web-infra-dev/rspress/blob/a02feff8135fb82ee9864bc0d8cc524b9b9eac2c/packages/theme-default/src/layout/DocLayout/docComponents/list.tsx#L7
 */
export function Ul(props) {
  return <ul {...props} className={cn('list-disc pl-5 my-4 leading-7', props.className)} />
}
