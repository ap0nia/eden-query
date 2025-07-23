<script lang="ts" module>
  import { ModeWatcher } from 'mode-watcher'
  import type { ComponentProps } from 'svelte'

  export type ModeWatcherProps = ComponentProps<typeof ModeWatcher>

  /**
   * {@link sessionStorage} keys to store the most recent themes under.
   */
  export interface ThemeStorageKey {
    light: string
    dark: string
  }

  /**
   * The default keys to store the most recent themes under.
   */
  export const DEFAULT_THEME_STORAGE_KEYS = {
    light: 'mode-watcher-light-theme',
    dark: 'mode-watcher-dark-theme',
  } satisfies ThemeStorageKey
</script>

<script lang="ts">
  import daisyThemes from 'daisyui/theme/object'
  import { mode, setMode, setTheme, theme } from 'mode-watcher'
  import { untrack } from 'svelte'

  interface $$Props extends ModeWatcherProps {
    /**
     * Keys used to store the most recent "light" and "dark" themes in {@link localStorage}.
     */
    keys?: Partial<ThemeStorageKey>
  }

  let { keys, ...props }: $$Props = $props()

  const THEME_STORAGE_KEYS = $derived({ ...DEFAULT_THEME_STORAGE_KEYS, keys })

  // Update the theme if the mode has changed.
  // Uses with the most recent, appropriate theme in localStorage if possible.
  // The modes, "light" and "dark", are also valid themes and are used as fallbacks.
  $effect(() => {
    // Sometimes there may not be a mode loaded.
    // For example, the server will not have any mode or theme information unless it is stored in cookies.
    if (!mode.current) return

    const newTheme = localStorage.getItem(THEME_STORAGE_KEYS[mode.current]) || mode.current

    untrack(() => {
      setTheme(newTheme)
    })
  })

  // Update the mode if the theme has changed.
  // In order for "toggle mode" to work, this effect must run after the new theme has been resolved.
  $effect(() => {
    // Sometimes there may not be a theme loaded.
    // For example, the server will not have any mode or theme information unless it is stored in cookies.
    if (!theme.current) return

    const daisyTheme = daisyThemes[theme.current]

    if (!daisyTheme) return

    const colorScheme = daisyTheme['color-scheme']

    const newMode = colorScheme === 'dark' || colorScheme === 'light' ? colorScheme : 'system'

    if (mode.current && newMode !== 'system') {
      localStorage.setItem(THEME_STORAGE_KEYS[newMode], theme.current)
    }

    untrack(() => {
      setMode(newMode)
    })
  })
</script>

<!--

@component

Extended implementation of {@link ModeWatcher} that synchronizes with light and dark
themes from DaisyUI.

Themes from DaisyUI are associated with "light" or "dark" color schemes.
When the theme is changed, the current {@link mode} is updated accordingly.

The most recent "light" and "dark" themes are stored in {@link localStorage} and used
when switching between "light" and "dark" modes.

The theme and mode are applied to the document __before__ the page loads.
This is done with a combination of {@link $effect.pre} and injecting a script tag.

@see https://svelte.dev/docs/svelte/$effect#$effect.pre
@see https://github.com/svecosystem/mode-watcher/blob/441b87e978484af349a1f00f94a974aaf93e1e9b/packages/mode-watcher/src/lib/components/mode-watcher-full.svelte#L16-L29

For example.
1. The user is currently viewing the site in "dark" mode.
2. The user refreshes the page.
3. The server returns the same page, but in "light" mode since there is no mode or theme information on the server.
4. The application quickly applies the previous mode and theme prior to the page loading.
5. The document appears the same as before.
-->

<ModeWatcher {...props} />
