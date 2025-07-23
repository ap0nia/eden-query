<script lang="ts">
  import '../app.css'

  import ThemeModeWatcher from '$lib/components/theme-mode-watcher.svelte'

  import type { LayoutProps } from './$types'

  let { children }: LayoutProps = $props()
</script>

<ThemeModeWatcher />

{@render children()}
