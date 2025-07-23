<script lang="ts">
  import { bundledLanguages } from 'shiki'
  import type { HTMLAttributes } from 'svelte/elements'

  import { browser } from '$app/environment'
  import { highlighter } from '$lib/shiki'
  import { parseMetaString } from '$lib/unified/parse-meta'

  interface $$Props extends HTMLAttributes<HTMLElement> {
    /**
     * Meta string.
     */
    meta?: string
  }

  let { children, meta, ...restProps }: $$Props = $props()

  const parsedMeta = $derived(parseMetaString(meta || ''))

  const lang = $derived(parsedMeta.lang)

  // This runs on the server to update the global highlighter instance.
  // svelte-ignore state_referenced_locally
  if (!browser && lang in bundledLanguages) {
    highlighter.loadLanguage(lang)
  }

  $effect(() => {
    if (lang in bundledLanguages) {
      highlighter.loadLanguage(lang)
    }
  })
</script>

<code {...restProps}>{@render children?.()}</code>
