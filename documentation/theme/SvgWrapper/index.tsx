export type SvgWrapperProps = {
  icon: string | React.FC<React.SVGProps<SVGSVGElement>>
} & React.SVGAttributes<SVGSVGElement | HTMLImageElement>

/**
 * A wrapper for custom SVG icon.
 * When the user uses a custom SVG, the imported icon can be a string or a React component.
 */
export function SvgWrapper({ icon: Icon, ...rest }: SvgWrapperProps) {
  if (!Icon) {
    return null
  }

  if (typeof Icon === 'string') {
    return <img src={Icon} alt="" {...rest} />
  }

  return <Icon {...rest} />
}
