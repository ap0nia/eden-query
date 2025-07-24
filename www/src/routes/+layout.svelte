<script lang="ts">
  import '../app.css'

  import ThemeModeWatcher from '$lib/components/theme-mode-watcher.svelte'
  import * as Tooltip from '$lib/components/ui/tooltip'

  import type { LayoutProps } from './$types'

  let { children }: LayoutProps = $props()
</script>

<Tooltip.Provider>
  <ThemeModeWatcher />
  {@render children()}
</Tooltip.Provider>
