import styles from './index.module.scss'
import { useVersionMenuData } from './menuDataHooks'
import { NavMenuGroup } from './NavMenuGroup'

export function NavVersions() {
  const versionsMenuData = useVersionMenuData()

  return (
    <div
      className={`translation ${styles['menuItem']} flex text-sm font-bold items-center px-3 py-2`}
    >
      <div>
        <NavMenuGroup {...versionsMenuData} />
      </div>
    </div>
  )
}
