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

  const { prefix, onChange, onCheckChanged, checked } = useContext(treeContext)

  const Component = asChild ? Slot : 'li'

  const prefixedValue = `${prefix}${value}`

  const handleClick = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    onChange?.(event, prefixedValue)
  }

  const handleCheck = (e: React.ChangeEvent<HTMLInputElement>) => {
    onCheckChanged(e, prefixedValue)
  }

  const inputChecked = checked.includes(prefixedValue)

  return (
    <Component ref={ref} {...restProps} className={cn('flex items-center gap-1', className)}>
      <input
        type="checkbox"
        className="check check-sm"
        checked={inputChecked}
        onChange={handleCheck}
      />

      <button className={cn('btn btn-ghost btn-sm', 'text-normal')} onClick={handleClick}>
        {children}
      </button>
    </Component>
  )
})

TreeItem.displayName = 'TreeItem'

export type TreeProps = Omit<React.HTMLAttributes<HTMLElement>, 'onChange'> & {
  asChild?: boolean
  onChange?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>, value: string) => any
  onCheckChanged?: (e: React.ChangeEvent<HTMLInputElement>, value: string) => any
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
  onChange: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>, value: string) => any
  onCheckChanged: (e: React.ChangeEvent<HTMLInputElement>, value: string) => any
  level: number
  prefix: string
  checked: string[]
}

const treeContext = createContext<TreeContext>({
  onChange: (_event, _value) => {},
  onCheckChanged: (_event, _value) => {},
  checked: [],
  level: 0,
  prefix: '',
})

const Tree = forwardRef<HTMLDivElement, TreeProps>((props, ref) => {
  const {
    asChild,
    children,
    className,
    root,
    onChange,
    // onCheckChanged,
    value = '',
    ...restProps
  } = props

  const context = useContext(treeContext)

  const Component = asChild ? Slot : 'div'

  const prefix = `${context.prefix}${value}`

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
      return `${prefix}${child.props['value']}`
    })
    .filter(Boolean)

  const [open, setOpen] = useState([...defaultOpenChildrenValues, prefix])

  const [checked, setChecked] = useState<string[]>([])

  const handleCheckChanged: TreeContext['onCheckChanged'] = (event, id) => {
    if (root) {
      setChecked((checked) => {
        if (checked.includes(id)) {
          return checked.filter((c) => c !== id)
        } else {
          return [...checked, id]
        }
      })
      // onCheckChanged?.(event, id)
    } else {
      context.onCheckChanged(event, id)
    }
  }

  const handleChange: TreeContext['onChange'] = (event, id) => {
    if (root) {
      onChange?.(event, id)
    } else {
      context.onChange(event, id)
    }
  }

  const handleToggleTree = () => {
    setOpen((open) => {
      if (open.includes(prefix)) {
        return open.filter((v) => v !== prefix)
      } else {
        return [...open, prefix]
      }
    })
  }

  const trigger = nonTreeChildren?.[0]

  const level = root ? context.level + Number(Boolean(trigger)) : context.level + 1

  const shouldShow = open.includes(prefix)

  return (
    <treeContext.Provider
      value={{
        onChange: handleChange,
        checked: root ? checked : context.checked,
        onCheckChanged: handleCheckChanged,
        level,
        prefix,
      }}
    >
      <Component className={cn(className, 'space-y-2')} ref={ref} {...restProps}>
        {trigger && (
          <div className="flex items-center gap-1">
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
          </div>
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
              className={cn(
                'flex gap-2 overflow-hidden',
                level > 1 ? 'ml-[1.25rem]' : 'ml-[0.25rem]',
              )}
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
