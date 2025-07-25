<script lang="ts">
  import { useProsemirrorAdapterProvider } from '@prosemirror-adapter/svelte'
  import type { Snippet } from 'svelte'

  useProsemirrorAdapterProvider()

  let { children }: { children?: Snippet } = $props()
</script>

{@render children?.()}
