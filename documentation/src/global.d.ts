declare module '@theme' {
  export * from 'rspress/theme'
}

declare module '*.module.scss' {
  const classes: { [key: string]: string }
  export default classes
}

declare module '@theme-assets/*' {
  const SvgIcon: React.FC<React.SVGProps<SVGSVGElement>> | string
  export default SvgIcon
}
