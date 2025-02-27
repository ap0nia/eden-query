import type { NavItemWithLink, NavItemWithLinkAndChildren } from '@rspress/shared'
import { withoutBase } from '@rspress/shared'
import { Link, Tag } from '@theme'
import { normalizeHrefInRuntime as normalizeHref } from 'rspress/runtime'

import styles from './index.module.scss'

interface Props {
  pathname: string
  langs?: string[]
  base: string
  rightIcon?: React.ReactNode
  compact?: boolean
  onClick?: () => void
}

export function NavMenuSingleItem(item: (NavItemWithLink | NavItemWithLinkAndChildren) & Props) {
  const { pathname, base } = item

  const isActive = new RegExp(item.activeMatch || item.link).test(withoutBase(pathname, base))

  return (
    <Link href={normalizeHref(item.link)} onClick={item.onClick}>
      <div
        key={item.text}
        className={`rspress-nav-menu-item ${styles['singleItem']} ${
          isActive ? styles['activeItem'] : ''
        } text-sm font-medium ${item.compact ? 'mx-0.5' : 'mx-1.5'} flex items-center px-3 py-2`}
      >
        <Tag tag={item.tag} />
        {item.text}
        {item.rightIcon}
      </div>
    </Link>
  )
}
