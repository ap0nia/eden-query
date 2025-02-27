import styles from './index.module.scss'
import { useVersionMenuData } from './menuDataHooks'
import { NavMenuGroup } from './NavMenuGroup'

export function NavVersions() {
  const versionsMenuData = useVersionMenuData()

  return (
    <div
      className={`translation ${styles['menuItem']} flex items-center px-3 py-2 text-sm font-bold`}
    >
      <div>
        <NavMenuGroup {...versionsMenuData} />
      </div>
    </div>
  )
}
