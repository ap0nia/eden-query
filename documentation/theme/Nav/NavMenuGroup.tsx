import type {
  NavItem,
  NavItemWithChildren,
  NavItemWithLink,
  NavItemWithLinkAndChildren,
} from '@rspress/shared'
import { withoutBase } from '@rspress/shared'
import { Link, Tag } from '@theme'
import Down from '@theme-assets/down'
import { useState } from 'react'

import { SvgWrapper } from '../SvgWrapper'
import { NavMenuSingleItem } from './NavMenuSingleItem'

export interface NavMenuGroupItem {
  text?: string | React.ReactElement
  link?: string
  items: NavItem[]
  tag?: string

  /**
   * Design for i18n highlight.
   */
  activeValue?: string

  /**
   * Current pathname.
   */
  pathname?: string

  /**
   * Base path.
   */
  base?: string

  /**
   * Locales.
   */
  langs?: string[]
}

function ActiveGroupItem({ item }: { item: NavItemWithLink }) {
  return (
    <div
      key={item.link}
      className="my-1 flex rounded-2xl"
      style={{
        padding: '0.4rem 1.5rem 0.4rem 0.75rem',
      }}
    >
      {item.tag && <Tag tag={item.tag} />}
      <span className="text-brand">{item.text}</span>
    </div>
  )
}

function NormalGroupItem({ item }: { item: NavItemWithLink }) {
  return (
    <div key={item.link} className="my-1 font-medium">
      <Link href={item.link}>
        <div
          className="hover:bg-mute rounded-2xl"
          style={{
            padding: '0.4rem 1.5rem 0.4rem 0.75rem',
          }}
        >
          <div className="flex">
            {item.tag && <Tag tag={item.tag} />}
            <span>{item.text}</span>
          </div>
        </div>
      </Link>
    </div>
  )
}

export function NavMenuGroup(item: NavMenuGroupItem) {
  const { activeValue, items: groupItems, base = '', link = '', pathname = '' } = item

  const [isOpen, setIsOpen] = useState(false)

  const renderLinkItem = (item: NavItemWithLink) => {
    const isLinkActive = new RegExp(item.activeMatch || item.link).test(withoutBase(pathname, base))

    if (activeValue === item.text || (!activeValue && isLinkActive)) {
      return <ActiveGroupItem key={item.link} item={item} />
    }
    return <NormalGroupItem key={item.link} item={item} />
  }

  const renderGroup = (item: NavItemWithChildren | NavItemWithLinkAndChildren) => {
    return (
      <div>
        {'link' in item ? (
          renderLinkItem(item as NavItemWithLink)
        ) : (
          <p className="not:first:border my-1 font-bold text-gray-400">{item.text}</p>
        )}
        {item.items.map(renderLinkItem)}
      </div>
    )
  }

  return (
    <div className="flex-center relative h-14" onMouseLeave={() => setIsOpen(false)}>
      <button
        onMouseEnter={() => setIsOpen(true)}
        className="rspress-nav-menu-group-button flex-center text-text-1 hover:text-text-2 items-center text-sm font-medium transition-colors duration-200"
      >
        {link ? (
          // @ts-expect-error item.text may be ReactElement
          <NavMenuSingleItem {...item} rightIcon={<SvgWrapper icon={Down} />} />
        ) : (
          <>
            <span
              className="flex text-sm font-medium"
              style={{
                marginRight: '2px',
              }}
            >
              <Tag tag={item.tag} />
              {item.text}
            </span>
            <SvgWrapper icon={Down} />
          </>
        )}
      </button>

      <div
        className="rspress-nav-menu-group-content mx-0.8 absolute transition-opacity duration-300"
        style={{
          opacity: isOpen ? 1 : 0,
          visibility: isOpen ? 'visible' : 'hidden',
          right: 0,
          top: '52px',
        }}
      >
        <div
          className="max-h-100vh h-full w-full whitespace-nowrap p-3 pr-2"
          style={{
            boxShadow: 'var(--rp-shadow-3)',
            zIndex: 100,
            border: '1px solid var(--rp-c-divider-light)',
            borderRadius: 'var(--rp-radius-large)',
            background: 'var(--rp-c-bg)',
          }}
        >
          {/* The item could be a link or a sub group */}
          {groupItems.map((item) => {
            return (
              <div key={item.text}>
                {'items' in item ? renderGroup(item) : renderLinkItem(item)}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
