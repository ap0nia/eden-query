<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements'

  import PreCode from '$lib/components/markdown/pre-code.svelte'
  import PreMermaid from '$lib/components/markdown/pre-mermaid.svelte'
  import { parseMetaString } from '$lib/unified/parse-meta'

  interface $$Props extends HTMLAttributes<HTMLElement> {
    /**
     * Meta string.
     */
    meta?: string
  }

  let { meta, children, ...rest }: $$Props = $props()

  const parsedMeta = $derived(typeof meta === 'string' ? parseMetaString(meta) : {})

  const propsWithMeta = $derived({ ...parsedMeta, ...rest })

  const lang = $derived(propsWithMeta.lang?.toLowerCase())
</script>

{#if lang === 'mermaid'}
  <PreMermaid {...propsWithMeta}>{@render children?.()}</PreMermaid>
{:else}
  <PreCode {...propsWithMeta}>{@render children?.()}</PreCode>
{/if}
