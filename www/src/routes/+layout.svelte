<script lang="ts">
  import '../app.css'

  import { useProsemirrorAdapterProvider } from '@prosemirror-adapter/svelte'

  import ThemeModeWatcher from '$lib/components/theme-mode-watcher.svelte'
  import * as Tooltip from '$lib/components/ui/tooltip'

  import type { LayoutProps } from './$types'

  let { children }: LayoutProps = $props()

  useProsemirrorAdapterProvider()
</script>

<Tooltip.Provider>
  <ThemeModeWatcher />
  {@render children()}
</Tooltip.Provider>
