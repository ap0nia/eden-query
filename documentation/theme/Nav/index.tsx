import type { NavItem } from '@rspress/shared'
import { Search } from '@theme'
import { useEffect, useState } from 'react'
import { useLocation, usePageData, useVersion } from 'rspress/runtime'
import { isMobileDevice, SocialLinks, useHiddenNav, useLocaleSiteData } from 'rspress/theme'

import { cn } from '../../src/utils/cn'
import { NavHamburger } from '../NavHamburger'
import { ThemeToggle } from '../theme-toggle'
import styles from './index.module.scss'
import { NavBarTitle } from './NavBarTitle'
import { NavMenuGroup } from './NavMenuGroup'
import { NavMenuSingleItem } from './NavMenuSingleItem'
import { NavTranslations } from './NavTranslations'
import { NavVersions } from './NavVersions'

export interface NavProps {
  beforeNav?: React.ReactNode
  beforeNavTitle?: React.ReactNode
  navTitle?: React.ReactNode
  afterNavTitle?: React.ReactNode
  afterNavMenu?: React.ReactNode
}

const DEFAULT_NAV_POSITION = 'right'

export function useNavScreen() {
  const { pathname } = useLocation()

  const [isScreenOpen, setIsScreenOpen] = useState(false)

  function openScreen() {
    setIsScreenOpen(true)
    window.addEventListener('resize', closeScreenOnTabletWindow)
  }

  function closeScreen() {
    setIsScreenOpen(false)
    window.removeEventListener('resize', closeScreenOnTabletWindow)
  }

  function toggleScreen() {
    if (isScreenOpen) {
      closeScreen()
    } else {
      openScreen()
    }
  }

  useEffect(() => {
    closeScreen()
  }, [pathname])

  /**
   * Close screen when the user resizes the window wider than tablet size.
   */
  function closeScreenOnTabletWindow() {
    if (window.outerWidth >= 768) {
      closeScreen()
    }
  }

  return {
    isScreenOpen,
    openScreen,
    closeScreen,
    toggleScreen,
  }
}

export function useNavData() {
  const { nav } = useLocaleSiteData()

  const version = useVersion()

  // Normalize the nav item links to include the version prefix
  if (Array.isArray(nav)) {
    return nav
  }

  const navKey = version.length > 0 ? version : 'default'

  return [...nav![navKey]]
}

export function Nav(props: NavProps) {
  const { beforeNavTitle, afterNavTitle, beforeNav, afterNavMenu, navTitle } = props

  const { siteData, page } = usePageData()

  const { base } = siteData

  const { pathname } = useLocation()

  const [isMobile, setIsMobile] = useState(isMobileDevice())

  const hiddenNav = useHiddenNav()

  const localeLanguages = Object.values(siteData.locales || siteData.themeConfig.locales || {})

  const hasMultiLanguage = localeLanguages.length > 1

  const hasMultiVersion = siteData.multiVersion.versions.length > 1

  const socialLinks = siteData.themeConfig.socialLinks || []

  const hasSocialLinks = socialLinks.length > 0

  const langs = localeLanguages.map((item) => item.lang || '') || []

  const updateIsMobile = () => {
    setIsMobile(isMobileDevice())
  }

  useEffect(() => {
    window.addEventListener('resize', updateIsMobile)

    return () => {
      window.removeEventListener('resize', updateIsMobile)
    }
  }, [])

  const NavMenu = ({ menuItems }: { menuItems: NavItem[] }) => {
    return (
      <div className="rspress-nav-menu menu h-14 px-0">
        {menuItems.map((item) => {
          return 'items' in item || Array.isArray(item) ? (
            <div key={item.text} className="mx-3 last:mr-0">
              <NavMenuGroup
                {...item}
                base={base}
                pathname={pathname}
                langs={langs}
                items={'items' in item ? item.items : item}
              />
            </div>
          ) : (
            <NavMenuSingleItem
              pathname={pathname}
              langs={langs}
              base={base}
              key={item.link}
              compact={menuItems.length > 5}
              {...item}
            />
          )
        })}
      </div>
    )
  }

  const menuItems = useNavData()

  const getPosition = (menuItem: NavItem) => menuItem.position ?? DEFAULT_NAV_POSITION

  const leftMenuItems = menuItems.filter((item) => getPosition(item) === 'left')

  const rightMenuItems = menuItems.filter((item) => getPosition(item) === 'right')

  const hasSearch = siteData?.themeConfig?.search !== false

  const hasAppearanceSwitch = siteData.themeConfig.darkMode !== false

  const leftNav = () => {
    return leftMenuItems.length > 0 ? (
      <div className={styles['leftNav']}>
        <NavMenu menuItems={leftMenuItems} />
      </div>
    ) : null
  }

  const rightNav = () => {
    return (
      <div className={cn(styles['rightNav'], styles['lg-grow'], 'justify-between')}>
        {hasSearch && (
          <div className="flex items-center sm:pl-4 sm:pr-2">
            <Search />
          </div>
        )}

        <div className={styles['rightNav']}>
          <NavMenu menuItems={rightMenuItems} />

          <div className="flex-center flex-row">
            {hasMultiLanguage && <NavTranslations />}

            {hasMultiVersion && <NavVersions />}

            {hasAppearanceSwitch && (
              <div className="mx-2">
                <ThemeToggle />
              </div>
            )}

            {hasSocialLinks && <SocialLinks socialLinks={socialLinks} />}
          </div>
        </div>
      </div>
    )
  }

  const computeNavPosition = () => {
    // On doc page we have the menu bar that is already sticky
    if (!isMobile) {
      return 'sticky'
    }

    if (siteData.themeConfig.hideNavbar === 'never' && page.pageType !== 'doc') return 'sticky'

    return 'relative'
  }

  return (
    <>
      {beforeNav}

      <div
        className={cn(
          styles['navContainer'],
          'rspress-nav',
          'px-6',
          'bg-base-100/80 hover:bg-base-200/100',
          // Only hidden when it's not mobile
          hiddenNav && !isMobile && styles['hidden'],
          computeNavPosition(),
        )}
      >
        <div className={`${styles['container']} flex h-full items-center justify-between`}>
          {beforeNavTitle}

          {navTitle || <NavBarTitle />}

          {afterNavTitle}

          <div className="flex flex-1 items-center justify-end">
            {leftNav()}

            {rightNav()}

            {afterNavMenu}

            <div className={styles['mobileNavMenu']}>
              {isMobile && hasSearch && <Search />}
              <NavHamburger siteData={siteData} pathname={pathname} />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
