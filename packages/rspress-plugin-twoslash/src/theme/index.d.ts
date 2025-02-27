export interface PreChildrenProps extends React.ComponentProps<'pre'> {
  children?: React.ReactElement
  parentClassName?: string
  meta: string
}

export const components: Record<string, React.FC>
