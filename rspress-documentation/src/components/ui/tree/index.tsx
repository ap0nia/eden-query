import { Children, createContext, forwardRef, useContext } from 'react'

import { Slot } from '@radix-ui/react-slot'

import { cn } from '@/utils/cn'

export interface TreeItemProps extends React.HTMLAttributes<HTMLLIElement> {
  asChild?: boolean
}

const TreeItem = forwardRef<HTMLLIElement, TreeItemProps>((props, ref) => {
  const { asChild, children, className, ...restProps } = props

  const { handleToggleItem } = useContext(treeContext)

  const Component = asChild ? Slot : 'li'

  const handleClick = () => {
    console.log(props.value)
  }

  return (
    <Component ref={ref} {...restProps}>
      <button className={cn(className, 'btn btn-primary')} onClick={handleClick}>
        hi
      </button>
    </Component>
  )
})

TreeItem.displayName = 'TreeItem'

export interface TreeProps extends React.HTMLAttributes<HTMLElement> {
  asChild?: boolean
  root?: boolean
  value?: string
}

const treeContext = createContext({})

const Tree = forwardRef<HTMLUListElement, TreeProps>((props, ref) => {
  const { asChild, children, className, root, value, ...restProps } = props

  const Component = asChild ? Slot : 'ul'

  const childArray = Children.toArray(children)

  const handleToggleItem = (id: string) => {
    console.log({ root, id })
  }

  console.log({ childArray })

  return (
    <treeContext.Provider value={{ handleToggleItem }}>
      <Component className={cn(className)} ref={ref} {...restProps}>
        {children}
      </Component>
    </treeContext.Provider>
  )
})

Tree.displayName = 'Tree'

export { Tree, TreeItem }
