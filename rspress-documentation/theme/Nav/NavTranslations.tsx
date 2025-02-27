import styles from './index.module.scss'
import { useTranslationMenuData } from './menuDataHooks'
import { NavMenuGroup } from './NavMenuGroup'

export function NavTranslations() {
  const translationMenuData = useTranslationMenuData()
  return (
    <div
      className={`translation ${styles['menuItem']} flex text-sm font-bold items-center px-3 py-2`}
    >
      <div>
        <NavMenuGroup {...translationMenuData} />
      </div>
    </div>
  )
}
