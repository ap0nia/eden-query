import { Slot } from '@radix-ui/react-slot'
import { AnimatePresence, motion } from 'motion/react'
import { Children, createContext, forwardRef, isValidElement, useContext, useState } from 'react'

import { cn } from '@/utils/cn'

export interface TreeItemProps extends React.HTMLAttributes<HTMLLIElement> {
  asChild?: boolean
  value: string
}

const TreeItem = forwardRef<HTMLLIElement, TreeItemProps>((props, ref) => {
  const { asChild, children, className, value, ...restProps } = props

  const { prefix, handleToggleItem } = useContext(treeContext)

  const Component = asChild ? Slot : 'li'

  const handleClick = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    handleToggleItem?.(event, `${prefix}${value}`)
  }

  return (
    <Component ref={ref} {...restProps}>
      <button
        className={cn(className, 'btn btn-ghost btn-sm', 'text-normal')}
        onClick={handleClick}
      >
        {children}
      </button>
    </Component>
  )
})

TreeItem.displayName = 'TreeItem'

export type TreeProps = Omit<React.HTMLAttributes<HTMLElement>, 'onChange'> & {
  asChild?: boolean
  onChange?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>, value: string) => any
} & (RootTreeProps | LeafTreeProps)

export type RootTreeProps = {
  value: string
  root?: undefined
}

export type LeafTreeProps = {
  root: true
  value?: undefined
}

export interface TreeContext {
  handleToggleItem: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>, value: string) => any
  level: number
  prefix: string
}

const treeContext = createContext<TreeContext>({
  handleToggleItem: (_event, _value) => {},
  level: 0,
  prefix: '',
})

const Tree = forwardRef<HTMLDivElement, TreeProps>((props, ref) => {
  const { asChild, children, className, root, onChange, value = '', ...restProps } = props

  const context = useContext(treeContext)

  const Component = asChild ? Slot : 'div'

  const valueWithPrefix = `${context.prefix}${value}`

  const treeChildren =
    Children.map(children, (child) => {
      if (!isValidElement(child)) return
      if (child.type === Tree || child.type === TreeItem) return child
      return null
    })?.filter(Boolean) || []

  const nonTreeChildren = Children.map(children, (child) => {
    if (!isValidElement(child)) return child
    if (child.type === Tree || child.type === TreeItem) return null
    return child
  })?.filter(Boolean)

  const defaultOpenChildrenValues = treeChildren
    .map((child) => {
      return `${valueWithPrefix}${child.props['value']}`
    })
    .filter(Boolean)

  const [open, setOpen] = useState([...defaultOpenChildrenValues, valueWithPrefix])

  const handleToggleItem: TreeContext['handleToggleItem'] = (event, id) => {
    console.log({ id })

    if (root) {
      onChange?.(event, id)
    } else {
      context.handleToggleItem(event, id)
    }
  }

  const handleToggleTree = () => {
    setOpen((open) => {
      if (open.includes(valueWithPrefix)) {
        return open.filter((v) => v !== valueWithPrefix)
      } else {
        return [...open, valueWithPrefix]
      }
    })
  }

  const trigger = nonTreeChildren?.[0]

  const level = root ? context.level + Number(Boolean(trigger)) : context.level + 1

  const shouldShow = open.includes(valueWithPrefix)

  return (
    <treeContext.Provider value={{ handleToggleItem, level, prefix: valueWithPrefix }}>
      <Component className={cn(className, 'space-y-2')} ref={ref} {...restProps}>
        {trigger && (
          <button
            onClick={handleToggleTree}
            className={cn('btn btn-ghost btn-sm w-full min-w-fit justify-start', root && '-ml-4')}
          >
            <span
              className={cn(
                'icon-[mdi--expand-more] transition-transform',
                !shouldShow && 'rotate-180',
              )}
            ></span>

            <span className={cn('swap', shouldShow && 'swap-active')}>
              <span className={cn('swap-off', 'icon-[mdi--folder]')}></span>
              <span className={cn('swap-on', 'icon-[mdi--folder-open]')}></span>
            </span>

            {trigger}
          </button>
        )}

        <AnimatePresence>
          {shouldShow && (
            <motion.div
              key={value}
              initial="collapsed"
              animate="open"
              exit="collapsed"
              variants={{
                open: { opacity: 1, height: 'auto' },
                collapsed: { opacity: 0, height: 0 },
              }}
              transition={{ ease: 'easeInOut' }}
              className={cn('flex gap-2', level > 1 ? 'ml-[1.25rem]' : 'ml-[0.25rem]')}
            >
              <div className="divider divider-horizontal mx-0 w-0 pb-3"></div>

              <ul className="space-y-2">{treeChildren}</ul>
            </motion.div>
          )}
        </AnimatePresence>
      </Component>
    </treeContext.Provider>
  )
})

Tree.displayName = 'Tree'

export { Tree, TreeItem }
