import styles from './index.module.scss'
import { useTranslationMenuData } from './menuDataHooks'
import { NavMenuGroup } from './NavMenuGroup'

export function NavTranslations() {
  const translationMenuData = useTranslationMenuData()
  return (
    <div
      className={`translation ${styles['menuItem']} flex items-center px-3 py-2 text-sm font-bold`}
    >
      <div>
        <NavMenuGroup {...translationMenuData} />
      </div>
    </div>
  )
}
