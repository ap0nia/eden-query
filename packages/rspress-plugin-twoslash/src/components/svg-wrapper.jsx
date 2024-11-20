/**
 * A wrapper for custom SVG icon.
 * When the user uses a custom SVG, the imported icon can be a string or a React component.
 *
 * @param {{icon: string | React.FC<React.SVGProps<SVGSVGElement>>} & React.SVGAttributes<SVGSVGElement | HTMLImageElement>} param0
 */
export function SvgWrapper({ icon: Icon, ...rest }) {
  if (!Icon) {
    return null
  }

  if (typeof Icon === 'string') {
    return <img src={Icon} alt="" {...rest} />
  }

  return <Icon {...rest} />
}
