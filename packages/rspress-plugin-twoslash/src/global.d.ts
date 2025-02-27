/**
 * @see https://github.com/web-infra-dev/rspress/blob/a02feff8135fb82ee9864bc0d8cc524b9b9eac2c/packages/theme-default/src/global.d.ts
 */

declare module '*.module.scss' {
  const classes: { [key: string]: string }
  export default classes
}

declare module '@theme-assets/*' {
  const SvgIcon: React.FC<React.SVGProps<SVGSVGElement>> | string
  export default SvgIcon
}

declare module '*.svg' {
  export const ReactComponent: React.FC<React.SVGProps<SVGSVGElement>>
  export default ReactComponent
}

declare module 'virtual-prism-languages' {
  export const aliases: Record<string, string[]>
  export const languages: Record<string, unknown>
}

declare module '@theme'
