import type { Theme } from 'daisyui'
import { flushSync } from 'react-dom'
import { Helmet } from 'rspress/runtime'
import { useThemeState } from 'rspress/theme'

import { cn } from '../src/utils/cn'

function transitionsEnabled() {
  if (typeof document === 'undefined') return false

  return (
    'startViewTransition' in document &&
    window.matchMedia('(prefers-reduced-motion: no-preference)').matches
  )
}

/**
 * Each DaisyUI theme mapped to its mode.
 *
 * When a user selects a "light" or "dark" theme, it should be saved to localstorage,
 * and used when the user wants to switch to "light" or "dark" mode.
 *
 * The color mode will always be "light" or "dark," while the theme will be any theme
 * that has the right mode.
 *
 * @example
 *
 * By default, the "light" theme will be used when "light" mode is toggled.
 *
 * If the user selects the "valentine" theme, then the "valentine" theme should be used
 * when "light" mode is toggled.
 */
export const themeMode = {
  light: 'light',
  dark: 'dark',
  cupcake: 'light',
  bumblebee: 'light',
  emerald: 'light',
  corporate: 'light',
  synthwave: 'dark',
  retro: 'light',
  cyberpunk: 'light',
  valentine: 'light',
  halloween: 'dark',
  garden: 'light',
  forest: 'dark',
  aqua: 'light',
  lofi: 'light',
  pastel: 'light',
  fantasy: 'light',
  wireframe: 'light',
  black: 'dark',
  luxury: 'dark',
  dracula: 'dark',
  cmyk: 'light',
  autumn: 'light',
  business: 'dark',
  acid: 'light',
  lemonade: 'light',
  night: 'dark',
  coffee: 'dark',
  winter: 'light',
  dim: 'dark',
  nord: 'dark',
  sunset: 'dark',
} as const satisfies Record<Theme, 'light' | 'dark'>

export function ThemeToggle() {
  const [mode, setMode] = useThemeState()

  const toggleTheme = async () => {
    if (!transitionsEnabled() || !window?.localStorage) {
      const currentMode = themeMode[mode]
      const nextMode = currentMode === 'dark' ? 'light' : 'dark'
      setMode(nextMode)
      return
    }

    animatedToggleTheme()
  }

  const animatedToggleTheme = async () => {
    const previousSwitch = window.localStorage.getItem('theme-switch')

    if (previousSwitch !== null && !isNaN(+previousSwitch)) {
      const previousSwitchTime = +previousSwitch

      if (Date.now() - previousSwitchTime > 3 * 60 * 1000) {
        if (document.documentElement.classList.contains('-animated')) {
          document.documentElement.classList.remove('-animated')
        }
      } else {
        document.documentElement.classList.add('-animated')
      }
    }

    window.localStorage.setItem('theme-switch', Date.now().toString())

    if (document.startViewTransition === undefined) return

    const transition = document.startViewTransition(async () => {
      flushSync(() => {
        const currentMode = themeMode[mode]
        const nextMode = currentMode === 'dark' ? 'light' : 'dark'
        setMode(nextMode)
      })
    })

    await transition.ready
  }

  return (
    <>
      <Helmet key={mode} htmlAttributes={{ 'data-theme': mode }}></Helmet>

      <button
        onClick={toggleTheme}
        className={cn(
          'btn btn-xs btn-outline',
          'swap swap-rotate',
          mode === 'dark' && 'swap-active',
          'h-7 w-7',
        )}
      >
        <span className="swap-on icon-[material-symbols--light-mode-outline-rounded] fill-current"></span>
        <span className="swap-off icon-[material-symbols--dark-mode-outline-rounded] fill-current"></span>
      </button>
    </>
  )
}
